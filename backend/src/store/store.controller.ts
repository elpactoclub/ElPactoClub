import { Controller, Post, Get, Body, Headers, Req, UseGuards } from '@nestjs/common';
import { StoreService } from './store.service';
import { Request } from 'express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('store')
@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get('benefits')
  getBenefits() {
    return this.storeService.getActiveBenefits();
  }

  @Post('checkout')
  async checkout(@Req() req: Request & { user?: { id: string; email: string } }) {
    const userId = req.user?.id ?? null;
    const email = req.user?.email ?? null;
    return this.storeService.createCheckoutSession(userId, email);
  }

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

  @Post('webhook')
  async webhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody ?? Buffer.alloc(0);
    return this.storeService.handleWebhook(rawBody, signature);
  }
}
