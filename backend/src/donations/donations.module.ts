// EN: Donations module: wires the donations controller, service, entity and gamification modules.
// ES: Módulo de donaciones: conecta el controlador, servicio, entidad y módulos de gamificación de donaciones.
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Donation } from './donation.entity';
import { DonationsService } from './donations.service';
import { DonationsController } from './donations.controller';
import { UsersModule } from '../users/users.module';
import { BadgesModule } from '../badges/badges.module';
import { MissionsModule } from '../missions/missions.module';

// EN: Donations feature module declaration.
// ES: Declaración del módulo de la funcionalidad de donaciones.
@Module({
  imports: [TypeOrmModule.forFeature([Donation]), UsersModule, BadgesModule, MissionsModule],
  providers: [DonationsService],
  controllers: [DonationsController],
  exports: [DonationsService],
})
export class DonationsModule {}