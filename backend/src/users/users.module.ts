// EN: Users module wiring user entities, the users service and controller.
// ES: Módulo de usuarios que conecta las entidades, el servicio y el controlador de usuarios.
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
// EN: NestJS module bundling user management features.
// ES: Módulo NestJS que agrupa las funcionalidades de gestión de usuarios.
export class UsersModule {}
