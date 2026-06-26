// EN: Notifications service: persists in-app notifications and fans them out via Web Push.
// ES: Servicio de notificaciones: persiste las notificaciones en la app y las reenvía vía Web Push.
import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './notification.entity';
import { User } from '../users/user.entity';
import { WebPushService } from './webpush.service';

// EN: Injectable notifications service with notification/user repositories and optional Web Push.
// ES: Servicio de notificaciones inyectable con repositorios de notificación/usuario y Web Push opcional.
@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private readonly repo: Repository<Notification>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @Optional() private readonly webPush?: WebPushService,
  ) {}

  // EN: Lists the user's most recent notifications.
  // ES: Lista las notificaciones más recientes del usuario.
  listForUser(userId: string) {
    return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' }, take: 30 });
  }

  // EN: Marks a single notification as read for the user.
  // ES: Marca una notificación concreta como leída para el usuario.
  async markRead(userId: string, id: string) {
    await this.repo.update({ id, userId }, { readAt: new Date() });
    return { ok: true };
  }

  // EN: Marks all of the user's unread notifications as read.
  // ES: Marca como leídas todas las notificaciones no leídas del usuario.
  async markAllRead(userId: string) {
    await this.repo
      .createQueryBuilder()
      .update()
      .set({ readAt: new Date() })
      .where('"userId" = :userId AND "readAt" IS NULL', { userId })
      .execute();
    return { ok: true };
  }

  // EN: Returns the user's unread notification count.
  // ES: Devuelve el número de notificaciones no leídas del usuario.
  async unreadCount(userId: string) {
    const count = await this.repo
      .createQueryBuilder('n')
      .where('n.userId = :userId', { userId })
      .andWhere('n.readAt IS NULL')
      .getCount();
    return { count };
  }

  // EN: Persists a notification for one user and sends a matching web push.
  // ES: Persiste una notificación para un usuario y envía el push web correspondiente.
  async notify(userId: string, type: NotificationType, title: string, body: string, payload?: Record<string, any>) {
    const saved = await this.repo.save({ userId, type, title, body, payload });
    // Also send web push if service available
    this.webPush?.sendToUser(userId, title, body, payload).catch(() => {});
    return saved;
  }

  // EN: Persists a notification for every user and broadcasts a web push.
  // ES: Persiste una notificación para todos los usuarios y difunde un push web.
  async notifyAll(type: NotificationType, title: string, body: string, payload?: Record<string, any>) {
    const users = await this.usersRepo.find({ select: ['id'] });
    if (users.length === 0) return;
    const rows = users.map((u) => ({ userId: u.id, type, title, body, payload }));
    await this.repo.save(rows);
    // Send web push broadcast
    this.webPush?.sendToAll(title, body, payload).catch(() => {});
  }
}
