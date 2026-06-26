// EN: TypeORM entity for club creator showcase cards (links a creator user to an editorial card).
// ES: Entidad TypeORM de tarjetas destacadas de creadores del club (vincula un usuario creador a una tarjeta editorial).
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

// EN: Club creator card record with cached name, photo and display order.
// ES: Registro de tarjeta de creador del club con nombre en caché, foto y orden de visualización.
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
