// EN: TypeORM entities for the community feed: posts, post comments and chat messages.
// ES: Entidades TypeORM del feed de comunidad: posts, comentarios de posts y mensajes de chat.
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export type PostType = 'text' | 'poll' | 'challenge' | 'image';

// EN: Feed post: text/poll/challenge/image with likes, reactions and optional poll data.
// ES: Post del feed: texto/encuesta/reto/imagen con likes, reacciones y datos de encuesta opcionales.
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

  @Column({ type: 'jsonb', nullable: true })
  pollVoters: Record<string, string>;

  @Column({ default: 0 })
  likesCount: number;

  @Column({ type: 'jsonb', default: [] })
  likedBy: string[];

  @Column({ type: 'jsonb', nullable: true })
  reactions: Record<string, string[]>; // emoji -> userIds who reacted

  @Column({ default: true })
  isVisible: boolean;

  @Column({ default: false })
  pollClosed: boolean;

  @Column({ nullable: true })
  imageUrl: string;

  @CreateDateColumn()
  createdAt: Date;
}

// EN: Comment on a post, with its own like counter and likedBy list.
// ES: Comentario en un post, con su propio contador de likes y lista likedBy.
@Entity('post_comments')
export class PostComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  postId: string;

  @Column()
  userId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: 0 })
  likesCount: number;

  @Column({ type: 'jsonb', default: [] })
  likedBy: string[];

  @CreateDateColumn()
  createdAt: Date;
}

// EN: Chat message in a community channel or private creator DM.
// ES: Mensaje de chat en un canal de comunidad o DM privado a un creador.
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
