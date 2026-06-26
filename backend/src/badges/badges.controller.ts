// EN: Badges controller: public badge catalog and the authenticated user's unlocked badges.
// ES: Controlador de insignias: catálogo público de insignias y las insignias desbloqueadas del usuario autenticado.
import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BadgesService } from './badges.service';

// EN: Controller exposing the /badges routes.
// ES: Controlador que expone las rutas /badges.
@ApiTags('badges')
@Controller('badges')
export class BadgesController {
  constructor(private readonly svc: BadgesService) {}

  // EN: GET /badges — returns the full badge catalog.
  // ES: GET /badges — devuelve el catálogo completo de insignias.
  @Get()
  catalog() {
    return this.svc.catalog();
  }

  // EN: GET /badges/me — returns the authenticated user's unlocked badges.
  // ES: GET /badges/me — devuelve las insignias desbloqueadas del usuario autenticado.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  mine(@Request() req: { user: { id: string } }) {
    return this.svc.listForUser(req.user.id);
  }
}