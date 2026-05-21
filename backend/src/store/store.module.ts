import { Module } from '@nestjs/common';

// Store module — Stripe integration will be wired here
// Endpoints: /store/plans, /store/checkout, /store/credits, /store/webhook
@Module({
  imports: [],
  providers: [],
  controllers: [],
})
export class StoreModule {}
