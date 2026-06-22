import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClubCreator } from './club-creator.entity';
import { User } from '../users/user.entity';
import { ClubCreatorsService } from './club-creators.service';
import { ClubCreatorsController } from './club-creators.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ClubCreator, User])],
  providers: [ClubCreatorsService],
  controllers: [ClubCreatorsController],
})
export class ClubCreatorsModule {}
