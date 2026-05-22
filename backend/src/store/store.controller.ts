import { Controller, Post, Headers, Req } from '@nestjs/common';
import { StoreService } from './store.service';
import { Request } from 'express';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('store')
@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Post('checkout')
  async checkout(@Req() req: Request & { user?: { id: string; email: string } }) {
    const userId = req.user?.id ?? null;
    const email = req.user?.email ?? null;
    return this.storeService.createCheckoutSession(userId, email);
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
