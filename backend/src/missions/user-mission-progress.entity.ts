// EN: Entity tracking per-user progress for individual-scope missions.
// ES: Entidad que registra el progreso por usuario para misiones de alcance individual.
import { Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';

// EN: One row per (user, mission) pair; current and isComplete are updated as the user makes progress.
// ES: Una fila por par (usuario, misión); current e isComplete se actualizan conforme avanza el usuario.
@Entity('user_mission_progress')
@Unique(['userId', 'missionCode'])
export class UserMissionProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  missionCode: string;

  @Column({ default: 0 })
  current: number;

  @Column({ default: false })
  isComplete: boolean;
}
