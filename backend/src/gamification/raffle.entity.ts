import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('raffles')
export class Raffle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  prizeImageUrl: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  prizeValue: number;

  @Column({ default: 75 })
  ticketCost: number; // credits per entry

  @Column({ default: 1 })
  xpReward: number;

  @Column({ default: 0 })
  participantCount: number;

  @Column({ nullable: true })
  winnerId: string;

  @Column({ nullable: true })
  drawDate: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  month: string; // e.g. "2025-06"

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('raffle_entries')
export class RaffleEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  raffleId: string;

  @Column({ default: 1 })
  tickets: number;

  @CreateDateColumn()
  createdAt: Date;
}
