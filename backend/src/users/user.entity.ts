import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

export type UserLevel = 'Rookie' | 'Starter' | 'MVP' | 'Leyenda';
export type UserRole = 'fan' | 'socio' | 'creator' | 'admin';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password: string; // hashed, nullable for social auth

  @Column({ default: 'Tu Fan' })
  name: string;

  @Column({ default: '🏀' })
  avatar: string;

  @Column({ default: 'Madrid' })
  city: string;

  @Column({ type: 'enum', enum: ['fan', 'socio', 'creator', 'admin'], default: 'fan' })
  role: UserRole;

  // Gamification
  @Column({ default: 0 })
  credits: number;

  @Column({ default: 0 })
  xp: number;

  @Column({ type: 'enum', enum: ['Rookie', 'Starter', 'MVP', 'Leyenda'], default: 'Rookie' })
  level: UserLevel;

  @Column({ default: 0 })
  streak: number;

  @Column({ nullable: true })
  lastLoginDate: Date;

  @Column({ nullable: true })
  dailyRewardClaimedAt: Date;

  // Membership
  @Column({ default: false })
  isSocio: boolean;

  @Column({ nullable: true })
  socioSince: Date;

  @Column({ nullable: true })
  stripeCustomerId: string;

  @Column({ nullable: true })
  stripeSubscriptionId: string;

  // Referrals
  @Column({ unique: true, nullable: true })
  referralCode: string;

  @Column({ nullable: true })
  referredBy: string;

  @Column({ default: 0 })
  referralCount: number;

  // Social
  @Column({ nullable: true })
  bio: string;

  @Column({ default: false })
  isOnline: boolean;

  @Column({ nullable: true })
  lastSeenAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
