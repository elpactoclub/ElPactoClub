import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export type PostType = 'text' | 'poll' | 'challenge' | 'image';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  authorId: string;

  @Column({ type: 'enum', enum: ['text', 'poll', 'challenge', 'image'], default: 'text' })
  type: PostType;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  pollOptions: string[];

  @Column({ type: 'jsonb', nullable: true })
  pollVotes: Record<string, number>;

  @Column({ default: 0 })
  likesCount: number;

  @Column({ type: 'jsonb', default: [] })
  likedBy: string[];

  @Column({ default: true })
  isVisible: boolean;

  @Column({ nullable: true })
  imageUrl: string;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  channel: string; // 'general', 'noticias', 'predicciones', 'retos', or 'dm-creator-<slug>'

  @Column({ type: 'text' })
  content: string;

  @Column({ nullable: true })
  replyToId: string;

  @CreateDateColumn()
  createdAt: Date;
}
