import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export type NotificationType =
  | 'post_creator'
  | 'new_vote'
  | 'bet_result'
  | 'badge_unlock'
  | 'mission_complete'
  | 'new_follow'
  | 'raffle_win'
  | 'admin_broadcast';

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