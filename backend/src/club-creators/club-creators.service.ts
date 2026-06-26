// EN: Club creators service: read access to active club creator cards enriched with user data.
// ES: Servicio de creadores del club: acceso de lectura a las tarjetas activas enriquecidas con datos de usuario.
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ClubCreator } from './club-creator.entity';
import { User } from '../users/user.entity';

// EN: Injectable club creators service with the card and user repositories.
// ES: Servicio de creadores del club inyectable con los repositorios de tarjeta y usuario.
@Injectable()
export class ClubCreatorsService {
  constructor(
    @InjectRepository(ClubCreator) private readonly repo: Repository<ClubCreator>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
  ) {}

  // EN: Returns active club creator cards merged with the linked user's name and avatar.
  // ES: Devuelve las tarjetas activas de creadores del club fusionadas con el nombre y avatar del usuario vinculado.
  async getActive() {
    const cards = await this.repo.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
    });
    if (cards.length === 0) return [];
    const users = await this.usersRepo.findBy({ id: In(cards.map((c) => c.userId)) });
    const byId = new Map(users.map((u) => [u.id, u]));
    return cards.map((c) => {
      const u = byId.get(c.userId);
      return {
        id: c.id,
        userId: c.userId,
        name: u?.name ?? c.name ?? 'Creador',
        photoUrl: c.photoUrl ?? null,
        avatar: u?.avatar ?? '🏀',
        role: 'Creador',
      };
    });
  }
}
