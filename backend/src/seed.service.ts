import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Event } from './events/event.entity';
import { Raffle } from './gamification/raffle.entity';
import { Vote } from './gamification/vote.entity';
import { Post, Message } from './community/post.entity';
import { User } from './users/user.entity';
import { BadgesService } from './badges/badges.service';
import { MissionsService } from './missions/missions.service';

const CREATORS = [
  { name: 'Herson',        email: 'herson@elpacto.com',  avatar: '🏀', city: 'Barcelona' },
  { name: 'Violeta Verano',email: 'violeta@elpacto.com', avatar: '🌸', city: 'Madrid'    },
  { name: 'Elvis Ude',     email: 'elvis@elpacto.com',   avatar: '⚡', city: 'Barcelona' },
];

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Event)   private readonly eventsRepo:   Repository<Event>,
    @InjectRepository(Raffle)  private readonly rafflesRepo:  Repository<Raffle>,
    @InjectRepository(Vote)    private readonly votesRepo:    Repository<Vote>,
    @InjectRepository(Post)    private readonly postsRepo:    Repository<Post>,
    @InjectRepository(Message) private readonly messagesRepo: Repository<Message>,
    @InjectRepository(User)    private readonly usersRepo:    Repository<User>,
    private readonly badges:   BadgesService,
    private readonly missions: MissionsService,
  ) {}

  async onApplicationBootstrap() {
    console.log('🌱 Seeding database...');

    await this.badges.seedDefinitions();
    await this.missions.seedDefinitions();

    await this.seedRaffles();
    await this.seedEvents();
    await this.seedVotes();
    await this.seedCreators();

    console.log('✅ Seed complete');
  }

  // ── Raffles ────────────────────────────────────────────────────────────────
  private async seedRaffles() {
    if (await this.rafflesRepo.count() > 0) return;
    await this.rafflesRepo.save({
      title: 'PRODUCTO HOOPS',
      description: 'Camiseta oficial de la temporada de verano firmada por los fundadores',
      prizeValue: 200.00,
      ticketCost: 75,
      xpReward: 50,
      participantCount: 0,
      isActive: true,
      month: '2026-06',
    });
    console.log('  ✔ Raffles');
  }

  // ── Events ─────────────────────────────────────────────────────────────────
  private async seedEvents() {
    if (await this.eventsRepo.count() > 0) return;
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
        attendeesCount: 0,
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
        attendeesCount: 0,
        isActive: true,
      },
    ]);
    console.log('  ✔ Events');
  }

  // ── Votes ──────────────────────────────────────────────────────────────────
  private async seedVotes() {
    // Reset votes with fake results (legacy seed data)
    await this.votesRepo
      .createQueryBuilder()
      .delete()
      .where('results != :empty::jsonb', { empty: '{}' })
      .execute()
      .catch(() => {});

    const exists = await this.votesRepo
      .createQueryBuilder('v')
      .where('v.votationType IS NOT NULL')
      .getCount();
    if (exists > 0) return;

    await this.votesRepo.save([
      {
        title: 'Encuesta semanal: ¿Qué marca de zapatillas prefieres para el TOUR?',
        description: 'Cada lunes una pregunta nueva — vota gratis y llévate 2 créditos',
        category: 'contenido',
        votationType: 'encuesta',
        options: ['Nike', 'Jordan', 'Adidas', 'Puma'],
        results: {},
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
        results: {},
        creditsCost: 0,
        xpReward: 0,
        isActive: true,
      },
      {
        title: "Votación del club: Diseño de camiseta oficial",
        description: "Decide el diseño que llevará el equipo en el MVP'S TOUR",
        category: 'diseno',
        votationType: 'votacion',
        options: ['Camiseta clásica', 'Edición retro', 'Cyberpunk neon'],
        results: {},
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
        results: {},
        creditsCost: 20,
        xpReward: 10,
        isActive: true,
      },
    ]);
    console.log('  ✔ Votes');
  }

  // ── Creators + Posts + Messages ────────────────────────────────────────────
  private async seedCreators() {
    if (await this.postsRepo.count() > 0) return;

    const password = await bcrypt.hash('ElPacto2025!', 12);
    const creatorUsers: User[] = [];

    for (const c of CREATORS) {
      let user = await this.usersRepo.findOne({ where: { email: c.email } });
      if (!user) {
        user = await this.usersRepo.save(
          this.usersRepo.create({
            name: c.name,
            email: c.email,
            password,
            avatar: c.avatar,
            city: c.city,
            role: 'creator',
            referralCode: `PACTO-${c.name.slice(0, 3).toUpperCase()}00`,
            credits: 0,
            xp: 0,
            level: 'Rookie',
          }),
        );
      }
      creatorUsers.push(user);
    }

    const [herson, violeta, elvis] = creatorUsers;

    // Posts — no fake likes, no fake reactions
    const now = Date.now();
    await this.postsRepo.save([
      {
        authorId: herson.id,
        type: 'text' as const,
        content: "Entrenamiento terminado 💪 Preparando el MVP'S TOUR 3x3. ¿Quién va a estar ahí el 1 de julio? Os espero 🏀 #ElPacto",
        likesCount: 0,
        createdAt: new Date(now - 3_600_000),
      },
      {
        authorId: violeta.id,
        type: 'poll' as const,
        content: '¿Qué es más difícil de ejecutar en un partido? 🏀',
        pollOptions: ['El triple en momento clave', 'El mate con contacto'],
        pollVotes: { 'El triple en momento clave': 0, 'El mate con contacto': 0 },
        likesCount: 0,
        createdAt: new Date(now - 7_200_000),
      },
      {
        authorId: elvis.id,
        type: 'challenge' as const,
        content: '🏀 RETO SEMANAL: Graba tu mejor movimiento de 1vs1 y súbelo con #ElPactoReto — el mejor gana 200 créditos 🔥',
        likesCount: 0,
        createdAt: new Date(now - 18_000_000),
      },
    ]);

    // Messages in #general channel
    await this.messagesRepo.save([
      {
        userId: herson.id,
        channel: 'general',
        content: "Buenos días familia 🏀 Esta semana es clave para el MVP'S TOUR 3x3. Necesito que todos votéis el quinteto.",
        createdAt: new Date(now - 7_200_000),
      },
      {
        userId: violeta.id,
        channel: 'general',
        content: '¡Q&A esta tarde a las 18h! Mandadme vuestras preguntas aquí ✨',
        createdAt: new Date(now - 5_400_000),
      },
    ]);

    console.log('  ✔ Creators, posts & messages');
  }
}
