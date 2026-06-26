// EN: Store service: Stripe integration for socio subscriptions, credit packs and webhook handling.
// ES: Servicio de tienda: integración con Stripe para suscripciones de socio, packs de créditos y manejo de webhooks.
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { StoreBenefit } from './store-benefit.entity';
import { SettingsService } from '../settings/settings.service';
import Stripe = require('stripe');

// EN: Injectable store service holding the lazily-initialized Stripe client.
// ES: Servicio de tienda inyectable que contiene el cliente de Stripe inicializado de forma diferida.
@Injectable()
export class StoreService {
  private stripe: InstanceType<typeof Stripe> | null = null;

  constructor(
    private config: ConfigService,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(StoreBenefit) private benefitsRepo: Repository<StoreBenefit>,
    private readonly settingsService: SettingsService,
  ) {
    const key = config.get<string>('STRIPE_SECRET_KEY', '');
    if (key) this.stripe = new Stripe(key);
  }

  // EN: Returns active store benefits ordered for public display.
  // ES: Devuelve los beneficios activos ordenados para mostrarlos públicamente.
  /** Public: active store benefits, ordered. */
  getActiveBenefits(): Promise<StoreBenefit[]> {
    return this.benefitsRepo.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  // EN: Returns the Stripe client or throws if STRIPE_SECRET_KEY is not configured.
  // ES: Devuelve el cliente de Stripe o lanza error si STRIPE_SECRET_KEY no está configurada.
  private get client(): InstanceType<typeof Stripe> {
    if (!this.stripe) throw new BadRequestException('Stripe no configurado — añade STRIPE_SECRET_KEY al .env');
    return this.stripe;
  }

  // EN: Creates a one-time Stripe checkout session for a credits pack using dynamic pricing.
  // ES: Crea una sesión de checkout puntual de Stripe para un pack de créditos con precios dinámicos.
  async createCreditsCheckoutSession(pack: '100' | '200', userId: string | null, email: string | null) {
    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3001');

    const packages = {
      '100': { name: '100 créditos — El Pacto BC', amount: this.settingsService.getNumber('price_credits_100_cents'), credits: 100 },
      '200': { name: '200 créditos — El Pacto BC', amount: this.settingsService.getNumber('price_credits_200_cents'), credits: 200 },
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

  // EN: Creates a recurring Stripe subscription checkout session for socio membership.
  // ES: Crea una sesión de checkout de suscripción recurrente de Stripe para la membresía socio.
  async createCheckoutSession(userId: string | null, email: string | null) {
    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3001');

    const session = await this.client.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: 'Socio El Pacto BC' },
          unit_amount: this.settingsService.getNumber('price_socio_cents'),
          recurring: { interval: 'month' },
        },
        quantity: 1,
      }],
      success_url: `${frontendUrl}?socio=success`,
      cancel_url: `${frontendUrl}?socio=cancel`,
      ...(email ? { customer_email: email } : {}),
      metadata: { userId: userId ?? '' },
    });

    return { url: session.url };
  }

  // EN: Verifies and processes Stripe webhook events (credits purchase, subscription start/renew/cancel).
  // ES: Verifica y procesa los eventos de webhook de Stripe (compra de créditos, alta/renovación/baja de suscripción).
  async handleWebhook(rawBody: Buffer, signature: string) {
    const secret = this.config.get<string>('STRIPE_WEBHOOK_SECRET', '');
    let event: ReturnType<InstanceType<typeof Stripe>['webhooks']['constructEvent']>;

    try {
      event = this.client.webhooks.constructEvent(rawBody, signature, secret);
    } catch {
      throw new BadRequestException('Webhook signature inválida');
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as {
        mode?: string; metadata?: Record<string, string>; customer_email?: string;
        customer?: string; subscription?: string;
      };
      const userId = session.metadata?.userId;
      const credits = Number(session.metadata?.credits ?? 0);

      // One-time credits purchase — add credits to user account
      if (session.mode === 'payment' && userId && credits > 0) {
        await this.userRepo.increment({ id: userId }, 'credits', credits);
      }

      // Subscription created — link the Stripe customer/subscription so we can
      // grant the monthly credits on each future paid invoice.
      if (session.mode === 'subscription' && userId) {
        await this.userRepo.update({ id: userId }, {
          isSocio: true,
          stripeCustomerId: session.customer ?? undefined,
          stripeSubscriptionId: session.subscription ?? undefined,
        });
      }

      return { userId, email: session.customer_email };
    }

    // Recurring monthly payment succeeded → grant the 200 socio credits.
    // Only on renewals ('subscription_cycle'); the first month is granted on subscribe.
    if (event.type === 'invoice.paid' || event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as { customer?: string; billing_reason?: string };
      if (invoice.customer && invoice.billing_reason === 'subscription_cycle') {
        const user = await this.userRepo.findOne({ where: { stripeCustomerId: invoice.customer } });
        if (user) await this.userRepo.increment({ id: user.id }, 'credits', 200);
      }
      return null;
    }

    // Subscription cancelled / ended → revoke socio status (no more monthly credits).
    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as { id?: string; customer?: string };
      const user = await this.userRepo.findOne({
        where: sub.id ? { stripeSubscriptionId: sub.id } : { stripeCustomerId: sub.customer },
      });
      if (user) await this.userRepo.update({ id: user.id }, { isSocio: false, role: 'fan' as any });
      return null;
    }

    return null;
  }
}
