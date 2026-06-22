import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreService } from './store.service';
import { StoreController } from './store.controller';
import { User } from '../users/user.entity';
import { StoreBenefit } from './store-benefit.entity';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, StoreBenefit]), SettingsModule],
  providers: [StoreService],
  controllers: [StoreController],
})
export class StoreModule {}
