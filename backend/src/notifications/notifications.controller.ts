import { Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @Get('me')
  list(@Request() req: { user: { id: string } }) {
    return this.svc.listForUser(req.user.id);
  }

  @Get('me/unread-count')
  unread(@Request() req: { user: { id: string } }) {
    return this.svc.unreadCount(req.user.id);
  }

  @Post(':id/read')
  read(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.svc.markRead(req.user.id, id);
  }
}