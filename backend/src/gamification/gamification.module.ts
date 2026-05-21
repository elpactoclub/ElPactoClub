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
