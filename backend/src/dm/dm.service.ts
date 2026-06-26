// EN: DM service: conversations, threads, sending (with creator credit cost) and admin broadcasts.
// ES: Servicio de DM: conversaciones, hilos, envío (con coste en créditos a creadores) y difusiones de admin.
import { BadRequestException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { DirectMessage } from './direct-message.entity';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { BadgesService } from '../badges/badges.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AppGateway } from '../gateway/app.gateway';
import { SettingsService } from '../settings/settings.service';

const CREATOR_DM_MAX_LEN = 100;

// EN: Injectable DM service with repositories, gateway and dependent services.
// ES: Servicio de DM inyectable con repositorios, gateway y servicios dependientes.
@Injectable()
export class DmService {
  constructor(
    @InjectRepository(DirectMessage) private dmRepo: Repository<DirectMessage>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private readonly users: UsersService,
    private readonly badges: BadgesService,
    private readonly notifications: NotificationsService,
    private readonly settings: SettingsService,
    @Optional() private readonly gateway?: AppGateway,
  ) {}

  // EN: Credit cost charged for messaging a creator (configurable from the pricing panel).
  // ES: Coste en créditos por enviar mensaje a un creador (configurable desde el panel de precios).
  /** Coste/XP del DM a creador, configurables desde el panel (Precios). */
  private get creatorDmCost(): number { return this.settings.getNumber('dm_creator_cost_credits') || 50; }
  // EN: XP rewarded for messaging a creator (configurable from the pricing panel).
  // ES: XP otorgado por enviar mensaje a un creador (configurable desde el panel de precios).
  private get creatorDmXp(): number { return this.settings.getNumber('dm_creator_xp_reward') || 30; }

  // EN: Returns the user's conversations: last message and unread count per partner.
  // ES: Devuelve las conversaciones del usuario: último mensaje y no leídos por interlocutor.
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

  // EN: Returns the message thread between the user and a partner, marking received messages as read.
  // ES: Devuelve el hilo de mensajes entre el usuario y un interlocutor, marcando como leídos los recibidos.
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
        costPerMsg: partner.role === 'creator' ? this.creatorDmCost : 0,
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

  // EN: Sends a DM; if the recipient is a creator, charges credits and grants XP to the sender, plus first-DM badge.
  // ES: Envía un DM; si el destinatario es creador, cobra créditos y da XP al emisor, más la insignia del primer DM.
  /** Envía un DM. Si el destinatario es creador: cobra 50⚡ + da 30XP al emisor. */
  async send(senderId: string, recipientId: string, rawContent: string) {
    const content = (rawContent ?? '').trim();
    if (!content) throw new BadRequestException('Mensaje vacío');
    if (senderId === recipientId) throw new BadRequestException('No puedes enviarte mensajes a ti mismo');

    const [sender, recipient] = await Promise.all([
      this.userRepo.findOne({ where: { id: senderId } }),
      this.userRepo.findOne({ where: { id: recipientId } }),
    ]);
    if (!recipient) throw new NotFoundException('Destinatario no encontrado');

    const senderIsCreator = sender?.role === 'creator' || sender?.role === 'admin';
    // Solo cobra créditos cuando un FAN le escribe a un CREATOR, nunca al revés
    const isCreatorDM = !senderIsCreator && recipient.role === 'creator';
    if (isCreatorDM && content.length > CREATOR_DM_MAX_LEN) {
      throw new BadRequestException(`Máximo ${CREATOR_DM_MAX_LEN} caracteres para mensajes a creadores`);
    }

    const dmCost = this.creatorDmCost;
    const dmXp = this.creatorDmXp;
    if (isCreatorDM) {
      await this.users.spendCredits(senderId, dmCost);
      await this.users.addXP(senderId, dmXp);

      const previousCreatorDMs = await this.dmRepo.count({
        where: { senderId, recipientId: In(await this.creatorIds()) },
      });
      if (previousCreatorDMs === 0) {
        await this.badges.award(senderId, 'fan_directo');
      }
    }

    const saved = await this.dmRepo.save(this.dmRepo.create({ senderId, recipientId, content, readAt: null }));

    // Real-time: push to recipient's personal room
    if (this.gateway) {
      this.gateway.emitNewDM(recipientId, {
        id: saved.id,
        content: saved.content,
        isMe: false,
        senderId,
        senderName: sender?.name ?? 'Fan',
        senderAvatar: sender?.avatar ?? '🏀',
        senderRole: sender?.role ?? 'fan',
        createdAt: saved.createdAt,
      });
    }

    return {
      id: saved.id,
      content: saved.content,
      isMe: true,
      createdAt: saved.createdAt,
      chargedCredits: isCreatorDM ? dmCost : 0,
      xpGained: isCreatorDM ? dmXp : 0,
    };
  }

  // EN: Broadcasts a DM from an admin sender to many users (or all if no ids), free of charge.
  // ES: Difunde un DM desde un emisor admin a varios usuarios (o a todos si no hay ids), de forma gratuita.
  /**
   * Envía un DM desde `senderId` (admin) a varios usuarios a la vez.
   * Si `userIds` viene vacío/ausente, se envía a TODOS los usuarios.
   * Gratis (el emisor es admin). Aparece en la bandeja de DMs de cada uno.
   */
  async broadcast(senderId: string, rawContent: string, userIds?: string[]) {
    const content = (rawContent ?? '').trim();
    if (!content) throw new BadRequestException('Mensaje vacío');

    let recipientIds: string[];
    if (userIds && userIds.length > 0) {
      recipientIds = [...new Set(userIds)].filter((id) => id && id !== senderId);
    } else {
      const all = await this.userRepo.find({ select: ['id'] });
      recipientIds = all.map((u) => u.id).filter((id) => id !== senderId);
    }
    if (recipientIds.length === 0) return { sent: 0 };

    const sender = await this.userRepo.findOne({ where: { id: senderId } });
    const rows = recipientIds.map((rid) =>
      this.dmRepo.create({ senderId, recipientId: rid, content, readAt: null }),
    );
    const saved = await this.dmRepo.save(rows, { chunk: 200 });

    // Real-time push to each recipient (best-effort)
    if (this.gateway) {
      for (const m of saved) {
        this.gateway.emitNewDM(m.recipientId, {
          id: m.id,
          content: m.content,
          isMe: false,
          senderId,
          senderName: sender?.name ?? 'El Pacto',
          senderAvatar: sender?.avatar ?? '🏀',
          senderRole: sender?.role ?? 'admin',
          createdAt: m.createdAt,
        });
      }
    }

    return { sent: saved.length };
  }

  // EN: Marks all messages from a given partner as read.
  // ES: Marca como leídos todos los mensajes de un interlocutor dado.
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

  // EN: Returns the user's total unread DM count.
  // ES: Devuelve el total de DMs no leídos del usuario.
  /** Total de DMs no leídos del usuario (para badge en TopNav) */
  async unreadCount(userId: string) {
    const count = await this.dmRepo.count({ where: { recipientId: userId, readAt: IsNull() } });
    return { count };
  }

  // EN: Lists creators available to start a conversation with, including the per-message cost.
  // ES: Lista los creadores disponibles para iniciar conversación, incluyendo el coste por mensaje.
  /** Lista de creadores disponibles para iniciar conversación (id real para DMs) */
  async getCreators() {
    const creators = await this.userRepo.find({ where: { role: 'creator' as any } });
    return creators.map((c) => ({
      partnerId: c.id,
      name: c.name,
      avatar: c.avatar,
      role: c.role,
      isCreator: true,
      costPerMsg: this.creatorDmCost,
    }));
  }

  // EN: Returns all creator user ids (or a sentinel when none) for query filtering.
  // ES: Devuelve los ids de usuarios creadores (o un centinela si no hay) para filtrar consultas.
  private async creatorIds(): Promise<string[]> {
    const creators = await this.userRepo.find({ where: { role: 'creator' as any }, select: ['id'] });
    const ids = creators.map((c) => c.id);
    return ids.length ? ids : ['__none__'];
  }
}
