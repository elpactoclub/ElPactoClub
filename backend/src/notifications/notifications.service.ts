import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './notification.entity';
import { User } from '../users/user.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private readonly repo: Repository<Notification>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
  ) {}

  listForUser(userId: string) {
    return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' }, take: 30 });
  }

  async markRead(userId: string, id: string) {
    await this.repo.update({ id, userId }, { readAt: new Date() });
    return { ok: true };
  }

  async unreadCount(userId: string) {
    const count = await this.repo
      .createQueryBuilder('n')
      .where('n.userId = :userId', { userId })
      .andWhere('n.readAt IS NULL')
      .getCount();
    return { count };
  }

  notify(userId: string, type: NotificationType, title: string, body: string, payload?: Record<string, any>) {
    return this.repo.save({ userId, type, title, body, payload });
  }

  async notifyAll(type: NotificationType, title: string, body: string, payload?: Record<string, any>) {
    const users = await this.usersRepo.find({ select: ['id'] });
    if (users.length === 0) return;
    const rows = users.map((u) => ({ userId: u.id, type, title, body, payload }));
    await this.repo.save(rows);
  }
}
