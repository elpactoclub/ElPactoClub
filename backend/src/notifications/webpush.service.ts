// EN: Web Push service: manages VAPID setup, subscriptions and sending push notifications via web-push.
// ES: Servicio Web Push: gestiona la configuración VAPID, las suscripciones y el envío de notificaciones push con web-push.
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PushSubscription } from './push-subscription.entity';
import * as webpush from 'web-push';

// EN: Injectable Web Push service; enabled only when VAPID keys are configured.
// ES: Servicio Web Push inyectable; habilitado solo cuando hay claves VAPID configuradas.
@Injectable()
export class WebPushService {
  private readonly logger = new Logger(WebPushService.name);
  private readonly enabled: boolean;

  constructor(
    @InjectRepository(PushSubscription)
    private readonly subsRepo: Repository<PushSubscription>,
  ) {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const email = process.env.VAPID_EMAIL ?? 'mailto:admin@elpactobc.com';
    this.enabled = !!(publicKey && privateKey);
    if (this.enabled) {
      webpush.setVapidDetails(email, publicKey!, privateKey!);
    }
  }

  // EN: Saves or updates a user's push subscription, keyed by endpoint.
  // ES: Guarda o actualiza la suscripción push de un usuario, indexada por endpoint.
  async subscribe(userId: string, sub: { endpoint: string; keys: { p256dh: string; auth: string } }) {
    const existing = await this.subsRepo.findOne({ where: { endpoint: sub.endpoint } });
    if (existing) {
      await this.subsRepo.update(existing.id, { userId, p256dh: sub.keys.p256dh, auth: sub.keys.auth });
    } else {
      await this.subsRepo.save({ userId, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth });
    }
  }

  // EN: Removes a push subscription by endpoint.
  // ES: Elimina una suscripción push por endpoint.
  async unsubscribe(endpoint: string) {
    await this.subsRepo.delete({ endpoint });
  }

  // EN: Sends a push notification to all of a single user's subscriptions.
  // ES: Envía una notificación push a todas las suscripciones de un usuario.
  async sendToUser(userId: string, title: string, body: string, data?: object) {
    if (!this.enabled) return;
    const subs = await this.subsRepo.find({ where: { userId } });
    await Promise.all(subs.map((s) => this.send(s, title, body, data)));
  }

  // EN: Sends a push notification to every stored subscription (best-effort).
  // ES: Envía una notificación push a todas las suscripciones almacenadas (best-effort).
  async sendToAll(title: string, body: string, data?: object) {
    if (!this.enabled) return;
    const subs = await this.subsRepo.find();
    await Promise.allSettled(subs.map((s) => this.send(s, title, body, data)));
  }

  // EN: Sends one push notification, deleting the subscription if it has expired (410/404).
  // ES: Envía una notificación push, eliminando la suscripción si ha caducado (410/404).
  private async send(sub: PushSubscription, title: string, body: string, data?: object) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title, body, data, icon: '/icon-192.png' }),
      );
    } catch (err: any) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        // Subscription expired — clean up
        await this.subsRepo.delete({ endpoint: sub.endpoint });
      } else {
        this.logger.warn(`Push failed for ${sub.userId}: ${err.message}`);
      }
    }
  }

  // EN: Returns the public VAPID key for the client to subscribe with.
  // ES: Devuelve la clave pública VAPID para que el cliente se suscriba.
  getPublicKey() {
    return process.env.VAPID_PUBLIC_KEY ?? null;
  }
}
