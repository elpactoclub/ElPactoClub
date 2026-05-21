import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Event } from '../events/event.entity';
import { Vote } from '../gamification/vote.entity';
import { Mission } from '../missions/mission.entity';
import { Post } from '../community/post.entity';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, Event, Vote, Mission, Post])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
