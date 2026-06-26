// EN: TypeORM entity and type for credit donations to social projects (india, tecnificar).
// ES: Entidad TypeORM y tipo para donaciones de créditos a proyectos sociales (india, tecnificar).
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

// EN: Identifiers of the donatable social projects.
// ES: Identificadores de los proyectos sociales a los que se puede donar.
export type ProjectId = 'india' | 'tecnificar';

// EN: Donation record: a user's credit contribution to a project.
// ES: Registro de donación: la aportación en créditos de un usuario a un proyecto.
@Entity('donations')
export class Donation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  userId: string;

  @Column({ type: 'enum', enum: ['india', 'tecnificar'] })
  projectId: ProjectId;

  @Column()
  amount: number;

  @CreateDateColumn()
  createdAt: Date;
}