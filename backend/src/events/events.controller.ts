import { Body, Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { EventsService } from './events.service';
import { SubmitEventDto } from './dto/submit-event.dto';

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

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  myEvents(@Request() req: any) {
    return this.eventsService.getCreatorEvents(req.user.id);
  }

  @Get(':id/attendees')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'creator')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List users registered for an event (admin/creator)' })
  attendees(@Param('id') id: string) {
    return this.eventsService.getAttendees(id);
  }

  @Get(':id/registered')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Whether the current user is registered for the event' })
  async registered(@Param('id') id: string, @Request() req: any) {
    return { registered: await this.eventsService.isRegistered(id, req.user.id) };
  }

  @Post('submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit event for admin approval (creators)' })
  submitEvent(@Body() dto: SubmitEventDto, @Request() req: any) {
    return this.eventsService.submitEvent(dto, req.user.id);
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
  register(@Param('id') id: string, @Request() req: any) {
    return this.eventsService.registerAttendee(id, req.user?.id);
  }

  @Get(':id/votes')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get poll vote counts for an event' })
  getVotes(@Param('id') id: string, @Request() req: any) {
    return this.eventsService.getPollVotes(id, req.user?.id);
  }

  @Post(':id/vote')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cast a poll vote for an event' })
  castVote(@Param('id') id: string, @Request() req: any, @Body() body: { pollIndex: number; option: string }) {
    return this.eventsService.castPollVote(id, req.user.id, body.pollIndex, body.option);
  }
}
