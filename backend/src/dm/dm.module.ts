// EN: DM module: wires the direct-messages controller, service, entities and dependent modules.
// ES: Módulo de DM: conecta el controlador, servicio, entidades y módulos dependientes de mensajes directos.
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

// EN: DM feature module declaration.
// ES: Declaración del módulo de la funcionalidad de DM.
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
