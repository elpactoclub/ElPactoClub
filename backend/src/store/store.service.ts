import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import Stripe = require('stripe');

@Injectable()
export class StoreService {
  private stripe: InstanceType<typeof Stripe> | null = null;

  constructor(
    private config: ConfigService,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {
    const key = config.get<string>('STRIPE_SECRET_KEY', '');
    if (key) this.stripe = new Stripe(key);
  }

  private get client(): InstanceType<typeof Stripe> {
    if (!this.stripe) throw new BadRequestException('Stripe no configurado — añade STRIPE_SECRET_KEY al .env');
    return this.stripe;
  }

  async createCreditsCheckoutSession(pack: '100' | '200', userId: string | null, email: string | null) {
    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3001');

    const packages = {
      '100': { name: '100 créditos — El Pacto BC', amount: 350, credits: 100 },
      '200': { name: '200 créditos — El Pacto BC', amount: 600, credits: 200 },
    };

    const pkg = packages[pack];
    if (!pkg) throw new BadRequestException('Pack inválido');

    const session = await this.client.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: pkg.name },
          unit_amount: pkg.amount,
        },
        quantity: 1,
      }],
      success_url: `${frontendUrl}?credits_success=${pkg.credits}`,
      cancel_url: `${frontendUrl}`,
      ...(email ? { customer_email: email } : {}),
      metadata: { userId: userId ?? '', credits: String(pkg.credits) },
    });

    return { url: session.url };
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
      const session = event.data.object as { mode?: string; metadata?: Record<string, string>; customer_email?: string };
      const userId = session.metadata?.userId;
      const credits = Number(session.metadata?.credits ?? 0);

      // One-time credits purchase — add credits to user account
      if (session.mode === 'payment' && userId && credits > 0) {
        await this.userRepo.increment({ id: userId }, 'credits', credits);
      }

      return { userId, email: session.customer_email };
    }

    return null;
  }
}
