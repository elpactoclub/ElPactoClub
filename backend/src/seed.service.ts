import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './events/event.entity';
import { Raffle } from './gamification/raffle.entity';
import { Vote } from './gamification/vote.entity';
import { BadgesService } from './badges/badges.service';
import { MissionsService } from './missions/missions.service';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Event) private readonly eventsRepo: Repository<Event>,
    @InjectRepository(Raffle) private readonly rafflesRepo: Repository<Raffle>,
    @InjectRepository(Vote) private readonly votesRepo: Repository<Vote>,
    private readonly badges: BadgesService,
    private readonly missions: MissionsService,
  ) {}

  async onApplicationBootstrap() {
    console.log('🌱 Seeding database initial items...');

    // 1. Seed Raffles
    const raffleCount = await this.rafflesRepo.count();
    if (raffleCount === 0) {
      await this.rafflesRepo.save({
        title: 'PRODUCTO HOOPS',
        description: 'Camiseta oficial de la temporada de verano firmada por los fundadores',
        prizeValue: 200.00,
        ticketCost: 75,
        xpReward: 50,
        participantCount: 248,
        isActive: true,
        month: '2026-06',
      });
      console.log('✅ Seeded monthly raffle');
    }

    // 2. Seed Events
    const eventCount = await this.eventsRepo.count();
    if (eventCount === 0) {
      const tourDate = new Date();
      tourDate.setDate(tourDate.getDate() + 12);

      await this.eventsRepo.save([
        {
          title: "MVP'S TOUR 3x3",
          description: 'Torneo nacional 3x3 con premios en metálico y créditos',
          type: 'tour',
          date: tourDate,
          location: 'Pistas de Vilanova',
          city: 'Vilanova',
          creditsCost: 0,
          maxAttendees: 500,
          attendeesCount: 342,
          isActive: true,
        },
        {
          title: 'Charla con Elvis Ude',
          description: 'Hablamos del futuro del club nativo digital con fans y socios',
          type: 'charla',
          date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
          location: 'Sala Zoom Exclusive',
          city: 'Online',
          creditsCost: 50,
          maxAttendees: 100,
          attendeesCount: 15,
          isActive: true,
        }
      ]);
      console.log('✅ Seeded events');
    }

    // 3. Seed Votes — 4 typed votes (encuesta, pregunta, votacion, apuesta)
    const typedVoteExists = await this.votesRepo
      .createQueryBuilder('v')
      .where('v.votationType IS NOT NULL')
      .getCount();
    if (typedVoteExists === 0) {
      await this.votesRepo.save([
        {
          title: 'Encuesta semanal: ¿Qué marca de zapatillas prefieres para el TOUR?',
          description: 'Cada lunes una pregunta nueva — vota gratis y llévate 2 créditos',
          category: 'contenido',
          votationType: 'encuesta',
          options: ['Nike', 'Jordan', 'Adidas', 'Puma'],
          results: { Nike: 120, Jordan: 95, Adidas: 67, Puma: 24 },
          creditsCost: 0,
          xpReward: 0,
          isActive: true,
        },
        {
          title: 'Pregunta del día: ¿MVP de la NBA esta temporada?',
          description: 'Vota rápido, gana 4 créditos',
          category: 'pregunta',
          votationType: 'pregunta',
          options: ['SGA', 'Luka', 'Jokic', 'Giannis'],
          results: { SGA: 88, Luka: 72, Jokic: 91, Giannis: 31 },
          creditsCost: 0,
          xpReward: 0,
          isActive: true,
        },
        {
          title: 'Votación del club: Diseño de camiseta oficial',
          description: 'Decide el diseño que llevará el equipo en el MVP\'S TOUR',
          category: 'diseno',
          votationType: 'votacion',
          options: ['Camiseta clásica', 'Edición retro', 'Cyberpunk neon'],
          results: { 'Camiseta clásica': 45, 'Edición retro': 120, 'Cyberpunk neon': 85 },
          creditsCost: 5,
          xpReward: 5,
          isActive: true,
        },
        {
          title: 'Apuesta grupal: ¿Quién gana el TOUR de Vilanova?',
          description: 'Si más del 60% acierta, el club paga el doble a los ganadores',
          category: 'decision',
          votationType: 'apuesta',
          options: ['Equipo Azul', 'Equipo Rojo', 'Equipo Negro'],
          results: { 'Equipo Azul': 32, 'Equipo Rojo': 47, 'Equipo Negro': 28 },
          creditsCost: 20,
          xpReward: 10,
          isActive: true,
        },
      ]);
      console.log('✅ Seeded 4 typed votes');
    }

    // 4. Seed badge catalog (14 definitions)
    await this.badges.seedDefinitions();
    console.log('✅ Seeded badge catalog');

    // 5. Seed missions (4 active)
    await this.missions.seedDefinitions();
    console.log('✅ Seeded mission catalog');
  }
}
