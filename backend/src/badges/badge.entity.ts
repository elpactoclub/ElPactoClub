import { Entity, PrimaryColumn, Column, Index, CreateDateColumn, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('badges')
export class Badge {
  @PrimaryColumn()
  code: string;

  @Column()
  name: string;

  @Column()
  emoji: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ default: false })
  isSecret: boolean;

  @Column({ default: 0 })
  sortOrder: number;
}

@Entity('user_badges')
@Unique(['userId', 'badgeCode'])
export class UserBadge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  userId: string;

  @Column()
  badgeCode: string;

  @CreateDateColumn()
  unlockedAt: Date;
}