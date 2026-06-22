import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column()
  slug: string; // used for chat channel `project-<slug>` and donations projectId

  @Column({ nullable: true })
  emoji: string;

  @Column({ type: 'text', nullable: true })
  imageUrl: string; // optional image (base64 data URL or external URL)

  @Column()
  title: string;

  @Column({ nullable: true })
  subtitle: string;

  @Column({ type: 'text', nullable: true })
  summary: string; // short text for the card in El Pacto

  @Column({ type: 'text', nullable: true })
  description: string; // full text for the project page

  @Column({ nullable: true })
  color: string; // hex accent color

  @Column({ nullable: true })
  badgeLabel: string; // badge unlocked on first donation, e.g. "Dribble Spirit 🇮🇳"

  @Column({ default: 0 })
  displayOrder: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
