import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EventsService } from './events.service';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active events' })
  findAll() {
    return this.eventsService.findAll();
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming events' })
  findUpcoming() {
    return this.eventsService.findUpcoming();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event details' })
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Post(':id/register')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register for an event' })
  register(@Param('id') id: string) {
    return this.eventsService.registerAttendee(id);
  }
}
