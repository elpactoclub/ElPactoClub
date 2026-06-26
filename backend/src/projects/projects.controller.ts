// EN: Projects controller: public endpoint to list active impact/social projects.
// ES: Controlador de proyectos: endpoint público para listar los proyectos de impacto/sociales activos.
import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';

// EN: Controller exposing the /projects routes.
// ES: Controlador que expone las rutas /projects.
@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // EN: GET /projects — returns the active projects.
  // ES: GET /projects — devuelve los proyectos activos.
  @Get()
  getActive() {
    return this.projectsService.getActive();
  }
}
