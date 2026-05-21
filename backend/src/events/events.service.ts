import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Event } from './event.entity';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventsRepo: Repository<Event>,
  ) {}

  findAll(): Promise<Event[]> {
    return this.eventsRepo.find({
      where: { isActive: true },
      order: { date: 'ASC' },
    });
  }

  findUpcoming(): Promise<Event[]> {
    return this.eventsRepo.find({
      where: { isActive: true, date: MoreThan(new Date()) },
      order: { date: 'ASC' },
      take: 10,
    });
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventsRepo.findOne({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async registerAttendee(eventId: string): Promise<{ success: boolean }> {
    const event = await this.findOne(eventId);
    if (event.maxAttendees && event.attendeesCount >= event.maxAttendees) {
      return { success: false };
    }
    await this.eventsRepo.update(eventId, {
      attendeesCount: event.attendeesCount + 1,
    });
    return { success: true };
  }
}
