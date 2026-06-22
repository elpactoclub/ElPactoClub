import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('user_blocks')
@Index(['blockerId', 'blockedId'], { unique: true })
export class UserBlock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  blockerId: string;

  @Column()
  blockedId: string;

  @CreateDateColumn()
  createdAt: Date;
}
