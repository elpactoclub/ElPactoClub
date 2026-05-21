import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { DirectMessage } from './direct-message.entity';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { BadgesService } from '../badges/badges.service';
import { NotificationsService } from '../notifications/notifications.service';

const CREATOR_DM_COST = 50;
const CREATOR_DM_XP = 30;
const CREATOR_DM_MAX_LEN = 100;

@Injectable()
export class DmService {
  constructor(
    @InjectRepository(DirectMessage) private dmRepo: Repository<DirectMessage>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private readonly users: UsersService,
    private readonly badges: BadgesService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Lista de conversaciones del usuario: último mensaje + no leídos por interlocutor */
  async getConversations(userId: string) {
    const msgs = await this.dmRepo.find({
      where: [{ senderId: userId }, { recipientId: userId }],
      order: { createdAt: 'DESC' },
      take: 500,
    });

    const partners = new Map<
      string,
      { lastMsg: DirectMessage; unread: number; lastIsMe: boolean }
    >();

    for (const m of msgs) {
      const partnerId = m.senderId === userId ? m.recipientId : m.senderId;
      const entry = partners.get(partnerId);
      if (!entry) {
        partners.set(partnerId, {
          lastMsg: m,
          unread: m.recipientId === userId && !m.readAt ? 1 : 0,
          lastIsMe: m.senderId === userId,
        });
      } else if (m.recipientId === userId && !m.readAt) {
        entry.unread += 1;
      }
    }

    const partnerIds = [...partners.keys()];
    const profiles = partnerIds.length ? await this.userRepo.findBy({ id: In(partnerIds) }) : [];
    const profileMap = Object.fromEntries(profiles.map((u) => [u.id, u]));

    return partnerIds
      .map((pid) => {
        const { lastMsg, unread, lastIsMe } = partners.get(pid)!;
        const u = profileMap[pid];
        return {
          partnerId: pid,
          name: u?.name ?? 'Fan',
          avatar: u?.avatar ?? '🏀',
          role: u?.role ?? 'fan',
          isCreator: u?.role === 'creator',
          lastMsg: lastMsg.content,
          lastMsgIsMe: lastIsMe,
          time: lastMsg.createdAt,
          unread: unread > 0,
          unreadCount: unread,
        };
      })
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }

  /** Hilo entre el usuario y un interlocutor. Marca como leídos los recibidos. */
  async getThread(userId: string, partnerId: string) {
    const partner = await this.userRepo.findOne({ where: { id: partnerId } });
    if (!partner) throw new NotFoundException('Usuario no encontrado');

    const messages = await this.dmRepo.find({
      where: [
        { senderId: userId, recipientId: partnerId },
        { senderId: partnerId, recipientId: userId },
      ],
      order: { createdAt: 'ASC' },
      take: 200,
    });

    // Marcar como leídos los mensajes recibidos
    await this.dmRepo
      .createQueryBuilder()
      .update(DirectMessage)
      .set({ readAt: new Date() })
      .where('recipientId = :userId AND senderId = :partnerId AND "readAt" IS NULL', { userId, partnerId })
      .execute();

    return {
      partner: {
        id: partner.id,
        name: partner.name,
        avatar: partner.avatar,
        role: partner.role,
        isCreator: partner.role === 'creator',
        costPerMsg: partner.role === 'creator' ? CREATOR_DM_COST : 0,
      },
      messages: messages.map((m) => ({
        id: m.id,
        content: m.content,
        isMe: m.senderId === userId,
        createdAt: m.createdAt,
        readAt: m.readAt,
      })),
    };
  }

  /** Envía un DM. Si el destinatario es creador: cobra 50⚡ + da 30XP al emisor. */
  async send(senderId: string, recipientId: string, rawContent: string) {
    const content = (rawContent ?? '').trim();
    if (!content) throw new BadRequestException('Mensaje vacío');
    if (senderId === recipientId) throw new BadRequestException('No puedes enviarte mensajes a ti mismo');

    const recipient = await this.userRepo.findOne({ where: { id: recipientId } });
    if (!recipient) throw new NotFoundException('Destinatario no encontrado');

    const isCreatorDM = recipient.role === 'creator';
    if (isCreatorDM && content.length > CREATOR_DM_MAX_LEN) {
      throw new BadRequestException(`Máximo ${CREATOR_DM_MAX_LEN} caracteres para mensajes a creadores`);
    }

    if (isCreatorDM) {
      // Cobra créditos (lanza ConflictException si insuficientes) y da XP
      await this.users.spendCredits(senderId, CREATOR_DM_COST);
      await this.users.addXP(senderId, CREATOR_DM_XP);

      // Badge fan_directo en el primer DM a creador
      const previousCreatorDMs = await this.dmRepo.count({
        where: { senderId, recipientId: In(await this.creatorIds()) },
      });
      if (previousCreatorDMs === 0) {
        await this.badges.award(senderId, 'fan_directo');
      }
    }

    const saved = await this.dmRepo.save(this.dmRepo.create({ senderId, recipientId, content, readAt: null }));

    return {
      id: saved.id,
      content: saved.content,
      isMe: true,
      createdAt: saved.createdAt,
      chargedCredits: isCreatorDM ? CREATOR_DM_COST : 0,
      xpGained: isCreatorDM ? CREATOR_DM_XP : 0,
    };
  }

  /** Marca como leídos todos los mensajes de un interlocutor */
  async markRead(userId: string, partnerId: string) {
    await this.dmRepo
      .createQueryBuilder()
      .update(DirectMessage)
      .set({ readAt: new Date() })
      .where('recipientId = :userId AND senderId = :partnerId AND "readAt" IS NULL', { userId, partnerId })
      .execute();
    return { ok: true };
  }

  /** Total de DMs no leídos del usuario (para badge en TopNav) */
  async unreadCount(userId: string) {
    const count = await this.dmRepo.count({ where: { recipientId: userId, readAt: IsNull() } });
    return { count };
  }

  /** Lista de creadores disponibles para iniciar conversación (id real para DMs) */
  async getCreators() {
    const creators = await this.userRepo.find({ where: { role: 'creator' as any } });
    return creators.map((c) => ({
      partnerId: c.id,
      name: c.name,
      avatar: c.avatar,
      role: c.role,
      isCreator: true,
      costPerMsg: CREATOR_DM_COST,
    }));
  }

  private async creatorIds(): Promise<string[]> {
    const creators = await this.userRepo.find({ where: { role: 'creator' as any }, select: ['id'] });
    const ids = creators.map((c) => c.id);
    return ids.length ? ids : ['__none__'];
  }
}
