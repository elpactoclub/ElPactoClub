// EN: TypeORM entity for community missions (shared goals with progress and rewards).
// ES: Entidad TypeORM de misiones comunitarias (objetivos compartidos con progreso y recompensas).
import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

// EN: Mission record keyed by code, tracking current progress toward a target.
// ES: Registro de misión identificado por código, que sigue el progreso actual hacia un objetivo.
@Entity('missions')
export class Mission {
  @PrimaryColumn()
  code: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  target: number;

  @Column({ default: 0 })
  current: number;

  @Column({ type: 'text' })
  reward: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isComplete: boolean;

  // EN: Scope of the mission — global means a shared counter for the whole community, individual means per-user progress.
  // ES: Alcance de la misión — global es un contador compartido por toda la comunidad, individual es progreso por usuario.
  @Column({ type: 'varchar', default: 'global' })
  scope: 'global' | 'individual';

  // EN: Trigger that auto-increments this mission; manual means the admin controls it.
  // ES: Disparador que auto-incrementa esta misión; manual significa que el admin la controla.
  @Column({ type: 'varchar', default: 'manual' })
  trigger: 'manual' | 'chat_message' | 'post' | 'comment' | 'vote' | 'daily_reward' | 'poll_vote';

  @UpdateDateColumn()
  updatedAt: Date;
}