import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

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