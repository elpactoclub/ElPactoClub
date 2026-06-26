// EN: Projects service: read access to active impact/social projects shown publicly.
// ES: Servicio de proyectos: acceso de lectura a los proyectos de impacto/sociales activos mostrados públicamente.
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './project.entity';

// EN: Injectable projects service with the project repository.
// ES: Servicio de proyectos inyectable con el repositorio de proyectos.
@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private readonly projectsRepo: Repository<Project>,
  ) {}

  // EN: Returns active projects ordered for public display.
  // ES: Devuelve los proyectos activos ordenados para mostrarlos públicamente.
  getActive(): Promise<Project[]> {
    return this.projectsRepo.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
    });
  }
}
