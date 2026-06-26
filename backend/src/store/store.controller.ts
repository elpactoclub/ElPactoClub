// EN: Store controller: HTTP endpoints for benefits, Stripe checkout sessions and webhooks.
// ES: Controlador de tienda: endpoints HTTP de beneficios, sesiones de checkout de Stripe y webhooks.
import { Controller, Post, Get, Body, Headers, Req, UseGuards } from '@nestjs/common';
import { StoreService } from './store.service';
import { Request } from 'express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// EN: Controller exposing the /store routes.
// ES: Controlador que expone las rutas /store.
@ApiTags('store')
@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  // EN: GET /store/benefits — returns active store benefits.
  // ES: GET /store/benefits — devuelve los beneficios activos de la tienda.
  @Get('benefits')
  getBenefits() {
    return this.storeService.getActiveBenefits();
  }

  // EN: POST /store/checkout — creates a Stripe subscription checkout session for socio membership.
  // ES: POST /store/checkout — crea una sesión de checkout de suscripción de Stripe para la membresía socio.
  @Post('checkout')
  async checkout(@Req() req: Request & { user?: { id: string; email: string } }) {
    const userId = req.user?.id ?? null;
    const email = req.user?.email ?? null;
    return this.storeService.createCheckoutSession(userId, email);
  }

  // EN: POST /store/checkout-credits — creates a one-time Stripe checkout session to buy a credits pack (auth required).
  // ES: POST /store/checkout-credits — crea una sesión de checkout puntual de Stripe para comprar un pack de créditos (requiere autenticación).
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('checkout-credits')
  async checkoutCredits(
    @Body('pack') pack: '100' | '200',
    @Req() req: Request & { user?: { id: string; email: string } },
  ) {
    const userId = req.user?.id ?? null;
    const email = req.user?.email ?? null;
    return this.storeService.createCreditsCheckoutSession(pack, userId, email);
  }

  // EN: POST /store/webhook — receives and verifies Stripe webhook events from the raw request body.
  // ES: POST /store/webhook — recibe y verifica los eventos de webhook de Stripe desde el cuerpo crudo de la petición.
  @Post('webhook')
  async webhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody ?? Buffer.alloc(0);
    return this.storeService.handleWebhook(rawBody, signature);
  }
}
