// EN: TypeORM entities for the voting/betting system: vote definitions and the per-user votes cast on them.
// ES: Entidades TypeORM del sistema de votaciones/apuestas: definiciones de votación y los votos emitidos por cada usuario.
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export type VoteCategory = 'celebracion' | 'diseno' | 'contenido' | 'pregunta' | 'decision';
export type VotationType = 'encuesta' | 'pregunta' | 'votacion' | 'apuesta';

// EN: A vote/poll/bet definition with options, costs, rewards and settlement state.
// ES: Definición de una votación/encuesta/apuesta con sus opciones, costes, recompensas y estado de liquidación.
@Entity('votes')
export class Vote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ['celebracion', 'diseno', 'contenido', 'pregunta', 'decision'] })
  category: VoteCategory;

  @Column({ type: 'enum', enum: ['encuesta', 'pregunta', 'votacion', 'apuesta'], nullable: true })
  votationType: VotationType;

  @Column({ type: 'jsonb' })
  options: string[];

  @Column({ type: 'jsonb', default: '{}' })
  results: Record<string, number>; // option -> count

  @Column({ default: 5 })
  creditsCost: number;

  @Column({ default: 0 })
  xpReward: number;

  @Column({ nullable: true })
  closesAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  correctOption: string;

  @Column({ nullable: true })
  settledAt: Date;

  @Column({ default: false })
  doubledPayout: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

// EN: Records the option a given user selected for a given vote (one row per user/vote).
// ES: Registra la opción que un usuario seleccionó para una votación (una fila por usuario/votación).
@Entity('user_votes')
export class UserVote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  voteId: string;

  @Column()
  selectedOption: string;

  @CreateDateColumn()
  createdAt: Date;
}
