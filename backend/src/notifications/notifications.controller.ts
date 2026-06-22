import { Body, Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { WebPushService } from './webpush.service';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly svc: NotificationsService,
    private readonly push: WebPushService,
  ) {}

  @Get('me')
  list(@Request() req: { user: { id: string } }) {
    return this.svc.listForUser(req.user.id);
  }

  @Get('me/unread-count')
  unread(@Request() req: { user: { id: string } }) {
    return this.svc.unreadCount(req.user.id);
  }

  @Post('read-all')
  readAll(@Request() req: { user: { id: string } }) {
    return this.svc.markAllRead(req.user.id);
  }

  @Post(':id/read')
  read(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.svc.markRead(req.user.id, id);
  }

  // Web Push
  @Get('push/vapid-public-key')
  vapidKey() {
    return { key: this.push.getPublicKey() };
  }

  @Post('push/subscribe')
  subscribe(
    @Request() req: { user: { id: string } },
    @Body() body: { endpoint: string; keys: { p256dh: string; auth: string } },
  ) {
    return this.push.subscribe(req.user.id, body);
  }

  @Delete('push/unsubscribe')
  unsubscribe(@Body() body: { endpoint: string }) {
    return this.push.unsubscribe(body.endpoint);
  }
}
