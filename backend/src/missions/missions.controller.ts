// EN: Missions controller: public endpoint to list active community missions.
// ES: Controlador de misiones: endpoint público para listar las misiones comunitarias activas.
import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MissionsService } from './missions.service';

// EN: Controller exposing the /missions routes.
// ES: Controlador que expone las rutas /missions.
@ApiTags('missions')
@Controller('missions')
export class MissionsController {
  constructor(private readonly svc: MissionsService) {}

  // EN: GET /missions — returns the active missions.
  // ES: GET /missions — devuelve las misiones activas.
  @Get()
  list() {
    return this.svc.listActive();
  }
}