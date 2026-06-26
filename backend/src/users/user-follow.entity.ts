// EN: TypeORM entity for the user-follows-user relationship.
// ES: Entidad TypeORM para la relación de un usuario que sigue a otro.
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

// EN: Join row recording that followerId follows followedId.
// ES: Fila de unión que registra que followerId sigue a followedId.
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
