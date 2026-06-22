import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ClubCreator } from './club-creator.entity';
import { User } from '../users/user.entity';

@Injectable()
export class ClubCreatorsService {
  constructor(
    @InjectRepository(ClubCreator) private readonly repo: Repository<ClubCreator>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
  ) {}

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
