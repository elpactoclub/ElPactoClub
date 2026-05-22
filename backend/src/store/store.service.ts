import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe = require('stripe');

@Injectable()
export class StoreService {
  private stripe: InstanceType<typeof Stripe> | null = null;

  constructor(private config: ConfigService) {
    const key = config.get<string>('STRIPE_SECRET_KEY', '');
    if (key) this.stripe = new Stripe(key);
  }

  private get client(): InstanceType<typeof Stripe> {
    if (!this.stripe) throw new BadRequestException('Stripe no configurado — añade STRIPE_SECRET_KEY al .env');
    return this.stripe;
  }

  async createCheckoutSession(userId: string | null, email: string | null) {
    const priceId = this.config.get<string>('STRIPE_PRICE_SOCIO');
    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3001');

    if (!priceId) throw new BadRequestException('STRIPE_PRICE_SOCIO no configurado');

    const session = await this.client.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${frontendUrl}?socio=success`,
      cancel_url: `${frontendUrl}?socio=cancel`,
      ...(email ? { customer_email: email } : {}),
      metadata: { userId: userId ?? '' },
    });

    return { url: session.url };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    const secret = this.config.get<string>('STRIPE_WEBHOOK_SECRET', '');
    let event: ReturnType<InstanceType<typeof Stripe>['webhooks']['constructEvent']>;

    try {
      event = this.client.webhooks.constructEvent(rawBody, signature, secret);
    } catch {
      throw new BadRequestException('Webhook signature inválida');
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as { metadata?: Record<string, string>; customer_email?: string };
      return { userId: session.metadata?.userId, email: session.customer_email };
    }

    return null;
  }
}
