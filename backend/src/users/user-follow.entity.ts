import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('user_follows')
@Index(['followerId', 'followedId'], { unique: true })
export class UserFollow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  followerId: string;

  @Column()
  followedId: string;

  @CreateDateColumn()
  createdAt: Date;
}
