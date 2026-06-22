import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, Unique } from 'typeorm';

export type EventType = 'partido' | 'charla' | 'tour' | 'sorteo' | 'reto';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ['partido', 'charla', 'tour', 'sorteo', 'reto'] })
  type: EventType;

  @Column()
  date: Date;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  city: string;

  @Column({ default: 0 })
  creditsCost: number; // 0 = free

  @Column({ nullable: true })
  maxAttendees: number;

  @Column({ default: 0 })
  attendeesCount: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  showOnHome: boolean; // si aparece en el carrusel "Próximos eventos" del inicio (lo elige el admin)

  @Column({ type: 'text', nullable: true })
  imageUrl: string; // icono/logo pequeño (círculo de la card)

  @Column({ type: 'text', nullable: true })
  bannerUrl: string; // imagen de portada grande (hero de la página del evento)

  @Column({ nullable: true })
  liveStreamUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  speakers: string[]; // creator IDs

  @Column({ type: 'jsonb', nullable: true })
  polls: { question: string; options: string[] }[]; // event decision polls

  @Column({ type: 'enum', enum: ['approved', 'pending', 'rejected'], default: 'approved' })
  status: 'approved' | 'pending' | 'rejected';

  @Column({ nullable: true })
  createdBy: string; // userId of creator who submitted for approval

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('event_attendees')
@Index(['eventId', 'userId'], { unique: true })
export class EventAttendee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  eventId: string;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('event_poll_votes')
@Unique(['eventId', 'userId', 'pollIndex'])
export class EventPollVote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  eventId: string;

  @Column()
  userId: string;

  @Column()
  pollIndex: number;

  @Column()
  option: string;

  @CreateDateColumn()
  createdAt: Date;
}
