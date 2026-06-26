// EN: Club creators controller: public endpoint to list active club creator cards.
// ES: Controlador de creadores del club: endpoint público para listar las tarjetas activas de creadores del club.
import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ClubCreatorsService } from './club-creators.service';

// EN: Controller exposing the /club-creators routes.
// ES: Controlador que expone las rutas /club-creators.
@ApiTags('club-creators')
@Controller('club-creators')
export class ClubCreatorsController {
  constructor(private readonly service: ClubCreatorsService) {}

  // EN: GET /club-creators — returns the active club creator cards.
  // ES: GET /club-creators — devuelve las tarjetas activas de creadores del club.
  @Get()
  getActive() {
    return this.service.getActive();
  }
}
