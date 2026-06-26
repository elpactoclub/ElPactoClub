// EN: Donations controller: public totals plus authenticated endpoints to list and create donations.
// ES: Controlador de donaciones: totales públicos más endpoints autenticados para listar y crear donaciones.
import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DonationsService } from './donations.service';
import { ProjectId } from './donation.entity';

// EN: Controller exposing the /donations routes.
// ES: Controlador que expone las rutas /donations.
@ApiTags('donations')
@Controller('donations')
export class DonationsController {
  constructor(private readonly svc: DonationsService) {}

  // EN: GET /donations/totals — returns donation totals and supporters per project.
  // ES: GET /donations/totals — devuelve los totales de donaciones y donantes por proyecto.
  @Get('totals')
  totals() {
    return this.svc.totalsByProject();
  }

  // EN: GET /donations/me — returns the authenticated user's donations.
  // ES: GET /donations/me — devuelve las donaciones del usuario autenticado.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  mine(@Request() req: { user: { id: string } }) {
    return this.svc.myDonations(req.user.id);
  }

  // EN: POST /donations — creates a donation to a project for the authenticated user.
  // ES: POST /donations — crea una donación a un proyecto para el usuario autenticado.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Request() req: { user: { id: string } },
    @Body() body: { projectId: ProjectId; amount: number },
  ) {
    return this.svc.create(req.user.id, body.projectId, body.amount);
  }
}