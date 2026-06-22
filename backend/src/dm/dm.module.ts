import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DirectMessage } from './direct-message.entity';
import { User } from '../users/user.entity';
import { DmService } from './dm.service';
import { DmController } from './dm.controller';
import { UsersModule } from '../users/users.module';
import { BadgesModule } from '../badges/badges.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { GatewayModule } from '../gateway/gateway.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DirectMessage, User]),
    UsersModule,
    BadgesModule,
    NotificationsModule,
    GatewayModule,
    SettingsModule,
  ],
  controllers: [DmController],
  providers: [DmService],
  exports: [DmService],
})
export class DmModule {}
