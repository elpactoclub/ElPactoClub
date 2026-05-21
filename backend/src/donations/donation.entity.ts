import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export type ProjectId = 'india' | 'tecnificar';

@Entity('donations')
export class Donation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  userId: string;

  @Column({ type: 'enum', enum: ['india', 'tecnificar'] })
  projectId: ProjectId;

  @Column()
  amount: number;

  @CreateDateColumn()
  createdAt: Date;
}