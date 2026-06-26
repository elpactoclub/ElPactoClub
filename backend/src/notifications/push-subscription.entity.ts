// EN: TypeORM entity storing browser Web Push subscriptions (endpoint + encryption keys) per user.
// ES: Entidad TypeORM que guarda las suscripciones Web Push del navegador (endpoint + claves de cifrado) por usuario.
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

// EN: Push subscription record linking a user to a browser push endpoint and its keys.
// ES: Registro de suscripción push que vincula a un usuario con un endpoint push del navegador y sus claves.
@Entity('push_subscriptions')
export class PushSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  userId: string;

  @Column({ unique: true })
  endpoint: string;

  @Column()
  p256dh: string;

  @Column()
  auth: string;

  @CreateDateColumn()
  createdAt: Date;
}
