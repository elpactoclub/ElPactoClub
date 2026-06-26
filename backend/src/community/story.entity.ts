// EN: TypeORM entity for ephemeral user stories (image + caption, auto-expire after 24h).
// ES: Entidad TypeORM para historias efímeras del usuario (imagen + texto, caducan a las 24h).
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

// EN: Story row: belongs to a user, holds an optional image URL and caption.
// ES: Fila de historia: pertenece a un usuario, guarda URL de imagen y texto opcionales.
@Entity('stories')
export class Story {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  caption: string;

  @CreateDateColumn()
  createdAt: Date;
}
