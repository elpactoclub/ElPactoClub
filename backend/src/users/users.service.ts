import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, ILike, In } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserLevel } from './user.entity';
import { UserFollow } from './user-follow.entity';
import { UserBlock } from './user-block.entity';
import { UserVote } from '../gamification/vote.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BadgesService } from '../badges/badges.service';
import { NotificationsService } from '../notifications/notifications.service';

const LEVEL_THRESHOLDS: Record<UserLevel, number> = {
  Rookie: 0,
  Starter: 500,
  MVP: 2000,
  Leyenda: 5000,
};

function computeLevel(xp: number): UserLevel {
  if (xp >= LEVEL_THRESHOLDS.Leyenda) return 'Leyenda';
  if (xp >= LEVEL_THRESHOLDS.MVP) return 'MVP';
  if (xp >= LEVEL_THRESHOLDS.Starter) return 'Starter';
  return 'Rookie';
}

function generateReferralCode(name: string): string {
  const prefix = name.slice(0, 3).toUpperCase().replace(/\s/g, '');
  const num = Math.floor(Math.random() * 9000 + 1000);
  return `PACTO-${prefix}${num}`;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(UserVote)
    private readonly userVotesRepo: Repository<UserVote>,
    @InjectRepository(UserFollow)
    private readonly followsRepo: Repository<UserFollow>,
    @InjectRepository(UserBlock)
    private readonly blocksRepo: Repository<UserBlock>,
    private readonly badges: BadgesService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const hashed = await bcrypt.hash(dto.password, 12);

    const totalUsers = await this.usersRepo.count();
    const cityCount = dto.city
      ? await this.usersRepo.count({ where: { city: dto.city } })
      : 1;

    const user = this.usersRepo.create({
      ...dto,
      password: hashed,
      referralCode: generateReferralCode(dto.name ?? 'Fan'),
      credits: 2, // créditos de bienvenida (plan Fan Libre: 2/mes)
      xp: 0,
      level: 'Rookie',
    });

    const saved = await this.usersRepo.save(user);

    if (totalUsers === 0) {
      await this.badges.award(saved.id, 'og_dia_1');
    }
    if (cityCount === 0) {
      await this.badges.award(saved.id, 'embajador');
    }

    return saved;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByIdPublic(id: string) {
    const user = await this.usersRepo.findOne({
      where: { id },
      select: ['id', 'name', 'avatar', 'city', 'country', 'xp', 'level', 'isSocio', 'role', 'socioNumber', 'createdAt'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    await this.usersRepo.update(id, dto);
    return this.findById(id);
  }

  /** Cambiar email y/o contraseña del propio usuario (verifica la contraseña actual). */
  async updateCredentials(
    id: string,
    dto: { email?: string; currentPassword?: string; newPassword?: string },
  ): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const patch: Partial<User> = {};

    if (dto.email && dto.email.trim().toLowerCase() !== user.email) {
      const email = dto.email.trim().toLowerCase();
      const existing = await this.usersRepo.findOne({ where: { email } });
      if (existing && existing.id !== id) throw new ConflictException('Ese email ya está en uso');
      patch.email = email;
    }

    if (dto.newPassword) {
      // Si el usuario ya tiene contraseña, exige la actual y verifícala
      if (user.password) {
        if (!dto.currentPassword) throw new BadRequestException('Introduce tu contraseña actual');
        const ok = await bcrypt.compare(dto.currentPassword, user.password);
        if (!ok) throw new BadRequestException('La contraseña actual no es correcta');
      }
      patch.password = await bcrypt.hash(dto.newPassword, 12);
    }

    if (Object.keys(patch).length === 0) return this.findById(id);
    await this.usersRepo.update(id, patch);
    return this.findById(id);
  }

  /** Plan Fan Libre: 2 créditos cada mes para los fans (los socios reciben 200 al pagar). */
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async grantMonthlyFreeCredits() {
    const result = await this.usersRepo.increment({ isSocio: false }, 'credits', 2);
    console.log(`🎁 +2 créditos mensuales (Fan Libre) a ${result.affected ?? 0} fans`);
  }

  async addXP(userId: string, amount: number): Promise<User> {
    const user = await this.findById(userId);
    // Apply active XP multiplier
    let effective = amount;
    if (user.xpMultiplier > 1) {
      if (user.xpMultiplierExpiresAt && new Date(user.xpMultiplierExpiresAt) > new Date()) {
        effective = Math.round(amount * user.xpMultiplier);
      } else {
        // Expired — reset silently
        await this.usersRepo.update(userId, { xpMultiplier: 1, xpMultiplierExpiresAt: null as any });
      }
    }
    const newXP = user.xp + effective;
    const newLevel = computeLevel(newXP);
    await this.usersRepo.update(userId, { xp: newXP, level: newLevel });
    // Season badge: 1000 XP durante la temporada Verano 2026
    if (user.xp < 1000 && newXP >= 1000) {
      await this.badges.award(userId, 'temporada_verano_2026');
    }
    return this.findById(userId);
  }

  async markDailyClaimed(userId: string): Promise<void> {
    await this.usersRepo.update(userId, { dailyRewardClaimedAt: new Date() });
  }

  async setXPMultiplier(userId: string, multiplier: number, hours: number): Promise<void> {
    const expiresAt = new Date(Date.now() + hours * 3600 * 1000);
    await this.usersRepo.update(userId, { xpMultiplier: multiplier, xpMultiplierExpiresAt: expiresAt });
  }

  async updateWeekActivity(userId: string, bit: number): Promise<void> {
    const now = new Date();
    const year = now.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const weekNum = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
    const weekKey = `${year}-W${weekNum.toString().padStart(2, '0')}`;
    const user = await this.findById(userId);
    const currentBits = user.weekKey === weekKey ? user.weekBits : 0;
    const newBits = currentBits | bit;
    await this.usersRepo.update(userId, { weekKey, weekBits: newBits });
    if (newBits === 7) {
      await this.badges.award(userId, 'semana_perfecta');
    }
  }

  async addCredits(userId: string, amount: number): Promise<User> {
    const user = await this.findById(userId);
    await this.usersRepo.update(userId, { credits: user.credits + amount });
    return this.findById(userId);
  }

  async spendCredits(userId: string, amount: number): Promise<User> {
    const user = await this.findById(userId);
    if (user.credits < amount) throw new ConflictException('Insufficient credits');
    await this.usersRepo.update(userId, { credits: user.credits - amount });
    return this.findById(userId);
  }

  async claimDailyReward(userId: string): Promise<{ credits: number; xp: number }> {
    const user = await this.findById(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (user.dailyRewardClaimedAt) {
      const claimedDay = new Date(user.dailyRewardClaimedAt);
      claimedDay.setHours(0, 0, 0, 0);
      if (claimedDay.getTime() === today.getTime()) {
        throw new ConflictException('Daily reward already claimed today');
      }
    }

    // Calculate streak
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    let newStreak = user.streak;
    if (user.lastLoginDate) {
      const lastDay = new Date(user.lastLoginDate);
      lastDay.setHours(0, 0, 0, 0);
      newStreak = lastDay.getTime() === yesterday.getTime() ? user.streak + 1 : 1;
    } else {
      newStreak = 1;
    }

    // Base reward + streak bonus
    const baseCredits = 5;
    const streakBonus = Math.min(newStreak * 2, 20);
    const totalCredits = baseCredits + streakBonus;
    const xpGain = 10 + Math.min(newStreak * 3, 30);

    await this.usersRepo.update(userId, {
      credits: user.credits + totalCredits,
      xp: user.xp + xpGain,
      level: computeLevel(user.xp + xpGain),
      streak: newStreak,
      lastLoginDate: new Date(),
      dailyRewardClaimedAt: new Date(),
    });

    // Badges por streak
    if (newStreak >= 7) await this.badges.award(userId, 'llama_viva');
    if (newStreak >= 30) await this.badges.award(userId, 'diamante');

    return { credits: totalCredits, xp: xpGain };
  }

  async becomeSocio(userId: string): Promise<User> {
    const user = await this.findById(userId);
    if (user.isSocio) return user; // idempotente

    const now = new Date();
    const oneMonthFromCreate = new Date(user.createdAt);
    oneMonthFromCreate.setDate(oneMonthFromCreate.getDate() + 30);

    const maxResult = await this.usersRepo
      .createQueryBuilder('u')
      .select('MAX(u.socioNumber)', 'max')
      .where('u.isSocio = :v', { v: true })
      .getRawOne<{ max: number | null }>();
    const nextNumber = (maxResult?.max ?? 0) + 1;

    await this.usersRepo.update(userId, {
      isSocio: true,
      socioSince: now,
      socioNumber: nextNumber,
      role: 'socio',
      credits: user.credits + 200, // 200 créditos mensuales del plan socio
    });

    // Badge fundador si dentro del primer mes desde el registro
    if (now <= oneMonthFromCreate) {
      await this.badges.award(userId, 'fundador');
    }

    // Bonus de referidos: ambos +50 cuando el referido se hace socio (no en signup)
    if (user.referredBy) {
      const referrer = await this.usersRepo.findOne({ where: { referralCode: user.referredBy } });
      if (referrer) {
        const newReferralCount = referrer.referralCount + 1;
        await this.usersRepo.update(referrer.id, {
          credits: referrer.credits + 50,
          referralCount: newReferralCount,
        });
        await this.usersRepo.update(userId, { credits: user.credits + 200 + 50 });
        if (newReferralCount >= 3) {
          await this.badges.award(referrer.id, 'reclutador');
        }
      }
    }

    return this.findById(userId);
  }

  private readonly visitorSessions = new Map<string, Date>();

  async updateOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    await this.usersRepo.update(userId, {
      isOnline,
      lastSeenAt: new Date(),
    });
  }

  visitorPing(sessionId: string): void {
    this.visitorSessions.set(sessionId, new Date());
  }

  async getOnlineCount(): Promise<{ count: number }> {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    for (const [id, ts] of this.visitorSessions) {
      if (ts < fiveMinAgo) this.visitorSessions.delete(id);
    }
    return { count: this.visitorSessions.size };
  }

  async getFansCount(): Promise<{ count: number }> {
    const count = await this.usersRepo.count();
    return { count };
  }

  /** Fan counts grouped by country (for the "fans por país" map), most fans first. */
  async getFansByCountry(): Promise<{ country: string; count: number }[]> {
    const rows = await this.usersRepo
      .createQueryBuilder('u')
      .select('COALESCE(NULLIF(u.country, \'\'), :unknown)', 'country')
      .addSelect('COUNT(*)', 'count')
      .setParameter('unknown', 'Otros')
      .groupBy('country')
      .orderBy('count', 'DESC')
      .getRawMany();
    return rows.map((r) => ({ country: r.country, count: Number(r.count) }));
  }

  async getLeaderboard(limit = 50): Promise<User[]> {
    return this.usersRepo.find({
      order: { xp: 'DESC' },
      take: limit,
      select: ['id', 'name', 'avatar', 'city', 'country', 'xp', 'level', 'isSocio'],
    });
  }

  async getRank(userId: string): Promise<number> {
    const user = await this.findById(userId);
    const count = await this.usersRepo
      .createQueryBuilder('u')
      .where('u.xp > :xp', { xp: user.xp })
      .getCount();
    return count + 1;
  }

  async setUserRole(email: string, role: 'admin' | 'creator' | 'fan'): Promise<{ ok: boolean; message: string }> {
    const user = await this.findByEmail(email);
    if (!user) return { ok: false, message: 'User not found' };
    await this.usersRepo.update(user.id, { role });
    return { ok: true, message: `User ${email} is now ${role}` };
  }

  async deleteByEmail(email: string): Promise<{ ok: boolean; message: string }> {
    const result = await this.usersRepo.delete({ email });
    if (result.affected === 0) return { ok: false, message: 'User not found' };
    return { ok: true, message: `User ${email} deleted` };
  }

  async getWeeklyVoteStats(userId: string): Promise<{ votes: number; clubPct: string }> {
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const [userVotes, totalVotes] = await Promise.all([
      this.userVotesRepo.count({ where: { userId, createdAt: MoreThan(since) } }),
      this.userVotesRepo.count({ where: { createdAt: MoreThan(since) } }),
    ]);

    const clubPct = totalVotes > 0
      ? ((userVotes / totalVotes) * 100).toFixed(1)
      : '0.0';

    return { votes: userVotes, clubPct };
  }

  async searchUsers(q: string, requesterId?: string) {
    if (!q || q.trim().length < 2) return [];
    const users = await this.usersRepo.find({
      where: [{ name: ILike(`%${q}%`) }],
      select: ['id', 'name', 'avatar', 'role', 'xp', 'level', 'city', 'isSocio'],
      take: 20,
    });
    if (!requesterId) return users.map((u) => ({ ...u, isFollowing: false, isBlocked: false }));
    const [followed, mutualBlocked] = await Promise.all([
      this.followsRepo.find({ where: { followerId: requesterId } }),
      this.getMutualBlockIds(requesterId),
    ]);
    const followedIds = new Set(followed.map((f) => f.followedId));
    const blockedSet = new Set(mutualBlocked);
    return users
      .filter((u) => !blockedSet.has(u.id))
      .map((u) => ({ ...u, isFollowing: followedIds.has(u.id) }));
  }

  async getPublicProfile(id: string, requesterId?: string) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    const { password, ...rest } = user as any;
    const [followersCount, followingCount] = await Promise.all([
      this.followsRepo.count({ where: { followedId: id } }),
      this.followsRepo.count({ where: { followerId: id } }),
    ]);
    const isFollowing = requesterId
      ? !!(await this.followsRepo.findOne({ where: { followerId: requesterId, followedId: id } }))
      : false;
    const isBlocked = requesterId
      ? !!(await this.blocksRepo.findOne({ where: { blockerId: requesterId, blockedId: id } }))
      : false;
    return { ...rest, followersCount, followingCount, isFollowing, isBlocked };
  }

  async getActivity(userId: string) {
    return this.notifications.listForUser(userId);
  }

  async getFollowers(userId: string) {
    const rows = await this.followsRepo.find({ where: { followedId: userId } });
    if (!rows.length) return [];
    const ids = rows.map((r) => r.followerId);
    const users = await this.usersRepo.find({ where: { id: In(ids) } });
    return users.map((u) => ({ id: u.id, name: u.name, avatar: u.avatar, level: u.level, xp: u.xp, city: u.city, isSocio: u.isSocio, role: u.role }));
  }

  async getFollowing(userId: string) {
    const rows = await this.followsRepo.find({ where: { followerId: userId } });
    if (!rows.length) return [];
    const ids = rows.map((r) => r.followedId);
    const users = await this.usersRepo.find({ where: { id: In(ids) } });
    return users.map((u) => ({ id: u.id, name: u.name, avatar: u.avatar, level: u.level, xp: u.xp, city: u.city, isSocio: u.isSocio, role: u.role }));
  }

  async follow(followerId: string, followedId: string) {
    if (followerId === followedId) throw new BadRequestException('No puedes seguirte a ti mismo');
    const existing = await this.followsRepo.findOne({ where: { followerId, followedId } });
    if (!existing) {
      await this.followsRepo.save({ followerId, followedId });
      const follower = await this.usersRepo.findOne({ where: { id: followerId }, select: ['name'] });
      this.notifications.notify(followedId, 'new_follow', 'Nuevo seguidor', `${follower?.name ?? 'Alguien'} ha empezado a seguirte`, { followerId }).catch(() => {});
    }
    const count = await this.followsRepo.count({ where: { followedId } });
    return { following: true, followersCount: count };
  }

  async unfollow(followerId: string, followedId: string) {
    await this.followsRepo.delete({ followerId, followedId });
    const count = await this.followsRepo.count({ where: { followedId } });
    return { following: false, followersCount: count };
  }

  // ─── BLOCKS ──────────────────────────────────────────────────────────────
  async getFollowingIds(userId: string): Promise<string[]> {
    const rows = await this.followsRepo.find({ where: { followerId: userId } });
    return rows.map((r) => r.followedId);
  }

  /** IDs the user has blocked. */
  async getBlockedIds(userId: string): Promise<string[]> {
    const rows = await this.blocksRepo.find({ where: { blockerId: userId } });
    return rows.map((r) => r.blockedId);
  }

  /** IDs of users in either direction of a block with this user (hide both ways). */
  async getMutualBlockIds(userId: string): Promise<string[]> {
    const rows = await this.blocksRepo.find({
      where: [{ blockerId: userId }, { blockedId: userId }],
    });
    const ids = new Set<string>();
    for (const r of rows) ids.add(r.blockerId === userId ? r.blockedId : r.blockerId);
    return [...ids];
  }

  async blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) throw new BadRequestException('No puedes bloquearte a ti mismo');
    const existing = await this.blocksRepo.findOne({ where: { blockerId, blockedId } });
    if (!existing) await this.blocksRepo.save({ blockerId, blockedId });
    // Blocking removes any follow relationship in both directions
    await this.followsRepo.delete({ followerId: blockerId, followedId: blockedId });
    await this.followsRepo.delete({ followerId: blockedId, followedId: blockerId });
    return { blocked: true };
  }

  async unblockUser(blockerId: string, blockedId: string) {
    await this.blocksRepo.delete({ blockerId, blockedId });
    return { blocked: false };
  }

  async getBlockedUsers(userId: string) {
    const ids = await this.getBlockedIds(userId);
    if (!ids.length) return [];
    const users = await this.usersRepo.find({ where: { id: In(ids) } });
    return users.map((u) => ({ id: u.id, name: u.name, avatar: u.avatar, level: u.level, xp: u.xp, city: u.city, isSocio: u.isSocio, role: u.role }));
  }
}