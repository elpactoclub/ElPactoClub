import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('direct_messages')
@Index(['senderId', 'recipientId'])
@Index(['recipientId', 'readAt'])
export class DirectMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  senderId: string;

  @Column()
  recipientId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
