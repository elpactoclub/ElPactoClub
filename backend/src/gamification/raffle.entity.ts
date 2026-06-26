// EN: TypeORM entities for raffles: raffle definitions and per-user raffle entries.
// ES: Entidades TypeORM de sorteos: definiciones de sorteo y las participaciones por usuario.
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

// EN: A raffle with prize details, ticket cost, audience and winner/draw state.
// ES: Un sorteo con detalles del premio, coste del ticket, audiencia y estado de ganador/sorteo.
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

  @Column({ default: 'all' })
  audience: string; // 'all' | 'socios' | 'fans' — who can participate

  @Column({ nullable: true })
  month: string; // e.g. "2025-06"

  @CreateDateColumn()
  createdAt: Date;
}

// EN: A user's entry into a raffle, holding the number of tickets bought.
// ES: La participación de un usuario en un sorteo, con el número de tickets comprados.
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
