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

  @UpdateDateColumn()
  updatedAt: Date;
}