// EN: Donations service: records credit donations, grants XP/badges and advances missions.
// ES: Servicio de donaciones: registra donaciones de créditos, otorga XP/insignias y avanza misiones.
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Donation, ProjectId } from './donation.entity';
import { UsersService } from '../users/users.service';
import { BadgesService } from '../badges/badges.service';
import { MissionsService } from '../missions/missions.service';

// EN: Injectable donations service with the donation repository and gamification services.
// ES: Servicio de donaciones inyectable con el repositorio de donaciones y servicios de gamificación.
@Injectable()
export class DonationsService {
  constructor(
    @InjectRepository(Donation) private readonly repo: Repository<Donation>,
    private readonly users: UsersService,
    private readonly badges: BadgesService,
    private readonly missions: MissionsService,
  ) {}

  // EN: Records a donation: spends credits, awards XP/badges, advances missions, grants global-impact badge.
  // ES: Registra una donación: gasta créditos, otorga XP/insignias, avanza misiones y concede la insignia de impacto global.
  async create(userId: string, projectId: ProjectId, amount: number) {
    if (amount <= 0) throw new Error('Amount must be positive');

    await this.users.spendCredits(userId, amount);
    await this.users.addXP(userId, amount);

    const donation = await this.repo.save({ userId, projectId, amount });

    if (projectId === 'india') {
      await this.badges.award(userId, 'dribble_spirit');
      await this.missions.increment('india_5000', amount);
    } else if (projectId === 'tecnificar') {
      await this.badges.award(userId, 'mentor');
      await this.missions.increment('tecnificar_100', 1);
    }

    const both = await this.repo
      .createQueryBuilder('d')
      .select('DISTINCT d.projectId')
      .where('d.userId = :userId', { userId })
      .getRawMany();
    if (both.length >= 2) {
      await this.badges.award(userId, 'impacto_global');
    }

    return donation;
  }

  // EN: Returns donation totals and distinct supporter counts grouped by project.
  // ES: Devuelve los totales de donaciones y el número de donantes distintos agrupados por proyecto.
  totalsByProject() {
    return this.repo
      .createQueryBuilder('d')
      .select('d.projectId', 'projectId')
      .addSelect('SUM(d.amount)', 'total')
      .addSelect('COUNT(DISTINCT d.userId)', 'supporters')
      .groupBy('d.projectId')
      .getRawMany();
  }

  // EN: Lists a user's donations, newest first.
  // ES: Lista las donaciones de un usuario, las más recientes primero.
  myDonations(userId: string) {
    return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }
}