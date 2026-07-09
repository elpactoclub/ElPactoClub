// EN: Missions module: wires the missions controller, service and entity.
// ES: Módulo de misiones: conecta el controlador, servicio y entidad de misiones.
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mission } from './mission.entity';
import { UserMissionProgress } from './user-mission-progress.entity';
import { MissionsService } from './missions.service';
import { MissionsController } from './missions.controller';
import { NotificationsModule } from '../notifications/notifications.module';

// EN: Missions feature module declaration.
// ES: Declaración del módulo de la funcionalidad de misiones.
@Module({
  imports: [TypeOrmModule.forFeature([Mission, UserMissionProgress]), NotificationsModule],
  providers: [MissionsService],
  controllers: [MissionsController],
  exports: [MissionsService, TypeOrmModule],
})
export class MissionsModule {}