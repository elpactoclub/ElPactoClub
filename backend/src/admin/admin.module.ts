import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Event, EventAttendee } from '../events/event.entity';
import { Vote, UserVote } from '../gamification/vote.entity';
import { Raffle, RaffleEntry } from '../gamification/raffle.entity';
import { Mission } from '../missions/mission.entity';
import { Post } from '../community/post.entity';
import { StoreBenefit } from '../store/store-benefit.entity';
import { Project } from '../projects/project.entity';
import { ClubCreator } from '../club-creators/club-creator.entity';
import { SettingsModule } from '../settings/settings.module';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DmModule } from '../dm/dm.module';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Event, EventAttendee, Vote, UserVote, Raffle, RaffleEntry, Mission, Post, StoreBenefit, Project, ClubCreator]),
    SettingsModule,
    UsersModule,
    NotificationsModule,
    DmModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
