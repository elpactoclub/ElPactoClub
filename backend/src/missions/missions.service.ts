// EN: Missions service: tracks progress, completes missions, resets weekly ones and seeds defaults.
// ES: Servicio de misiones: sigue el progreso, completa misiones, reinicia las semanales y siembra las predeterminadas.
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mission } from './mission.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { Cron, CronExpression } from '@nestjs/schedule';

// EN: Default mission definitions seeded into the database.
// ES: Definiciones de misiones predeterminadas sembradas en la base de datos.
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

// EN: Injectable missions service with the mission repository and notifications.
// ES: Servicio de misiones inyectable con el repositorio de misiones y notificaciones.
@Injectable()
export class MissionsService {
  constructor(
    @InjectRepository(Mission) private readonly repo: Repository<Mission>,
    private readonly notifications: NotificationsService,
  ) {}

  // EN: Lists active missions ordered by code.
  // ES: Lista las misiones activas ordenadas por código.
  listActive() {
    return this.repo.find({ where: { isActive: true }, order: { code: 'ASC' } });
  }

  // EN: Increments a mission's progress (capped at target) and notifies all on completion.
  // ES: Incrementa el progreso de una misión (limitado al objetivo) y notifica a todos al completarse.
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

  // EN: Cron job resetting weekly missions every Monday and notifying the community.
  // ES: Tarea cron que reinicia las misiones semanales cada lunes y avisa a la comunidad.
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

  // EN: Inserts any missing default missions into the database.
  // ES: Inserta en la base de datos las misiones predeterminadas que falten.
  async seedDefinitions() {
    for (const def of MISSION_DEFINITIONS) {
      const existing = await this.repo.findOne({ where: { code: def.code } });
      if (!existing) {
        await this.repo.save(def);
      }
    }
  }
}