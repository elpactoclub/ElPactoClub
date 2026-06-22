import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('club_creators')
export class ClubCreator {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string; // linked creator user account

  @Column({ nullable: true })
  name: string; // cached display name (fallback if user lookup fails)

  @Column({ type: 'text', nullable: true })
  photoUrl: string; // custom editorial card photo (base64 data URL or path)

  @Column({ default: 0 })
  displayOrder: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
