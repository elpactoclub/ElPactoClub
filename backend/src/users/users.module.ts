import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserFollow } from './user-follow.entity';
import { UserBlock } from './user-block.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { BadgesModule } from '../badges/badges.module';
import { UserVote } from '../gamification/vote.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserVote, UserFollow, UserBlock]), forwardRef(() => BadgesModule), NotificationsModule],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
