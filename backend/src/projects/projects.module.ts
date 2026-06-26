// EN: Projects module: wires the projects controller, service and entity.
// ES: Módulo de proyectos: conecta el controlador, servicio y entidad de proyectos.
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './project.entity';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';

// EN: Projects feature module declaration.
// ES: Declaración del módulo de la funcionalidad de proyectos.
@Module({
  imports: [TypeOrmModule.forFeature([Project])],
  providers: [ProjectsService],
  controllers: [ProjectsController],
})
export class ProjectsModule {}
