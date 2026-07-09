// EN: NestJS module wiring the admin panel: registers entities, services and the admin controller.
// ES: Módulo NestJS del panel de administración: registra entidades, servicios y el controlador admin.
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Event, EventAttendee } from '../events/event.entity';
import { Vote, UserVote } from '../gamification/vote.entity';
import { Raffle, RaffleEntry } from '../gamification/raffle.entity';
import { Mission } from '../missions/mission.entity';
import { Post, Message } from '../community/post.entity';
import { StoreBenefit } from '../store/store-benefit.entity';
import { Project } from '../projects/project.entity';
import { ClubCreator } from '../club-creators/club-creator.entity';
import { SettingsModule } from '../settings/settings.module';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DmModule } from '../dm/dm.module';
import { BadgesModule } from '../badges/badges.module';
import { Badge, UserBadge } from '../badges/badge.entity';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

// EN: Admin feature module aggregating all administration capabilities.
// ES: Módulo de funcionalidad admin que agrupa todas las capacidades de administración.
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Event, EventAttendee, Vote, UserVote, Raffle, RaffleEntry, Mission, Post, Message, StoreBenefit, Project, ClubCreator, Badge, UserBadge]),
    SettingsModule,
    UsersModule,
    NotificationsModule,
    DmModule,
    BadgesModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
