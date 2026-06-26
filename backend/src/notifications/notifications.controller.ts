// EN: Notifications controller: authenticated endpoints for listing/reading notifications and Web Push subscription.
// ES: Controlador de notificaciones: endpoints autenticados para listar/leer notificaciones y suscripción Web Push.
import { Body, Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { WebPushService } from './webpush.service';

// EN: Controller exposing the JWT-protected /notifications routes.
// ES: Controlador que expone las rutas /notifications protegidas por JWT.
@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly svc: NotificationsService,
    private readonly push: WebPushService,
  ) {}

  // EN: GET /notifications/me — lists the current user's recent notifications.
  // ES: GET /notifications/me — lista las notificaciones recientes del usuario actual.
  @Get('me')
  list(@Request() req: { user: { id: string } }) {
    return this.svc.listForUser(req.user.id);
  }

  // EN: GET /notifications/me/unread-count — returns the user's unread notification count.
  // ES: GET /notifications/me/unread-count — devuelve el número de notificaciones no leídas del usuario.
  @Get('me/unread-count')
  unread(@Request() req: { user: { id: string } }) {
    return this.svc.unreadCount(req.user.id);
  }

  // EN: POST /notifications/read-all — marks all of the user's notifications as read.
  // ES: POST /notifications/read-all — marca como leídas todas las notificaciones del usuario.
  @Post('read-all')
  readAll(@Request() req: { user: { id: string } }) {
    return this.svc.markAllRead(req.user.id);
  }

  // EN: POST /notifications/:id/read — marks a single notification as read.
  // ES: POST /notifications/:id/read — marca una notificación concreta como leída.
  @Post(':id/read')
  read(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.svc.markRead(req.user.id, id);
  }

  // Web Push
  // EN: GET /notifications/push/vapid-public-key — returns the public VAPID key for subscribing.
  // ES: GET /notifications/push/vapid-public-key — devuelve la clave pública VAPID para suscribirse.
  @Get('push/vapid-public-key')
  vapidKey() {
    return { key: this.push.getPublicKey() };
  }

  // EN: POST /notifications/push/subscribe — registers a browser push subscription for the user.
  // ES: POST /notifications/push/subscribe — registra una suscripción push del navegador para el usuario.
  @Post('push/subscribe')
  subscribe(
    @Request() req: { user: { id: string } },
    @Body() body: { endpoint: string; keys: { p256dh: string; auth: string } },
  ) {
    return this.push.subscribe(req.user.id, body);
  }

  // EN: DELETE /notifications/push/unsubscribe — removes a browser push subscription by endpoint.
  // ES: DELETE /notifications/push/unsubscribe — elimina una suscripción push del navegador por endpoint.
  @Delete('push/unsubscribe')
  unsubscribe(@Body() body: { endpoint: string }) {
    return this.push.unsubscribe(body.endpoint);
  }
}
