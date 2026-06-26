// EN: TypeORM entity for app settings stored as key/value pairs (e.g. dynamic prices).
// ES: Entidad TypeORM de ajustes de la app guardados como pares clave/valor (p. ej. precios dinámicos).
import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

// EN: App setting record keyed by a unique setting key.
// ES: Registro de ajuste de la app identificado por una clave única.
@Entity('app_settings')
export class AppSetting {
  @PrimaryColumn()
  key: string;

  @Column({ type: 'text' })
  value: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
