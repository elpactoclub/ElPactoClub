import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Event } from '../events/event.entity';
import { Vote } from '../gamification/vote.entity';
import { Mission } from '../missions/mission.entity';
import { Post } from '../community/post.entity';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';
import { CreateEventAdminDto, UpdateEventAdminDto } from './dto/event-admin.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Event) private readonly events: Repository<Event>,
    @InjectRepository(Vote) private readonly votes: Repository<Vote>,
    @InjectRepository(Mission) private readonly missions: Repository<Mission>,
    @InjectRepository(Post) private readonly posts: Repository<Post>,
  ) {}

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
  async listUsers(page = 1, limit = 30, search?: string) {
    const qb = this.users.createQueryBuilder('u').orderBy('u.createdAt', 'DESC');
    if (search) {
      qb.where('u.email ILIKE :s OR u.name ILIKE :s OR u.city ILIKE :s', { s: `%${search}%` });
    }
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

  async updateUser(id: string, dto: UpdateUserAdminDto) {
    const u = await this.users.findOne({ where: { id } });
    if (!u) throw new NotFoundException('User not found');
    Object.assign(u, dto);
    await this.users.save(u);
    return this.publicUser(u);
  }

  async deleteUser(id: string) {
    const result = await this.users.delete(id);
    if (!result.affected) throw new NotFoundException('User not found');
    return { ok: true };
  }

  private publicUser(u: User) {
    const { password, ...rest } = u;
    return rest;
  }

  // ──────────────────────────────────────────────────────────────────────
  // EVENTS
  // ──────────────────────────────────────────────────────────────────────
  listEvents() {
    return this.events.find({ order: { date: 'ASC' } });
  }

  async getEvent(id: string) {
    const e = await this.events.findOne({ where: { id } });
    if (!e) throw new NotFoundException('Event not found');
    return e;
  }

  createEvent(dto: CreateEventAdminDto) {
    const event = this.events.create({ ...dto, date: new Date(dto.date) });
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

  // ──────────────────────────────────────────────────────────────────────
  // VOTES
  // ──────────────────────────────────────────────────────────────────────
  listVotes() {
    return this.votes.find({ order: { createdAt: 'DESC' } });
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

  // ──────────────────────────────────────────────────────────────────────
  // POSTS (moderation)
  // ──────────────────────────────────────────────────────────────────────
  listPosts(limit = 50) {
    return this.posts.find({ order: { createdAt: 'DESC' }, take: limit });
  }

  async deletePost(id: string) {
    const r = await this.posts.delete(id);
    if (!r.affected) throw new NotFoundException('Post not found');
    return { ok: true };
  }
}
