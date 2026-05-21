import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Badge, UserBadge } from './badge.entity';
import { BadgesService } from './badges.service';
import { BadgesController } from './badges.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Badge, UserBadge]), NotificationsModule],
  providers: [BadgesService],
  controllers: [BadgesController],
  exports: [BadgesService],
})
export class BadgesModule {}