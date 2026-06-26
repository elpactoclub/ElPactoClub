// EN: TypeORM entity and type for in-app notifications (type, title, body, payload, read state).
// ES: Entidad TypeORM y tipo para notificaciones en la app (tipo, título, cuerpo, payload, estado de lectura).
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

// EN: Union of supported notification types.
// ES: Unión de los tipos de notificación soportados.
export type NotificationType =
  | 'post_creator'
  | 'new_vote'
  | 'bet_result'
  | 'badge_unlock'
  | 'mission_complete'
  | 'new_follow'
  | 'raffle_win'
  | 'admin_broadcast';

// EN: Notification record belonging to a user.
// ES: Registro de notificación perteneciente a un usuario.
@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  userId: string;

  @Column({ type: 'enum', enum: ['post_creator', 'new_vote', 'bet_result', 'badge_unlock', 'mission_complete', 'new_follow', 'raffle_win', 'admin_broadcast'] })
  type: NotificationType;

  @Column()
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'jsonb', nullable: true })
  payload: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}