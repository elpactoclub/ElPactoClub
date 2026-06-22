import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mission } from './mission.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { Cron, CronExpression } from '@nestjs/schedule';

export const MISSION_DEFINITIONS: Array<Omit<Mission, 'current' | 'isComplete' | 'updatedAt'>> = [
  {
    code: 'weekly_votes_500',
    title: '500 votos esta semana',
    description: 'Si llegamos a 500 votos entre todos, el club lanza contenido exclusivo del MVP\'S TOUR',
    target: 500,
    reward: 'Contenido exclusivo MVP\'S TOUR',
    isActive: true,
  },
  {
    code: 'daily_300',
    title: '300 fans completan la recompensa diaria',
    description: 'Si lo logramos, 2x XP el fin de semana para toda la comunidad',
    target: 300,
    reward: '2x XP el fin de semana',
    isActive: true,
  },
  {
    code: 'tecnificar_100',
    title: '100 fans apoyan Tecnificar',
    description: 'El club anuncia al primer becado antes que nadie más',
    target: 100,
    reward: 'Anuncio del primer becado',
    isActive: true,
  },
  {
    code: 'india_5000',
    title: '5.000 créditos para India',
    description: 'Elvis publica un vídeo desde Dribble Academy',
    target: 5000,
    reward: 'Vídeo de Elvis desde Dribble Academy',
    isActive: true,
  },
];

@Injectable()
export class MissionsService {
  constructor(
    @InjectRepository(Mission) private readonly repo: Repository<Mission>,
    private readonly notifications: NotificationsService,
  ) {}

  listActive() {
    return this.repo.find({ where: { isActive: true }, order: { code: 'ASC' } });
  }

  async increment(code: string, by = 1): Promise<Mission | null> {
    const mission = await this.repo.findOne({ where: { code } });
    if (!mission || !mission.isActive) return null;

    const newCurrent = Math.min(mission.current + by, mission.target);
    const justCompleted = !mission.isComplete && newCurrent >= mission.target;

    await this.repo.update(code, {
      current: newCurrent,
      isComplete: newCurrent >= mission.target,
    });

    if (justCompleted) {
      await this.notifications.notifyAll(
        'mission_complete',
        `🎯 Misión completada: ${mission.title}`,
        `Recompensa: ${mission.reward}`,
        { missionCode: code },
      );
    }

    return this.repo.findOne({ where: { code } });
  }

  // Reset weekly missions every Monday at 00:00 UTC
  @Cron(CronExpression.EVERY_WEEK)
  async resetWeeklyMissions(): Promise<void> {
    const weeklyCodes = ['weekly_votes_500', 'daily_300'];
    for (const code of weeklyCodes) {
      await this.repo.update(code, { current: 0, isComplete: false });
    }
    await this.notifications.notifyAll(
      'mission_complete',
      '🗓 ¡Nueva semana, nuevas misiones!',
      'Los objetivos semanales se han reiniciado. ¡A por ellos!',
      { reset: true },
    );
  }

  async seedDefinitions() {
    for (const def of MISSION_DEFINITIONS) {
      const existing = await this.repo.findOne({ where: { code: def.code } });
      if (!existing) {
        await this.repo.save(def);
      }
    }
  }
}