import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DmService } from './dm.service';
import { SendDmDto } from './dto/send-dm.dto';

@ApiTags('dm')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dm')
export class DmController {
  constructor(private readonly svc: DmService) {}

  @Get('conversations')
  getConversations(@Req() req: any) {
    return this.svc.getConversations(req.user.id);
  }

  @Get('creators')
  getCreators() {
    return this.svc.getCreators();
  }

  @Get('unread-count')
  unreadCount(@Req() req: any) {
    return this.svc.unreadCount(req.user.id);
  }

  @Get('thread/:partnerId')
  getThread(@Req() req: any, @Param('partnerId') partnerId: string) {
    return this.svc.getThread(req.user.id, partnerId);
  }

  @Post('send')
  @Throttle({ default: { ttl: 5000, limit: 1 } })
  send(@Req() req: any, @Body() body: SendDmDto) {
    return this.svc.send(req.user.id, body.recipientId, body.content);
  }

  @Post('read/:partnerId')
  markRead(@Req() req: any, @Param('partnerId') partnerId: string) {
    return this.svc.markRead(req.user.id, partnerId);
  }
}
