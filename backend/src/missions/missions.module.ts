import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mission } from './mission.entity';
import { MissionsService } from './missions.service';
import { MissionsController } from './missions.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Mission]), NotificationsModule],
  providers: [MissionsService],
  controllers: [MissionsController],
  exports: [MissionsService],
})
export class MissionsModule {}