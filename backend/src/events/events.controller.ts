// EN: REST controller for events: listing, details, registration, attendees and event polls.
// ES: Controlador REST de eventos: listado, detalles, inscripción, asistentes y encuestas de eventos.
import { Body, Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { EventsService } from './events.service';
import { SubmitEventDto } from './dto/submit-event.dto';

// EN: Groups all event endpoints under the /events route prefix.
// ES: Agrupa todos los endpoints de eventos bajo el prefijo de ruta /events.
@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  // EN: Returns all active, approved events.
  // ES: Devuelve todos los eventos activos y aprobados.
  @Get()
  @ApiOperation({ summary: 'Get all active events' })
  findAll() {
    return this.eventsService.findAll();
  }

  // EN: Returns upcoming approved events (those with a future date).
  // ES: Devuelve los próximos eventos aprobados (con fecha futura).
  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming events' })
  findUpcoming() {
    return this.eventsService.findUpcoming();
  }

  // EN: Returns events created/submitted by the authenticated creator.
  // ES: Devuelve los eventos creados/enviados por el creador autenticado.
  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  myEvents(@Request() req: any) {
    return this.eventsService.getCreatorEvents(req.user.id);
  }

  // EN: Lists the users registered for an event (admin/creator only).
  // ES: Lista los usuarios inscritos en un evento (solo admin/creador).
  @Get(':id/attendees')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'creator')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List users registered for an event (admin/creator)' })
  attendees(@Param('id') id: string) {
    return this.eventsService.getAttendees(id);
  }

  // EN: Returns whether the current user is registered for the event.
  // ES: Indica si el usuario actual está inscrito en el evento.
  @Get(':id/registered')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Whether the current user is registered for the event' })
  async registered(@Param('id') id: string, @Request() req: any) {
    return { registered: await this.eventsService.isRegistered(id, req.user.id) };
  }

  // EN: Submits a new event for admin approval (creators).
  // ES: Envía un nuevo evento a aprobación del admin (creadores).
  @Post('submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit event for admin approval (creators)' })
  submitEvent(@Body() dto: SubmitEventDto, @Request() req: any) {
    return this.eventsService.submitEvent(dto, req.user.id);
  }

  // EN: Returns the details of a single event by id.
  // ES: Devuelve los detalles de un único evento por id.
  @Get(':id')
  @ApiOperation({ summary: 'Get event details' })
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  // EN: Registers the current user as an attendee of an event.
  // ES: Inscribe al usuario actual como asistente de un evento.
  @Post(':id/register')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register for an event' })
  register(@Param('id') id: string, @Request() req: any) {
    return this.eventsService.registerAttendee(id, req.user?.id);
  }

  // EN: Returns poll vote counts for an event, including the user's own votes when authenticated.
  // ES: Devuelve los recuentos de votos de las encuestas de un evento, incluyendo los votos propios del usuario si está autenticado.
  @Get(':id/votes')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get poll vote counts for an event' })
  getVotes(@Param('id') id: string, @Request() req: any) {
    return this.eventsService.getPollVotes(id, req.user?.id);
  }

  // EN: Casts the current user's vote on a specific poll of an event.
  // ES: Registra el voto del usuario actual en una encuesta concreta de un evento.
  @Post(':id/vote')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cast a poll vote for an event' })
  castVote(@Param('id') id: string, @Request() req: any, @Body() body: { pollIndex: number; option: string }) {
    return this.eventsService.castPollVote(id, req.user.id, body.pollIndex, body.option);
  }
}
