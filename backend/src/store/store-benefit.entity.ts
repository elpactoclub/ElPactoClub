import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('store_benefits')
export class StoreBenefit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  discount: string; // e.g. "5%", "10%", "2x1"

  @Column({ nullable: true })
  emoji: string; // fallback icon when no image

  @Column({ type: 'text', nullable: true })
  imageUrl: string; // optional logo (base64 data URL or external URL)

  @Column({ nullable: true })
  color: string; // gradient base color for the icon tile

  @Column({ nullable: true })
  link: string; // external URL to the partner store / discount

  @Column({ default: 0 })
  displayOrder: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
