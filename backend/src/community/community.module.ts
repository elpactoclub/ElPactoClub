import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post, Message, PostComment } from './post.entity';
import { Story } from './story.entity';
import { User } from '../users/user.entity';
import { CommunityService } from './community.service';
import { CommunityController } from './community.controller';
import { BadgesModule } from '../badges/badges.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { TigrisModule } from '../tigris/tigris.module';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, Message, PostComment, Story, User]),
    BadgesModule,
    NotificationsModule,
    UsersModule,
    TigrisModule,
    GatewayModule,
  ],
  providers: [CommunityService],
  controllers: [CommunityController],
})
export class CommunityModule {}
