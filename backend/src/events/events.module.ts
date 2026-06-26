// EN: NestJS module wiring up the events feature (events, attendees, poll votes) with its dependencies.
// ES: Módulo NestJS que conecta la funcionalidad de eventos (eventos, asistentes, votos de encuestas) con sus dependencias.
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event, EventAttendee, EventPollVote } from './event.entity';
import { User } from '../users/user.entity';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { UsersModule } from '../users/users.module';

// EN: Registers the events entities, service and controller and exports the service.
// ES: Registra las entidades, el servicio y el controlador de eventos y exporta el servicio.
@Module({
  imports: [TypeOrmModule.forFeature([Event, EventAttendee, EventPollVote, User]), forwardRef(() => UsersModule)],
  providers: [EventsService],
  controllers: [EventsController],
  exports: [EventsService],
})
export class EventsModule {}
