import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Event } from './events/event.entity';
import { Raffle } from './gamification/raffle.entity';
import { Vote } from './gamification/vote.entity';
import { Post, Message } from './community/post.entity';
import { User } from './users/user.entity';
import { StoreBenefit } from './store/store-benefit.entity';
import { Project } from './projects/project.entity';
import { ClubCreator } from './club-creators/club-creator.entity';
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
    @InjectRepository(StoreBenefit) private readonly benefitsRepo: Repository<StoreBenefit>,
    @InjectRepository(Project) private readonly projectsRepo: Repository<Project>,
    @InjectRepository(ClubCreator) private readonly clubCreatorsRepo: Repository<ClubCreator>,
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
    await this.seedStoreBenefits();
    await this.seedProjects();
    await this.seedClubCreators();
    await this.backfillSocioNumbers();

    console.log('✅ Seed complete');
  }

  // ── Asigna Nº de socio a socios que no lo tengan, por antigüedad ────────────
  private async backfillSocioNumbers() {
    const missing = await this.usersRepo
      .createQueryBuilder('u')
      .where('u.isSocio = :v', { v: true })
      .andWhere('u.socioNumber IS NULL')
      .orderBy('u.socioSince', 'ASC', 'NULLS FIRST')
      .addOrderBy('u.createdAt', 'ASC')
      .getMany();
    if (missing.length === 0) return;

    const maxResult = await this.usersRepo
      .createQueryBuilder('u')
      .select('MAX(u.socioNumber)', 'max')
      .where('u.isSocio = :v', { v: true })
      .getRawOne<{ max: number | null }>();
    let next = (maxResult?.max ?? 0) + 1;

    for (const u of missing) {
      await this.usersRepo.update(u.id, { socioNumber: next });
      next++;
    }
    console.log(`🎫 Asignados ${missing.length} Nº de socio`);

    // Rellenar fecha de socio (DESDE) para socios sin ella → usar su fecha de registro
    const noSince = await this.usersRepo
      .createQueryBuilder('u')
      .where('u.isSocio = :v', { v: true })
      .andWhere('u.socioSince IS NULL')
      .getMany();
    for (const u of noSince) {
      await this.usersRepo.update(u.id, { socioSince: u.createdAt ?? new Date() });
    }
    if (noSince.length) console.log(`📅 Fecha de socio asignada a ${noSince.length} socios`);
  }

  // ── Club creators showcase ─────────────────────────────────────────────────
  private async seedClubCreators() {
    if (await this.clubCreatorsRepo.count() > 0) return;
    const showcase = [
      { email: 'elvis@elpacto.com',   name: 'Elvis Ude',      photoUrl: '/imagenes/elvis.jpg' },
      { email: 'herson@elpacto.com',  name: 'Herson',         photoUrl: '/imagenes/herson.jpg' },
      { email: 'violeta@elpacto.com', name: 'Violeta Verano', photoUrl: '/imagenes/violeta.jpg' },
    ];
    let order = 0;
    for (const s of showcase) {
      const user = await this.usersRepo.findOne({ where: { email: s.email } });
      if (!user) continue;
      await this.clubCreatorsRepo.save({
        userId: user.id,
        name: s.name,
        photoUrl: s.photoUrl,
        displayOrder: order++,
        isActive: true,
      });
    }
    console.log('  ✔ Club creators');
  }

  // ── Impact projects ──────────────────────────────────────────────────────
  private async seedProjects() {
    if (await this.projectsRepo.count() > 0) return;
    await this.projectsRepo.save([
      {
        slug: 'india',
        emoji: '🇮🇳',
        title: 'India · Dribble Academy',
        subtitle: 'Llevamos el baloncesto a India',
        summary: 'Colaboramos con la Fundación Dribble Academy para llevar el baloncesto a India — equipo conjunto, formación local y colaboradores estratégicos.',
        description: 'Colaboramos con la Fundación Dribble Academy para llevar el baloncesto a India. Equipo conjunto Dribble Academy El Pacto, formación de community manager local, material deportivo y colaboradores estratégicos. Cada crédito donado va directo a infraestructura básica: canchas, balones y becas de entrenamiento.',
        color: '#F59E0B',
        badgeLabel: 'Dribble Spirit 🇮🇳',
        displayOrder: 0,
        isActive: true,
      },
      {
        slug: 'tecnificar',
        emoji: '🎓',
        title: 'Tecnificar',
        subtitle: 'Becas para jóvenes con talento',
        summary: 'Becas de tecnificación para jóvenes jugadores con talento que no tienen recursos para acceder a formación de élite.',
        description: 'Becas de tecnificación para jóvenes jugadores con talento que no tienen recursos para acceder a formación de élite. Material deportivo, seguimiento, mentoría y colaboradores estratégicos. El club anuncia al primer becado en exclusiva si llegamos a la misión colectiva.',
        color: '#A78BFA',
        badgeLabel: 'Mentor 🎓',
        displayOrder: 1,
        isActive: true,
      },
    ]);
    console.log('  ✔ Projects');
  }

  // ── Store benefits ───────────────────────────────────────────────────────
  private async seedStoreBenefits() {
    if (await this.benefitsRepo.count() > 0) return;
    await this.benefitsRepo.save([
      {
        name: 'Basketball Emotion',
        description: 'La mayor tienda de basket de España',
        discount: '5%',
        emoji: '🏀',
        color: '#FF6B1A',
        link: 'https://www.basketballemotion.com',
        displayOrder: 0,
        isActive: true,
      },
      {
        name: 'Hoops',
        description: 'Material deportivo oficial del club',
        discount: '10%',
        emoji: '⚡',
        color: '#F0E040',
        link: '',
        displayOrder: 1,
        isActive: true,
      },
    ]);
    console.log('  ✔ Store benefits');
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
