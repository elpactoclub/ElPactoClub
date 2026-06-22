import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './notification.entity';
import { User } from '../users/user.entity';
import { PushSubscription } from './push-subscription.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { WebPushService } from './webpush.service';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, User, PushSubscription])],
  providers: [NotificationsService, WebPushService],
  controllers: [NotificationsController],
  exports: [NotificationsService, WebPushService],
})
export class NotificationsModule {}