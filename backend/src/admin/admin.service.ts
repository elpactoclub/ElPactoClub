import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/user.entity';
import { Event, EventAttendee } from '../events/event.entity';
import { Vote, UserVote, VoteCategory, VotationType } from '../gamification/vote.entity';
import { Raffle, RaffleEntry } from '../gamification/raffle.entity';
import { Mission } from '../missions/mission.entity';
import { Post } from '../community/post.entity';
import { StoreBenefit } from '../store/store-benefit.entity';
import { Project } from '../projects/project.entity';
import { ClubCreator } from '../club-creators/club-creator.entity';
import { SettingsService } from '../settings/settings.service';
import { DmService } from '../dm/dm.service';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';
import { CreateEventAdminDto, UpdateEventAdminDto } from './dto/event-admin.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Event) private readonly events: Repository<Event>,
    @InjectRepository(EventAttendee) private readonly attendees: Repository<EventAttendee>,
    @InjectRepository(Vote) private readonly votes: Repository<Vote>,
    @InjectRepository(UserVote) private readonly userVotes: Repository<UserVote>,
    @InjectRepository(Raffle) private readonly raffles: Repository<Raffle>,
    @InjectRepository(RaffleEntry) private readonly raffleEntries: Repository<RaffleEntry>,
    @InjectRepository(Mission) private readonly missions: Repository<Mission>,
    @InjectRepository(Post) private readonly posts: Repository<Post>,
    @InjectRepository(StoreBenefit) private readonly storeBenefits: Repository<StoreBenefit>,
    @InjectRepository(Project) private readonly projects: Repository<Project>,
    @InjectRepository(ClubCreator) private readonly clubCreators: Repository<ClubCreator>,
    private readonly settings: SettingsService,
    private readonly usersService: UsersService,
    private readonly notifications: NotificationsService,
    private readonly dm: DmService,
  ) {}

  /** Envía un DM (bandeja de mensajes) a todos o a usuarios elegidos. */
  sendAdminDm(senderId: string, content: string, userIds?: string[]) {
    return this.dm.broadcast(senderId, content, userIds);
  }

  // ──────────────────────────────────────────────────────────────────────
  // DASHBOARD STATS
  // ──────────────────────────────────────────────────────────────────────
  async getStats() {
    const [totalUsers, totalEvents, totalVotes, totalMissions, totalPosts] = await Promise.all([
      this.users.count(),
      this.events.count(),
      this.votes.count(),
      this.missions.count(),
      this.posts.count(),
    ]);
    const socios = await this.users.count({ where: { isSocio: true } });
    const creators = await this.users.count({ where: { role: 'creator' } });
    const admins = await this.users.count({ where: { role: 'admin' } });
    const onlineNow = await this.users
      .createQueryBuilder('u')
      .where('u.isOnline = :v', { v: true })
      .andWhere('u.lastSeenAt > :since', { since: new Date(Date.now() - 5 * 60 * 1000) })
      .getCount();

    const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsers7d = await this.users
      .createQueryBuilder('u')
      .where('u."createdAt" > :d', { d: last7d })
      .getCount();

    return {
      users: { total: totalUsers, socios, creators, admins, onlineNow, newUsers7d },
      events: { total: totalEvents },
      votes: { total: totalVotes },
      missions: { total: totalMissions },
      posts: { total: totalPosts },
    };
  }

  // ──────────────────────────────────────────────────────────────────────
  // USERS
  // ──────────────────────────────────────────────────────────────────────
  async listUsers(page = 1, limit = 30, search?: string, filter?: string) {
    const qb = this.users.createQueryBuilder('u').orderBy('u.createdAt', 'DESC');
    const conditions: string[] = [];
    const params: Record<string, unknown> = {};

    if (search) {
      conditions.push('(u.email ILIKE :s OR u.name ILIKE :s OR u.city ILIKE :s)');
      params.s = `%${search}%`;
    }
    if (filter === 'socio')   { conditions.push('u.isSocio = true'); }
    if (filter === 'creator') { conditions.push("u.role = 'creator'"); }
    if (filter === 'admin')   { conditions.push("u.role = 'admin'"); }
    if (filter === 'fan')     { conditions.push("u.role = 'fan' AND u.isSocio = false"); }

    if (conditions.length) qb.where(conditions.join(' AND '), params);
    const [items, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();
    return {
      items: items.map((u) => this.publicUser(u)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUser(id: string) {
    const u = await this.users.findOne({ where: { id } });
    if (!u) throw new NotFoundException('User not found');
    return this.publicUser(u);
  }

  async createUser(dto: {
    email: string; password: string; name?: string; role?: string;
    city?: string; country?: string; isSocio?: boolean; credits?: number; xp?: number;
  }) {
    if (!dto.email || !dto.password) throw new BadRequestException('Email y contraseña son obligatorios');
    if (dto.password.length < 8) throw new BadRequestException('La contraseña debe tener al menos 8 caracteres');

    // Base creation (hash, referral code, welcome credits, badges)
    const created = await this.usersService.create({
      email: dto.email,
      password: dto.password,
      name: dto.name,
      city: dto.city,
      country: dto.country,
    } as any);

    // Admin overrides
    const patch: Record<string, unknown> = {};
    if (dto.role) patch.role = dto.role;
    if (typeof dto.isSocio === 'boolean') patch.isSocio = dto.isSocio;
    if (typeof dto.credits === 'number') patch.credits = Math.max(0, dto.credits);
    if (typeof dto.xp === 'number') {
      const xp = Math.max(0, dto.xp);
      patch.xp = xp;
      patch.level = xp >= 5000 ? 'Leyenda' : xp >= 2000 ? 'MVP' : xp >= 500 ? 'Starter' : 'Rookie';
    }
    if (Object.keys(patch).length) await this.users.update(created.id, patch);

    return this.getUser(created.id);
  }

  async updateUser(id: string, dto: UpdateUserAdminDto) {
    const u = await this.users.findOne({ where: { id } });
    if (!u) throw new NotFoundException('User not found');

    // email y password se tratan aparte (validación + hash); el resto se asigna directo
    const { email, password, ...rest } = dto;
    Object.assign(u, rest);

    if (email && email.trim().toLowerCase() !== u.email) {
      const e = email.trim().toLowerCase();
      const existing = await this.users.findOne({ where: { email: e } });
      if (existing && existing.id !== id) throw new BadRequestException('Ese email ya está en uso');
      u.email = e;
    }

    if (password) {
      u.password = await bcrypt.hash(password, 12);
    }

    if (dto.xp !== undefined) {
      const xp = Math.max(0, dto.xp);
      u.xp = xp;
      u.level = xp >= 5000 ? 'Leyenda' : xp >= 2000 ? 'MVP' : xp >= 500 ? 'Starter' : 'Rookie';
    }
    await this.users.save(u);
    return this.publicUser(u);
  }

  async deleteUser(id: string) {
    const result = await this.users.delete(id);
    if (!result.affected) throw new NotFoundException('User not found');
    return { ok: true };
  }

  async bulkUpdateXP(mode: 'add' | 'set', amount: number) {
    const allUsers = await this.users.find({ select: ['id', 'xp'] });
    const updates = allUsers.map((u) => {
      const newXP = Math.max(0, mode === 'add' ? u.xp + amount : amount);
      const level = newXP >= 5000 ? 'Leyenda' : newXP >= 2000 ? 'MVP' : newXP >= 500 ? 'Starter' : 'Rookie';
      return this.users.update(u.id, { xp: newXP, level });
    });
    await Promise.all(updates);
    return { ok: true, affected: allUsers.length };
  }

  private publicUser(u: User) {
    const { password, ...rest } = u;
    return rest;
  }

  // ──────────────────────────────────────────────────────────────────────
  // EVENTS
  // ──────────────────────────────────────────────────────────────────────
  async listEvents() {
    const events = await this.events.find({ order: { date: 'ASC' } });
    if (events.length === 0) return [];
    // Real attendee counts from the actual rows (the stored counter can drift)
    const rows = await this.attendees
      .createQueryBuilder('a')
      .select('a.eventId', 'eventId')
      .addSelect('COUNT(*)', 'count')
      .where('a.eventId IN (:...ids)', { ids: events.map((e) => e.id) })
      .groupBy('a.eventId')
      .getRawMany();
    const countMap = new Map(rows.map((r) => [r.eventId, Number(r.count)]));
    return events.map((e) => ({ ...e, attendeesCount: countMap.get(e.id) ?? 0 }));
  }

  async getEvent(id: string) {
    const e = await this.events.findOne({ where: { id } });
    if (!e) throw new NotFoundException('Event not found');
    return e;
  }

  createEvent(dto: CreateEventAdminDto) {
    const event = this.events.create({ ...dto, date: new Date(dto.date), status: 'approved' });
    return this.events.save(event);
  }

  async updateEvent(id: string, dto: UpdateEventAdminDto) {
    const e = await this.events.findOne({ where: { id } });
    if (!e) throw new NotFoundException('Event not found');
    Object.assign(e, { ...dto, date: dto.date ? new Date(dto.date) : e.date });
    return this.events.save(e);
  }

  async deleteEvent(id: string) {
    const r = await this.events.delete(id);
    if (!r.affected) throw new NotFoundException('Event not found');
    return { ok: true };
  }

  getPendingEvents() {
    return this.events.find({ where: { status: 'pending' }, order: { createdAt: 'ASC' } });
  }

  async approveEvent(id: string) {
    const e = await this.events.findOne({ where: { id } });
    if (!e) throw new NotFoundException('Event not found');
    e.status = 'approved';
    return this.events.save(e);
  }

  async rejectEvent(id: string) {
    const e = await this.events.findOne({ where: { id } });
    if (!e) throw new NotFoundException('Event not found');
    e.status = 'rejected';
    return this.events.save(e);
  }

  // ──────────────────────────────────────────────────────────────────────
  // VOTES
  // ──────────────────────────────────────────────────────────────────────
  async listVotes() {
    const rows = await this.userVotes.find({ order: { createdAt: 'DESC' }, take: 500 });
    if (rows.length === 0) return [];
    const userIds = [...new Set(rows.map((r) => r.userId))];
    const [allVotes, userList] = await Promise.all([
      this.votes.find(),
      this.users.find({ where: { id: In(userIds) } }),
    ]);
    const votesById = new Map(allVotes.map((v) => [v.id, v]));
    // Fallback: match vote by option text when voteId is stale
    const voteByOption = new Map<string, typeof allVotes[0]>();
    for (const v of allVotes) {
      for (const opt of v.options ?? []) {
        if (!voteByOption.has(opt)) voteByOption.set(opt, v);
      }
    }
    const usersById = new Map(userList.map((u) => [u.id, u]));
    return rows
      .map((r) => {
        // Only keep votes linked to a still-existing votación (skip orphans)
        const vote = votesById.get(r.voteId) ?? voteByOption.get(r.selectedOption);
        if (!vote) return null;
        return {
          id: r.id,
          voteId: r.voteId,
          voteTitle: vote.title,
          userId: r.userId,
          userName: usersById.get(r.userId)?.name ?? '—',
          userAvatar: usersById.get(r.userId)?.avatar ?? null,
          option: r.selectedOption,
          createdAt: r.createdAt,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }

  // ──────────────────────────────────────────────────────────────────────
  // EVENT ATTENDEES (admin: remove with refund)
  // ──────────────────────────────────────────────────────────────────────
  async removeAttendee(eventId: string, userId: string) {
    const attendee = await this.attendees.findOne({ where: { eventId, userId } });
    if (!attendee) throw new NotFoundException('Attendee not found');
    const event = await this.events.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');
    await this.attendees.delete({ eventId, userId });
    await this.events.update(eventId, { attendeesCount: Math.max(0, event.attendeesCount - 1) });
    if (event.creditsCost > 0) {
      await this.usersService.addCredits(userId, event.creditsCost);
    }
    return { ok: true, refunded: event.creditsCost };
  }

  // ──────────────────────────────────────────────────────────────────────
  // MISSIONS
  // ──────────────────────────────────────────────────────────────────────
  listMissions() {
    return this.missions.find();
  }

  async resetMission(code: string) {
    const m = await this.missions.findOne({ where: { code } });
    if (!m) throw new NotFoundException('Mission not found');
    m.current = 0;
    m.isComplete = false;
    return this.missions.save(m);
  }

  async updateMission(code: string, dto: { title?: string; description?: string; target?: number; reward?: string; isActive?: boolean }) {
    const m = await this.missions.findOne({ where: { code } });
    if (!m) throw new NotFoundException('Mission not found');
    Object.assign(m, dto);
    return this.missions.save(m);
  }

  // ──────────────────────────────────────────────────────────────────────
  // CREATOR STATS
  // ──────────────────────────────────────────────────────────────────────
  async getCreatorStats(userId: string) {
    const myPosts = await this.posts.find({ where: { authorId: userId }, order: { createdAt: 'DESC' } });
    const totalLikes = myPosts.reduce((sum, p) => sum + (p.likesCount ?? 0), 0);
    return {
      totalPosts: myPosts.length,
      totalLikes,
      avgLikes: myPosts.length > 0 ? Math.round(totalLikes / myPosts.length) : 0,
      posts: myPosts.map((p) => ({
        id: p.id,
        content: p.content,
        type: p.type,
        likesCount: p.likesCount ?? 0,
        pollOptions: p.pollOptions,
        pollVotes: p.pollVotes,
        pollClosed: p.pollClosed,
        imageUrl: p.imageUrl,
        createdAt: p.createdAt,
      })),
    };
  }

  // ──────────────────────────────────────────────────────────────────────
  // SETTINGS
  // ──────────────────────────────────────────────────────────────────────
  getSettings() {
    return this.settings.getAll();
  }

  updateSetting(key: string, value: string) {
    return this.settings.set(key, value);
  }

  // ──────────────────────────────────────────────────────────────────────
  // POSTS (moderation)
  // ──────────────────────────────────────────────────────────────────────
  async listPosts(limit = 50) {
    const postList = await this.posts.find({ order: { createdAt: 'DESC' }, take: limit });
    if (postList.length === 0) return [];
    const authorIds = [...new Set(postList.map((p) => p.authorId))];
    const authorList = await this.users.find({ where: { id: In(authorIds) } });
    const authorsById = new Map(authorList.map((u) => [u.id, u]));
    return postList.map((p) => {
      const author = authorsById.get(p.authorId);
      return {
        ...p,
        authorName: author?.name ?? '—',
        authorAvatar: author?.avatar ?? null,
        authorEmail: author?.email ?? null,
      };
    });
  }

  async deletePost(id: string) {
    const r = await this.posts.delete(id);
    if (!r.affected) throw new NotFoundException('Post not found');
    return { ok: true };
  }

  // ──────────────────────────────────────────────────────────────────────
  // VOTE OBJECTS (create / manage)
  // ──────────────────────────────────────────────────────────────────────
  listVoteObjects() {
    return this.votes.find({ order: { createdAt: 'DESC' } });
  }

  async createVoteObject(dto: {
    title: string; description?: string; category: VoteCategory; votationType?: VotationType;
    options: string[]; creditsCost?: number; xpReward?: number; closesAt?: string; isActive?: boolean;
  }) {
    const results: Record<string, number> = {};
    for (const opt of dto.options) results[opt] = 0;
    const vote = this.votes.create({
      ...dto,
      results,
      closesAt: dto.closesAt ? new Date(dto.closesAt) : undefined,
    });
    return this.votes.save(vote);
  }

  async updateVoteObject(id: string, dto: Partial<{
    title: string; description: string; category: VoteCategory; votationType: VotationType;
    options: string[]; creditsCost: number; xpReward: number; closesAt: string;
    isActive: boolean; correctOption: string;
  }>) {
    const vote = await this.votes.findOneBy({ id });
    if (!vote) throw new NotFoundException('Votación no encontrada');
    if (dto.options) {
      const results: Record<string, number> = {};
      for (const opt of dto.options) results[opt] = vote.results[opt] ?? 0;
      vote.results = results;
    }
    if (dto.closesAt) { vote.closesAt = new Date(dto.closesAt); delete (dto as any).closesAt; }
    Object.assign(vote, dto);
    return this.votes.save(vote);
  }

  async deleteVoteObject(id: string) {
    await this.votes.delete(id);
    await this.userVotes.delete({ voteId: id });
    return { ok: true };
  }

  async settleVote(id: string, correctOption: string) {
    const vote = await this.votes.findOneBy({ id });
    if (!vote) throw new NotFoundException('Votación no encontrada');
    vote.correctOption = correctOption;
    vote.settledAt = new Date();
    vote.isActive = false;
    return this.votes.save(vote);
  }

  // ──────────────────────────────────────────────────────────────────────
  // RAFFLES
  // ──────────────────────────────────────────────────────────────────────
  async listRaffles() {
    const raffles = await this.raffles.find({ order: { createdAt: 'DESC' } });
    const results = await Promise.all(raffles.map(async (r) => {
      const winner = r.winnerId ? await this.users.findOne({ where: { id: r.winnerId }, select: ['id', 'name', 'email'] }) : null;
      return { ...r, winnerName: winner?.name, winnerEmail: winner?.email };
    }));
    return results;
  }

  /** Participants of a raffle with their info (name, email, tickets, date). */
  async listRaffleEntries(raffleId: string) {
    const entries = await this.raffleEntries.find({ where: { raffleId }, order: { createdAt: 'ASC' } });
    if (entries.length === 0) return [];
    const users = await this.users.find({ where: { id: In(entries.map((e) => e.userId)) } });
    const byId = new Map(users.map((u) => [u.id, u]));
    return entries.map((e) => {
      const u = byId.get(e.userId);
      return {
        userId: e.userId,
        name: u?.name ?? 'Usuario',
        avatar: u?.avatar ?? '🏀',
        email: u?.email ?? '',
        city: u?.city ?? null,
        country: u?.country ?? null,
        isSocio: u?.isSocio ?? false,
        tickets: e.tickets,
        createdAt: e.createdAt,
      };
    });
  }

  async createRaffle(dto: {
    title: string; description?: string; prizeValue: number;
    ticketCost?: number; xpReward?: number; month?: string;
    prizeImageUrl?: string; drawDate?: string; audience?: string;
  }) {
    const raffle = this.raffles.create(dto);
    return this.raffles.save(raffle);
  }

  async updateRaffle(id: string, dto: Partial<{
    title: string; description: string; prizeValue: number;
    ticketCost: number; xpReward: number; isActive: boolean; month: string;
    prizeImageUrl: string; drawDate: string; audience: string;
  }>) {
    const raffle = await this.raffles.findOneBy({ id });
    if (!raffle) throw new NotFoundException('Sorteo no encontrado');
    Object.assign(raffle, dto);
    return this.raffles.save(raffle);
  }

  async drawRaffle(id: string) {
    const raffle = await this.raffles.findOneBy({ id });
    if (!raffle) throw new NotFoundException('Sorteo no encontrado');
    const entries = await this.raffleEntries.find({ where: { raffleId: id } });
    if (entries.length === 0) throw new BadRequestException('El sorteo no tiene participantes');
    const pool: string[] = [];
    for (const e of entries) { for (let i = 0; i < e.tickets; i++) pool.push(e.userId); }
    const winnerId = pool[Math.floor(Math.random() * pool.length)];
    const winner = await this.users.findOne({ where: { id: winnerId }, select: ['id', 'name', 'email'] });
    await this.raffles.update(id, { winnerId, drawDate: new Date(), isActive: false });
    await this.notifications.notify(winnerId, 'raffle_win', '🎉 ¡Has ganado el sorteo!', raffle.title, { raffleId: id });
    return { winnerId, winnerName: winner?.name ?? '—', winnerEmail: winner?.email ?? '—' };
  }

  async deleteRaffle(id: string) {
    await this.raffleEntries.delete({ raffleId: id });
    await this.raffles.delete(id);
    return { ok: true };
  }

  // ──────────────────────────────────────────────────────────────────────
  // STORE BENEFITS
  // ──────────────────────────────────────────────────────────────────────
  listStoreBenefits() {
    return this.storeBenefits.find({ order: { displayOrder: 'ASC', createdAt: 'ASC' } });
  }

  createStoreBenefit(dto: {
    name: string; description?: string; discount?: string; emoji?: string;
    imageUrl?: string; color?: string; link?: string; displayOrder?: number; isActive?: boolean;
  }) {
    const benefit = this.storeBenefits.create(dto);
    return this.storeBenefits.save(benefit);
  }

  async updateStoreBenefit(id: string, dto: Partial<{
    name: string; description: string; discount: string; emoji: string;
    imageUrl: string; color: string; link: string; displayOrder: number; isActive: boolean;
  }>) {
    const benefit = await this.storeBenefits.findOneBy({ id });
    if (!benefit) throw new NotFoundException('Beneficio no encontrado');
    Object.assign(benefit, dto);
    return this.storeBenefits.save(benefit);
  }

  async deleteStoreBenefit(id: string) {
    await this.storeBenefits.delete(id);
    return { ok: true };
  }

  // ──────────────────────────────────────────────────────────────────────
  // IMPACT PROJECTS
  // ──────────────────────────────────────────────────────────────────────
  listProjects() {
    return this.projects.find({ order: { displayOrder: 'ASC', createdAt: 'ASC' } });
  }

  private slugify(text: string): string {
    const cleaned = (text || 'proyecto')
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '') // strip accents
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);
    return cleaned || 'proyecto';
  }

  async createProject(dto: {
    title: string; slug?: string; emoji?: string; subtitle?: string; summary?: string;
    description?: string; color?: string; badgeLabel?: string; displayOrder?: number; isActive?: boolean;
    imageUrl?: string;
  }) {
    let slug = (dto.slug && dto.slug.trim()) ? this.slugify(dto.slug) : this.slugify(dto.title);
    // Ensure unique slug
    if (await this.projects.findOneBy({ slug })) {
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    }
    const project = this.projects.create({ ...dto, slug });
    return this.projects.save(project);
  }

  async updateProject(id: string, dto: Partial<{
    title: string; emoji: string; subtitle: string; summary: string;
    description: string; color: string; badgeLabel: string; displayOrder: number; isActive: boolean;
    imageUrl: string;
  }>) {
    const project = await this.projects.findOneBy({ id });
    if (!project) throw new NotFoundException('Proyecto no encontrado');
    // slug is intentionally immutable (chat channel & donations depend on it)
    const { ...rest } = dto as any;
    delete rest.slug;
    Object.assign(project, rest);
    return this.projects.save(project);
  }

  async deleteProject(id: string) {
    await this.projects.delete(id);
    return { ok: true };
  }

  // ──────────────────────────────────────────────────────────────────────
  // CLUB CREATORS (showcase cards in "El Pacto")
  // ──────────────────────────────────────────────────────────────────────
  /** Creator-role accounts available to feature as club creators. */
  async listCreatorUsers() {
    const users = await this.users.find({
      where: { role: 'creator' as any },
      select: ['id', 'name', 'avatar'],
      order: { name: 'ASC' },
    });
    return users;
  }

  async listClubCreators() {
    const cards = await this.clubCreators.find({ order: { displayOrder: 'ASC', createdAt: 'ASC' } });
    if (cards.length === 0) return [];
    const users = await this.users.find({ where: { id: In(cards.map((c) => c.userId)) }, select: ['id', 'name', 'avatar'] });
    const byId = new Map(users.map((u) => [u.id, u]));
    return cards.map((c) => ({
      ...c,
      currentName: byId.get(c.userId)?.name ?? c.name ?? '—',
      userAvatar: byId.get(c.userId)?.avatar ?? '🏀',
    }));
  }

  async createClubCreator(dto: { userId: string; name?: string; photoUrl?: string; displayOrder?: number; isActive?: boolean }) {
    const user = await this.users.findOne({ where: { id: dto.userId } });
    const card = this.clubCreators.create({ ...dto, name: dto.name ?? user?.name });
    return this.clubCreators.save(card);
  }

  async updateClubCreator(id: string, dto: Partial<{ userId: string; name: string; photoUrl: string; displayOrder: number; isActive: boolean }>) {
    const card = await this.clubCreators.findOneBy({ id });
    if (!card) throw new NotFoundException('Creador no encontrado');
    Object.assign(card, dto);
    return this.clubCreators.save(card);
  }

  async deleteClubCreator(id: string) {
    await this.clubCreators.delete(id);
    return { ok: true };
  }

  // ──────────────────────────────────────────────────────────────────────
  // NOTIFICATIONS (broadcast)
  // ──────────────────────────────────────────────────────────────────────
  async broadcastNotification(title: string, body: string) {
    await this.notifications.notifyAll('admin_broadcast', title, body, {});
    return { ok: true };
  }
}
