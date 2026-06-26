// EN: Club creators module: wires the club-creators controller, service and entities.
// ES: Módulo de creadores del club: conecta el controlador, servicio y entidades de creadores del club.
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClubCreator } from './club-creator.entity';
import { User } from '../users/user.entity';
import { ClubCreatorsService } from './club-creators.service';
import { ClubCreatorsController } from './club-creators.controller';

// EN: Club creators feature module declaration.
// ES: Declaración del módulo de la funcionalidad de creadores del club.
@Module({
  imports: [TypeOrmModule.forFeature([ClubCreator, User])],
  providers: [ClubCreatorsService],
  controllers: [ClubCreatorsController],
})
export class ClubCreatorsModule {}
