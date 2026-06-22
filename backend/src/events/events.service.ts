import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, In } from 'typeorm';
import { Event, EventAttendee, EventPollVote } from './event.entity';
import { SubmitEventDto } from './dto/submit-event.dto';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';

const CHARLA_XP = 25;

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

  findAll(): Promise<Event[]> {
    return this.eventsRepo.find({
      where: { isActive: true, status: 'approved' },
      order: { date: 'ASC' },
    });
  }

  findUpcoming(): Promise<Event[]> {
    return this.eventsRepo.find({
      where: { isActive: true, status: 'approved', date: MoreThan(new Date()) },
      order: { date: 'ASC' },
      take: 10,
    });
  }

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

  getCreatorEvents(userId: string): Promise<Event[]> {
    return this.eventsRepo.find({ where: { createdBy: userId }, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventsRepo.findOne({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

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

  async isRegistered(eventId: string, userId: string): Promise<boolean> {
    return !!(await this.attendeesRepo.findOne({ where: { eventId, userId } }));
  }

  async castPollVote(eventId: string, userId: string, pollIndex: number, option: string): Promise<{ ok: boolean }> {
    await this.pollVotesRepo.delete({ eventId, userId, pollIndex });
    await this.pollVotesRepo.save({ eventId, userId, pollIndex, option });
    await this.usersService.addXP(userId, 5);
    return { ok: true };
  }

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
