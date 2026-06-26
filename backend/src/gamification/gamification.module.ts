// EN: NestJS module wiring up the gamification feature (votes, raffles, daily roulette) with its dependencies.
// ES: Módulo NestJS que conecta la funcionalidad de gamificación (votaciones, sorteos, ruleta diaria) con sus dependencias.
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vote, UserVote } from './vote.entity';
import { Raffle, RaffleEntry } from './raffle.entity';
import { GamificationService } from './gamification.service';
import { GamificationController } from './gamification.controller';
import { UsersModule } from '../users/users.module';
import { BadgesModule } from '../badges/badges.module';
import { MissionsModule } from '../missions/missions.module';
import { NotificationsModule } from '../notifications/notifications.module';

// EN: Registers the gamification entities, service and controller and exports the service.
// ES: Registra las entidades, el servicio y el controlador de gamificación y exporta el servicio.
@Module({
  imports: [
    TypeOrmModule.forFeature([Vote, UserVote, Raffle, RaffleEntry]),
    UsersModule,
    BadgesModule,
    MissionsModule,
    NotificationsModule,
  ],
  providers: [GamificationService],
  controllers: [GamificationController],
  exports: [GamificationService],
})
export class GamificationModule {}
