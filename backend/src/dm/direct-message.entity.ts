// EN: TypeORM entity for direct messages between users (sender, recipient, content, read state).
// ES: Entidad TypeORM de mensajes directos entre usuarios (emisor, destinatario, contenido, estado de lectura).
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

// EN: Direct message record, indexed by sender/recipient and recipient/read state.
// ES: Registro de mensaje directo, indexado por emisor/destinatario y destinatario/estado de lectura.
@Entity('direct_messages')
@Index(['senderId', 'recipientId'])
@Index(['recipientId', 'readAt'])
export class DirectMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  senderId: string;

  @Column()
  recipientId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
