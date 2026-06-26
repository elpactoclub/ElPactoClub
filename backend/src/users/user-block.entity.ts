// EN: TypeORM entity for the user-blocks-user relationship.
// ES: Entidad TypeORM para la relación de un usuario que bloquea a otro.
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

// EN: Join row recording that blockerId has blocked blockedId.
// ES: Fila de unión que registra que blockerId ha bloqueado a blockedId.
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
