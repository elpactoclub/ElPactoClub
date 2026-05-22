import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserLevel } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BadgesService } from '../badges/badges.service';

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
    private readonly badges: BadgesService,
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
      credits: 50, // welcome credits
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

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    await this.usersRepo.update(id, dto);
    return this.findById(id);
  }

  async addXP(userId: string, amount: number): Promise<User> {
    const user = await this.findById(userId);
    const newXP = user.xp + amount;
    const newLevel = computeLevel(newXP);
    await this.usersRepo.update(userId, { xp: newXP, level: newLevel });
    return this.findById(userId);
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

    await this.usersRepo.update(userId, {
      isSocio: true,
      socioSince: now,
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

  async updateOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    await this.usersRepo.update(userId, {
      isOnline,
      lastSeenAt: new Date(),
    });
  }

  async getOnlineCount(): Promise<{ count: number }> {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const count = await this.usersRepo
      .createQueryBuilder('u')
      .where('u.isOnline = :online', { online: true })
      .andWhere('u.lastSeenAt > :time', { time: fiveMinAgo })
      .getCount();
    return { count };
  }

  async getLeaderboard(limit = 50): Promise<User[]> {
    return this.usersRepo.find({
      order: { xp: 'DESC' },
      take: limit,
      select: ['id', 'name', 'avatar', 'city', 'xp', 'level', 'isSocio'],
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
}