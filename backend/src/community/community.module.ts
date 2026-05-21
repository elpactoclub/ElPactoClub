import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post, Message } from './post.entity';
import { User } from '../users/user.entity';
import { CommunityService } from './community.service';
import { CommunityController } from './community.controller';
import { BadgesModule } from '../badges/badges.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, Message, User]),
    BadgesModule,
    NotificationsModule,
    UsersModule,
  ],
  providers: [CommunityService],
  controllers: [CommunityController],
})
export class CommunityModule {}
