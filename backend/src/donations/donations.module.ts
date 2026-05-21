import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Donation } from './donation.entity';
import { DonationsService } from './donations.service';
import { DonationsController } from './donations.controller';
import { UsersModule } from '../users/users.module';
import { BadgesModule } from '../badges/badges.module';
import { MissionsModule } from '../missions/missions.module';

@Module({
  imports: [TypeOrmModule.forFeature([Donation]), UsersModule, BadgesModule, MissionsModule],
  providers: [DonationsService],
  controllers: [DonationsController],
  exports: [DonationsService],
})
export class DonationsModule {}