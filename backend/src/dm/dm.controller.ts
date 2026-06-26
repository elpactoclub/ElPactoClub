// EN: DM controller: authenticated HTTP endpoints for conversations, threads, sending and read state.
// ES: Controlador de DM: endpoints HTTP autenticados para conversaciones, hilos, envío y estado de lectura.
import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DmService } from './dm.service';
import { SendDmDto } from './dto/send-dm.dto';

// EN: Controller exposing the JWT-protected /dm routes.
// ES: Controlador que expone las rutas /dm protegidas por JWT.
@ApiTags('dm')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dm')
export class DmController {
  constructor(private readonly svc: DmService) {}

  // EN: GET /dm/conversations — lists the current user's conversations with unread counts.
  // ES: GET /dm/conversations — lista las conversaciones del usuario actual con conteos de no leídos.
  @Get('conversations')
  getConversations(@Req() req: any) {
    return this.svc.getConversations(req.user.id);
  }

  // EN: GET /dm/creators — lists creators available to start a conversation with.
  // ES: GET /dm/creators — lista los creadores disponibles para iniciar una conversación.
  @Get('creators')
  getCreators() {
    return this.svc.getCreators();
  }

  // EN: GET /dm/unread-count — returns the user's total unread DM count.
  // ES: GET /dm/unread-count — devuelve el total de DMs no leídos del usuario.
  @Get('unread-count')
  unreadCount(@Req() req: any) {
    return this.svc.unreadCount(req.user.id);
  }

  // EN: GET /dm/thread/:partnerId — returns the message thread with a partner and marks received messages read.
  // ES: GET /dm/thread/:partnerId — devuelve el hilo de mensajes con un interlocutor y marca como leídos los recibidos.
  @Get('thread/:partnerId')
  getThread(@Req() req: any, @Param('partnerId') partnerId: string) {
    return this.svc.getThread(req.user.id, partnerId);
  }

  // EN: POST /dm/send — sends a direct message (rate-limited to 1 per 5s).
  // ES: POST /dm/send — envía un mensaje directo (limitado a 1 cada 5s).
  @Post('send')
  @Throttle({ default: { ttl: 5000, limit: 1 } })
  send(@Req() req: any, @Body() body: SendDmDto) {
    return this.svc.send(req.user.id, body.recipientId, body.content);
  }

  // EN: POST /dm/read/:partnerId — marks all messages from a partner as read.
  // ES: POST /dm/read/:partnerId — marca como leídos todos los mensajes de un interlocutor.
  @Post('read/:partnerId')
  markRead(@Req() req: any, @Param('partnerId') partnerId: string) {
    return this.svc.markRead(req.user.id, partnerId);
  }
}
