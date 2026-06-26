// EN: Business logic for events: listing, creator submissions, attendee registration (with credit/XP costs) and event polls.
// ES: Lógica de negocio de eventos: listado, envíos de creadores, inscripción de asistentes (con coste de créditos/XP) y encuestas de eventos.
import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, In } from 'typeorm';
import { Event, EventAttendee, EventPollVote } from './event.entity';
import { SubmitEventDto } from './dto/submit-event.dto';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';

const CHARLA_XP = 25;

// EN: Service exposing all event operations backed by the events, attendees and poll-votes repositories.
// ES: Servicio que expone todas las operaciones de eventos apoyándose en los repositorios de eventos, asistentes y votos de encuesta.
@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventsRepo: Repository<Event>,
    @InjectRepository(EventAttendee)
    private readonly attendeesRepo: Repository<EventAttendee>,
    @InjectRepository(EventPollVote)
    private readonly pollVotesRepo: Repository<EventPollVote>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly usersService: UsersService,
  ) {}

  // EN: Returns all active, approved events ordered by date.
  // ES: Devuelve todos los eventos activos y aprobados ordenados por fecha.
  findAll(): Promise<Event[]> {
    return this.eventsRepo.find({
      where: { isActive: true, status: 'approved' },
      order: { date: 'ASC' },
    });
  }

  // EN: Returns up to 10 upcoming approved events (future date), ordered by date.
  // ES: Devuelve hasta 10 próximos eventos aprobados (fecha futura), ordenados por fecha.
  findUpcoming(): Promise<Event[]> {
    return this.eventsRepo.find({
      where: { isActive: true, status: 'approved', date: MoreThan(new Date()) },
      order: { date: 'ASC' },
      take: 10,
    });
  }

  // EN: Creates a new event in 'pending' status submitted by the given creator.
  // ES: Crea un nuevo evento en estado 'pending' enviado por el creador indicado.
  async submitEvent(dto: SubmitEventDto, userId: string): Promise<Event> {
    const event = this.eventsRepo.create({
      title: dto.title,
      description: dto.description,
      type: dto.type,
      date: new Date(dto.date),
      location: dto.location,
      city: dto.city,
      maxAttendees: dto.maxAttendees,
      imageUrl: dto.imageUrl,
      bannerUrl: dto.bannerUrl,
      liveStreamUrl: dto.liveStreamUrl,
      speakers: dto.speakers,
      polls: dto.polls,
      status: 'pending',
      createdBy: userId,
    });
    return this.eventsRepo.save(event);
  }

  // EN: Returns all events submitted by a given creator, newest first.
  // ES: Devuelve todos los eventos enviados por un creador dado, los más recientes primero.
  getCreatorEvents(userId: string): Promise<Event[]> {
    return this.eventsRepo.find({ where: { createdBy: userId }, order: { createdAt: 'DESC' } });
  }

  // EN: Returns a single event by id or throws if not found.
  // ES: Devuelve un único evento por id o lanza error si no existe.
  async findOne(id: string): Promise<Event> {
    const event = await this.eventsRepo.findOne({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  // EN: Registers a user for an event, enforcing capacity, charging credits and granting XP for charlas.
  // ES: Inscribe a un usuario en un evento, respetando el aforo, cobrando créditos y otorgando XP en las charlas.
  async registerAttendee(eventId: string, userId?: string): Promise<{ success: boolean }> {
    const event = await this.findOne(eventId);

    if (userId) {
      const already = await this.attendeesRepo.findOne({ where: { eventId, userId } });
      if (already) throw new ConflictException('Ya estás inscrito en este evento');
    }

    if (event.maxAttendees && event.attendeesCount >= event.maxAttendees) {
      throw new BadRequestException('No quedan plazas disponibles');
    }

    if (userId && event.creditsCost > 0) {
      const user = await this.usersService.findById(userId);
      if (!user || (user as any).credits < event.creditsCost) {
        throw new BadRequestException(`Necesitas ${event.creditsCost} créditos para reservar`);
      }
      await this.usersService.spendCredits(userId, event.creditsCost);
      if (event.type === 'charla') {
        await this.usersService.addXP(userId, CHARLA_XP);
      }
    }

    if (userId) {
      await this.attendeesRepo.save({ eventId, userId });
    }
    await this.eventsRepo.update(eventId, {
      attendeesCount: event.attendeesCount + 1,
    });
    return { success: true };
  }

  // EN: Returns the list of attendees for an event with their public profile fields.
  // ES: Devuelve la lista de asistentes de un evento con sus campos de perfil públicos.
  async getAttendees(eventId: string) {
    const rows = await this.attendeesRepo.find({ where: { eventId }, order: { createdAt: 'ASC' } });
    if (rows.length === 0) return [];
    const users = await this.usersRepo.find({ where: { id: In(rows.map((r) => r.userId)) } });
    const byId = new Map(users.map((u) => [u.id, u]));
    return rows.map((r) => {
      const u = byId.get(r.userId);
      return {
        userId: r.userId,
        name: u?.name ?? 'Usuario',
        avatar: u?.avatar ?? '🏀',
        email: u?.email ?? '',
        city: u?.city ?? null,
        country: u?.country ?? null,
        level: u?.level ?? null,
        xp: u?.xp ?? 0,
        role: u?.role ?? 'fan',
        isSocio: u?.isSocio ?? false,
        socioNumber: u?.socioNumber ?? null,
        registeredAt: r.createdAt,
      };
    });
  }

  // EN: Returns whether a given user is registered for an event.
  // ES: Indica si un usuario dado está inscrito en un evento.
  async isRegistered(eventId: string, userId: string): Promise<boolean> {
    return !!(await this.attendeesRepo.findOne({ where: { eventId, userId } }));
  }

  // EN: Replaces the user's vote on an event poll with the new option and awards XP.
  // ES: Reemplaza el voto del usuario en una encuesta del evento por la nueva opción y otorga XP.
  async castPollVote(eventId: string, userId: string, pollIndex: number, option: string): Promise<{ ok: boolean }> {
    await this.pollVotesRepo.delete({ eventId, userId, pollIndex });
    await this.pollVotesRepo.save({ eventId, userId, pollIndex, option });
    await this.usersService.addXP(userId, 5);
    return { ok: true };
  }

  // EN: Aggregates poll vote counts per poll for an event, flagging the user's own selections when provided.
  // ES: Agrega los recuentos de votos por encuesta de un evento, marcando las selecciones propias del usuario si se indica.
  async getPollVotes(eventId: string, userId?: string): Promise<Record<number, { counts: Record<string, number>; myVote?: string }>> {
    const rows = await this.pollVotesRepo.find({ where: { eventId } });
    const result: Record<number, { counts: Record<string, number>; myVote?: string }> = {};
    for (const row of rows) {
      if (!result[row.pollIndex]) result[row.pollIndex] = { counts: {} };
      result[row.pollIndex].counts[row.option] = (result[row.pollIndex].counts[row.option] ?? 0) + 1;
      if (userId && row.userId === userId) result[row.pollIndex].myVote = row.option;
    }
    return result;
  }
}
