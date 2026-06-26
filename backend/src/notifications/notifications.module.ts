// EN: Notifications module: wires in-app notifications and Web Push services, controllers and entities.
// ES: Módulo de notificaciones: conecta los servicios de notificaciones en la app y Web Push, controladores y entidades.
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './notification.entity';
import { User } from '../users/user.entity';
import { PushSubscription } from './push-subscription.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { WebPushService } from './webpush.service';

// EN: Notifications feature module declaration.
// ES: Declaración del módulo de la funcionalidad de notificaciones.
@Module({
  imports: [TypeOrmModule.forFeature([Notification, User, PushSubscription])],
  providers: [NotificationsService, WebPushService],
  controllers: [NotificationsController],
  exports: [NotificationsService, WebPushService],
})
export class NotificationsModule {}