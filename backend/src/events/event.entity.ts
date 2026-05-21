import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

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

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  liveStreamUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  speakers: string[]; // creator IDs

  @CreateDateColumn()
  createdAt: Date;
}
