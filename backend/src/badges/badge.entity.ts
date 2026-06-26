// EN: TypeORM entities for badges (catalog) and user_badges (unlocked badges per user).
// ES: Entidades TypeORM de insignias (catálogo) y user_badges (insignias desbloqueadas por usuario).
import { Entity, PrimaryColumn, Column, Index, CreateDateColumn, PrimaryGeneratedColumn, Unique } from 'typeorm';

// EN: Badge catalog entry (code, name, emoji, description, secret flag, order).
// ES: Entrada del catálogo de insignias (código, nombre, emoji, descripción, marca de secreta, orden).
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

// EN: Join record of a badge unlocked by a user, unique per user/badge.
// ES: Registro de unión de una insignia desbloqueada por un usuario, único por usuario/insignia.
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