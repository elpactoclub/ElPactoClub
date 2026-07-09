// EN: Admin service: business logic for the admin panel (stats, users, events, votes, raffles, store, projects, creators, notifications).
// ES: Servicio de admin: lógica del panel de administración (estadísticas, usuarios, eventos, votaciones, sorteos, tienda, proyectos, creadores, notificaciones).
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/user.entity';
import { Event, EventAttendee } from '../events/event.entity';
import { Vote, UserVote, VoteCategory, VotationType } from '../gamification/vote.entity';
import { Raffle, RaffleEntry } from '../gamification/raffle.entity';
import { Mission } from '../missions/mission.entity';
import { Post, Message, PostComment } from '../community/post.entity';
import { StoreBenefit } from '../store/store-benefit.entity';
import { Project } from '../projects/project.entity';
import { ClubCreator } from '../club-creators/club-creator.entity';
import { Badge, UserBadge } from '../badges/badge.entity';
import { BadgesService } from '../badges/badges.service';
import { SettingsService } from '../settings/settings.service';
import { DmService } from '../dm/dm.service';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';
import { CreateEventAdminDto, UpdateEventAdminDto } from './dto/event-admin.dto';

// EN: Injectable admin service aggregating repositories and helper services.
// ES: Servicio de admin inyectable que agrupa repositorios y servicios auxiliares.
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
    @InjectRepository(PostComment) private readonly comments: Repository<PostComment>,
    @InjectRepository(Message) private readonly messages: Repository<Message>,
    @InjectRepository(StoreBenefit) private readonly storeBenefits: Repository<StoreBenefit>,
    @InjectRepository(Project) private readonly projects: Repository<Project>,
    @InjectRepository(ClubCreator) private readonly clubCreators: Repository<ClubCreator>,
    @InjectRepository(UserBadge) private readonly userBadgeRepo: Repository<UserBadge>,
    private readonly settings: SettingsService,
    private readonly usersService: UsersService,
    private readonly notifications: NotificationsService,
    private readonly dm: DmService,
    private readonly badges: BadgesService,
  ) {}

  // EN: Sends a direct message broadcast to all or selected users.
  // ES: Envía un mensaje directo a todos o a usuarios seleccionados.
  /** Envía un DM (bandeja de mensajes) a todos o a usuarios elegidos. */
  sendAdminDm(senderId: string, content: string, userIds?: string[]) {
    return this.dm.broadcast(senderId, content, userIds);
  }

  // ──────────────────────────────────────────────────────────────────────
  // DASHBOARD STATS
  // ──────────────────────────────────────────────────────────────────────
  // EN: Returns dashboard counters (users, socios, creators, online, events, votes, etc.).
  // ES: Devuelve los contadores del panel (usuarios, socios, creadores, en línea, eventos, votos, etc.).
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
  // EN: Lists users with pagination, search and role/socio filters.
  // ES: Lista usuarios con paginación, búsqueda y filtros por rol/socio.
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

  // EN: Fetches a single user by id (without password).
  // ES: Obtiene un usuario por id (sin la contraseña).
  async getUser(id: string) {
    const u = await this.users.findOne({ where: { id } });
    if (!u) throw new NotFoundException('User not found');
    return this.publicUser(u);
  }

  // EN: Creates a user and applies admin overrides (role, socio, credits, xp/level).
  // ES: Crea un usuario y aplica ajustes de admin (rol, socio, créditos, xp/nivel).
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

  // EN: Updates a user, re-hashing password and recomputing level when xp changes.
  // ES: Actualiza un usuario, rehasheando la contraseña y recalculando el nivel si cambia el xp.
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

  // EN: Deletes a user by id.
  // ES: Elimina un usuario por id.
  async deleteUser(id: string) {
    const result = await this.users.delete(id);
    if (!result.affected) throw new NotFoundException('User not found');
    return { ok: true };
  }

  // EN: Adds or sets xp for all users in bulk, recomputing levels.
  // ES: Suma o fija el xp de todos los usuarios en bloque, recalculando niveles.
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

  // EN: Strips the password field to return a public-safe user object.
  // ES: Quita el campo contraseña para devolver un usuario seguro para exponer.
  private publicUser(u: User) {
    const { password, ...rest } = u;
    return rest;
  }

  // ──────────────────────────────────────────────────────────────────────
  // EVENTS
  // ──────────────────────────────────────────────────────────────────────
  // EN: Lists events with real attendee counts computed from attendee rows.
  // ES: Lista eventos con conteos reales de asistentes calculados desde las filas de asistentes.
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

  // EN: Fetches a single event by id.
  // ES: Obtiene un evento por id.
  async getEvent(id: string) {
    const e = await this.events.findOne({ where: { id } });
    if (!e) throw new NotFoundException('Event not found');
    return e;
  }

  // EN: Creates an event already approved.
  // ES: Crea un evento ya aprobado.
  createEvent(dto: CreateEventAdminDto) {
    const event = this.events.create({ ...dto, date: new Date(dto.date), status: 'approved' });
    return this.events.save(event);
  }

  // EN: Updates an event, parsing the date if provided.
  // ES: Actualiza un evento, parseando la fecha si se proporciona.
  async updateEvent(id: string, dto: UpdateEventAdminDto) {
    const e = await this.events.findOne({ where: { id } });
    if (!e) throw new NotFoundException('Event not found');
    Object.assign(e, { ...dto, date: dto.date ? new Date(dto.date) : e.date });
    return this.events.save(e);
  }

  // EN: Deletes an event by id.
  // ES: Elimina un evento por id.
  async deleteEvent(id: string) {
    const r = await this.events.delete(id);
    if (!r.affected) throw new NotFoundException('Event not found');
    return { ok: true };
  }

  // EN: Returns events awaiting approval, oldest first.
  // ES: Devuelve los eventos pendientes de aprobación, los más antiguos primero.
  getPendingEvents() {
    return this.events.find({ where: { status: 'pending' }, order: { createdAt: 'ASC' } });
  }

  // EN: Marks an event as approved.
  // ES: Marca un evento como aprobado.
  async approveEvent(id: string) {
    const e = await this.events.findOne({ where: { id } });
    if (!e) throw new NotFoundException('Event not found');
    e.status = 'approved';
    return this.events.save(e);
  }

  // EN: Marks an event as rejected.
  // ES: Marca un evento como rechazado.
  async rejectEvent(id: string) {
    const e = await this.events.findOne({ where: { id } });
    if (!e) throw new NotFoundException('Event not found');
    e.status = 'rejected';
    return this.events.save(e);
  }

  // ──────────────────────────────────────────────────────────────────────
  // VOTES
  // ──────────────────────────────────────────────────────────────────────
  // EN: Lists recent user votes enriched with vote title and user info, skipping orphans.
  // ES: Lista los votos recientes de usuarios con título de votación e info de usuario, omitiendo huérfanos.
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
  // EN: Removes an attendee from an event and refunds their credits cost.
  // ES: Quita a un asistente de un evento y le reembolsa el coste en créditos.
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
  // EN: Lists all missions.
  // ES: Lista todas las misiones.
  listMissions() {
    return this.missions.find();
  }

  // EN: Resets a mission's progress to zero and marks it incomplete.
  // ES: Reinicia el progreso de una misión a cero y la marca como incompleta.
  async resetMission(code: string) {
    const m = await this.missions.findOne({ where: { code } });
    if (!m) throw new NotFoundException('Mission not found');
    m.current = 0;
    m.isComplete = false;
    return this.missions.save(m);
  }

  // EN: Updates a mission's editable fields.
  // ES: Actualiza los campos editables de una misión.
  async updateMission(code: string, dto: { title?: string; description?: string; target?: number; reward?: string; isActive?: boolean }) {
    const m = await this.missions.findOne({ where: { code } });
    if (!m) throw new NotFoundException('Mission not found');
    Object.assign(m, dto);
    return this.missions.save(m);
  }

  // EN: Creates a new mission; throws if the code already exists.
  // ES: Crea una misión nueva; lanza error si el código ya existe.
  async createMission(dto: { code: string; title: string; description?: string; target: number; reward?: string; isActive?: boolean }) {
    const existing = await this.missions.findOne({ where: { code: dto.code } });
    if (existing) throw new BadRequestException('Ya existe una misión con ese código');
    return this.missions.save({
      code: dto.code,
      title: dto.title,
      description: dto.description,
      target: dto.target,
      reward: dto.reward,
      isActive: dto.isActive ?? true,
      current: 0,
      isComplete: false,
    });
  }

  // ──────────────────────────────────────────────────────────────────────
  // BADGES (admin management)
  // ──────────────────────────────────────────────────────────────────────
  // EN: Returns the full badge catalog.
  // ES: Devuelve el catálogo completo de insignias.
  getBadgeCatalog() {
    return this.badges.catalog();
  }

  // EN: Returns the badges unlocked by a specific user.
  // ES: Devuelve las insignias desbloqueadas por un usuario concreto.
  getUserBadges(userId: string) {
    return this.badges.listForUser(userId);
  }

  // EN: Awards a badge to a user.
  // ES: Concede una insignia a un usuario.
  awardBadge(userId: string, badgeCode: string) {
    return this.badges.award(userId, badgeCode);
  }

  // EN: Revokes a badge from a user by deleting the user_badge record.
  // ES: Revoca una insignia de un usuario eliminando el registro user_badge.
  async revokeBadge(userId: string, badgeCode: string): Promise<{ ok: boolean }> {
    await this.userBadgeRepo.delete({ userId, badgeCode });
    return { ok: true };
  }

  // ──────────────────────────────────────────────────────────────────────
  // CREATOR STATS
  // ──────────────────────────────────────────────────────────────────────
  // EN: Returns a creator's post stats (totals, average likes, post list).
  // ES: Devuelve las estadísticas de publicaciones de un creador (totales, media de likes, lista de posts).
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
  // EN: Returns all app settings.
  // ES: Devuelve todos los ajustes de la aplicación.
  getSettings() {
    return this.settings.getAll();
  }

  // EN: Sets a single app setting by key.
  // ES: Establece un ajuste de la aplicación por clave.
  updateSetting(key: string, value: string) {
    return this.settings.set(key, value);
  }

  // ──────────────────────────────────────────────────────────────────────
  // POSTS (moderation)
  // ──────────────────────────────────────────────────────────────────────
  // EN: Lists recent posts enriched with author name, avatar and email for moderation.
  // ES: Lista publicaciones recientes con nombre, avatar y email del autor para moderación.
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

  // EN: Deletes a post by id.
  // ES: Elimina una publicación por id.
  async deletePost(id: string) {
    const r = await this.posts.delete(id);
    if (!r.affected) throw new NotFoundException('Post not found');
    return { ok: true };
  }

  // ──────────────────────────────────────────────────────────────────────
  // DELETED MESSAGES (moderation)
  // ──────────────────────────────────────────────────────────────────────
  // EN: Lists soft-deleted chat messages (deletedAt IS NOT NULL), enriched with author info.
  // ES: Lista los mensajes de chat borrados suavemente (deletedAt no nulo), con info del autor.
  async getDeletedMessages(channel?: string) {
    const qb = this.messages.createQueryBuilder('m')
      .where('m.deletedAt IS NOT NULL')
      .orderBy('m.deletedAt', 'DESC')
      .take(100);
    if (channel) qb.andWhere('m.channel = :channel', { channel });
    const msgs = await qb.getMany();
    const userIds = [...new Set(msgs.map(m => m.userId))];
    const users = userIds.length ? await this.users.find({ where: { id: In(userIds) } }) : [];
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));
    return msgs.map(m => ({
      ...m,
      authorName: userMap[m.userId]?.name ?? 'Fan',
      authorEmail: userMap[m.userId]?.email ?? '',
    }));
  }

  // EN: Restores a soft-deleted message by clearing its deletedAt timestamp.
  // ES: Restaura un mensaje borrado suavemente limpiando su timestamp deletedAt.
  async restoreMessage(messageId: string) {
    await this.messages.update(messageId, { deletedAt: null });
    return { ok: true };
  }

  // EN: Lists soft-deleted posts, enriched with author info.
  // ES: Lista los posts borrados suavemente, con info del autor.
  async getDeletedPosts() {
    const posts = await this.posts.createQueryBuilder('p')
      .where('p.deletedAt IS NOT NULL')
      .orderBy('p.deletedAt', 'DESC')
      .take(100)
      .getMany();
    const userIds = [...new Set(posts.map(p => p.authorId))];
    const users = userIds.length ? await this.users.find({ where: { id: In(userIds) } }) : [];
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));
    return posts.map(p => ({
      ...p,
      authorName: userMap[p.authorId]?.name ?? 'Fan',
      authorEmail: userMap[p.authorId]?.email ?? '',
    }));
  }

  // EN: Restores a soft-deleted post making it visible again.
  // ES: Restaura un post borrado haciéndolo visible de nuevo.
  async restorePost(postId: string) {
    await this.posts.update(postId, { deletedAt: null, isVisible: true });
    return { ok: true };
  }

  // EN: Lists soft-deleted comments, enriched with author info.
  // ES: Lista los comentarios borrados suavemente, con info del autor.
  async getDeletedComments() {
    const comments = await this.comments.createQueryBuilder('c')
      .where('c.deletedAt IS NOT NULL')
      .orderBy('c.deletedAt', 'DESC')
      .take(100)
      .getMany();
    const userIds = [...new Set(comments.map(c => c.userId))];
    const users = userIds.length ? await this.users.find({ where: { id: In(userIds) } }) : [];
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));
    return comments.map(c => ({
      ...c,
      authorName: userMap[c.userId]?.name ?? 'Fan',
      authorEmail: userMap[c.userId]?.email ?? '',
    }));
  }

  // EN: Restores a soft-deleted comment.
  // ES: Restaura un comentario borrado suavemente.
  async restoreComment(commentId: string) {
    await this.comments.update(commentId, { deletedAt: null });
    return { ok: true };
  }

  // ──────────────────────────────────────────────────────────────────────
  // VOTE OBJECTS (create / manage)
  // ──────────────────────────────────────────────────────────────────────
  // EN: Lists all votación objects, newest first.
  // ES: Lista todos los objetos de votación, los más recientes primero.
  listVoteObjects() {
    return this.votes.find({ order: { createdAt: 'DESC' } });
  }

  // EN: Creates a votación with zeroed result counters per option.
  // ES: Crea una votación con contadores de resultados a cero por opción.
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

  // EN: Updates a votación, preserving existing counts for options that remain.
  // ES: Actualiza una votación, conservando los conteos de las opciones que permanecen.
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

  // EN: Deletes a votación and its associated user votes.
  // ES: Elimina una votación y los votos de usuario asociados.
  async deleteVoteObject(id: string) {
    await this.votes.delete(id);
    await this.userVotes.delete({ voteId: id });
    return { ok: true };
  }

  // EN: Settles a votación by setting the correct option and closing it.
  // ES: Liquida una votación fijando la opción correcta y cerrándola.
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
  // EN: Lists raffles with resolved winner name and email.
  // ES: Lista sorteos con el nombre y email del ganador resueltos.
  async listRaffles() {
    const raffles = await this.raffles.find({ order: { createdAt: 'DESC' } });
    const results = await Promise.all(raffles.map(async (r) => {
      const winner = r.winnerId ? await this.users.findOne({ where: { id: r.winnerId }, select: ['id', 'name', 'email'] }) : null;
      return { ...r, winnerName: winner?.name, winnerEmail: winner?.email };
    }));
    return results;
  }

  // EN: Lists a raffle's participants with their user info.
  // ES: Lista los participantes de un sorteo con su info de usuario.
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

  // EN: Creates a raffle.
  // ES: Crea un sorteo.
  async createRaffle(dto: {
    title: string; description?: string; prizeValue: number;
    ticketCost?: number; xpReward?: number; month?: string;
    prizeImageUrl?: string; drawDate?: string; audience?: string;
  }) {
    const raffle = this.raffles.create(dto);
    return this.raffles.save(raffle);
  }

  // EN: Updates a raffle.
  // ES: Actualiza un sorteo.
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

  // EN: Draws a raffle winner weighted by tickets and notifies them.
  // ES: Sortea un ganador ponderado por tickets y le notifica.
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

  // EN: Deletes a raffle and its entries.
  // ES: Elimina un sorteo y sus participaciones.
  async deleteRaffle(id: string) {
    await this.raffleEntries.delete({ raffleId: id });
    await this.raffles.delete(id);
    return { ok: true };
  }

  // ──────────────────────────────────────────────────────────────────────
  // STORE BENEFITS
  // ──────────────────────────────────────────────────────────────────────
  // EN: Lists all store benefits ordered by display order.
  // ES: Lista todos los beneficios de la tienda ordenados por orden de visualización.
  listStoreBenefits() {
    return this.storeBenefits.find({ order: { displayOrder: 'ASC', createdAt: 'ASC' } });
  }

  // EN: Creates a store benefit.
  // ES: Crea un beneficio de la tienda.
  createStoreBenefit(dto: {
    name: string; description?: string; discount?: string; emoji?: string;
    imageUrl?: string; color?: string; link?: string; displayOrder?: number; isActive?: boolean;
  }) {
    const benefit = this.storeBenefits.create(dto);
    return this.storeBenefits.save(benefit);
  }

  // EN: Updates a store benefit.
  // ES: Actualiza un beneficio de la tienda.
  async updateStoreBenefit(id: string, dto: Partial<{
    name: string; description: string; discount: string; emoji: string;
    imageUrl: string; color: string; link: string; displayOrder: number; isActive: boolean;
  }>) {
    const benefit = await this.storeBenefits.findOneBy({ id });
    if (!benefit) throw new NotFoundException('Beneficio no encontrado');
    Object.assign(benefit, dto);
    return this.storeBenefits.save(benefit);
  }

  // EN: Deletes a store benefit.
  // ES: Elimina un beneficio de la tienda.
  async deleteStoreBenefit(id: string) {
    await this.storeBenefits.delete(id);
    return { ok: true };
  }

  // ──────────────────────────────────────────────────────────────────────
  // IMPACT PROJECTS
  // ──────────────────────────────────────────────────────────────────────
  // EN: Lists all impact projects ordered by display order.
  // ES: Lista todos los proyectos de impacto ordenados por orden de visualización.
  listProjects() {
    return this.projects.find({ order: { displayOrder: 'ASC', createdAt: 'ASC' } });
  }

  // EN: Converts text into a URL-safe slug (lowercased, accents stripped).
  // ES: Convierte un texto en un slug apto para URL (en minúsculas, sin acentos).
  private slugify(text: string): string {
    const cleaned = (text || 'proyecto')
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '') // strip accents
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);
    return cleaned || 'proyecto';
  }

  // EN: Creates an impact project ensuring a unique slug.
  // ES: Crea un proyecto de impacto garantizando un slug único.
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

  // EN: Updates an impact project, keeping the slug immutable.
  // ES: Actualiza un proyecto de impacto, manteniendo el slug inmutable.
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

  // EN: Deletes an impact project.
  // ES: Elimina un proyecto de impacto.
  async deleteProject(id: string) {
    await this.projects.delete(id);
    return { ok: true };
  }

  // ──────────────────────────────────────────────────────────────────────
  // CLUB CREATORS (showcase cards in "El Pacto")
  // ──────────────────────────────────────────────────────────────────────
  // EN: Lists creator-role users available to feature as club creators.
  // ES: Lista usuarios con rol creador disponibles para destacar como creadores del club.
  /** Creator-role accounts available to feature as club creators. */
  async listCreatorUsers() {
    const users = await this.users.find({
      where: { role: 'creator' as any },
      select: ['id', 'name', 'avatar'],
      order: { name: 'ASC' },
    });
    return users;
  }

  // EN: Lists club creator cards enriched with the linked user's current name and avatar.
  // ES: Lista las tarjetas de creadores del club con el nombre y avatar actuales del usuario vinculado.
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

  // EN: Creates a club creator card, defaulting the name to the user's name.
  // ES: Crea una tarjeta de creador del club, usando por defecto el nombre del usuario.
  async createClubCreator(dto: { userId: string; name?: string; photoUrl?: string; displayOrder?: number; isActive?: boolean }) {
    const user = await this.users.findOne({ where: { id: dto.userId } });
    const card = this.clubCreators.create({ ...dto, name: dto.name ?? user?.name });
    return this.clubCreators.save(card);
  }

  // EN: Updates a club creator card.
  // ES: Actualiza una tarjeta de creador del club.
  async updateClubCreator(id: string, dto: Partial<{ userId: string; name: string; photoUrl: string; displayOrder: number; isActive: boolean }>) {
    const card = await this.clubCreators.findOneBy({ id });
    if (!card) throw new NotFoundException('Creador no encontrado');
    Object.assign(card, dto);
    return this.clubCreators.save(card);
  }

  // EN: Deletes a club creator card.
  // ES: Elimina una tarjeta de creador del club.
  async deleteClubCreator(id: string) {
    await this.clubCreators.delete(id);
    return { ok: true };
  }

  // ──────────────────────────────────────────────────────────────────────
  // NOTIFICATIONS (broadcast)
  // ──────────────────────────────────────────────────────────────────────
  // EN: Broadcasts a notification to all users.
  // ES: Difunde una notificación a todos los usuarios.
  async broadcastNotification(title: string, body: string) {
    await this.notifications.notifyAll('admin_broadcast', title, body, {});
    return { ok: true };
  }
}
