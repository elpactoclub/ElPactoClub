// EN: Badges service: badge catalog, per-user badge listing, awarding and seeding defaults.
// ES: Servicio de insignias: catálogo, listado de insignias por usuario, concesión y siembra de predeterminadas.
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Badge, UserBadge } from './badge.entity';
import { NotificationsService } from '../notifications/notifications.service';

// EN: Default badge definitions seeded into the database.
// ES: Definiciones de insignias predeterminadas sembradas en la base de datos.
export const BADGE_DEFINITIONS: Array<Omit<Badge, never>> = [
  { code: 'primer_pacto', name: 'Primer Pacto', emoji: '🏀', description: 'Tu primer voto registrado', isSecret: false, sortOrder: 1 },
  { code: 'socializador', name: 'Socializador', emoji: '💬', description: '10 mensajes en el chat', isSecret: false, sortOrder: 2 },
  { code: 'llama_viva', name: 'Llama Viva', emoji: '🔥', description: '7 días consecutivos activo', isSecret: false, sortOrder: 3 },
  { code: 'diamante', name: 'Diamante del Pacto', emoji: '💎', description: '30 días consecutivos activo', isSecret: false, sortOrder: 4 },
  { code: 'fundador', name: 'Fundador', emoji: '👑', description: 'Socio desde el primer mes', isSecret: false, sortOrder: 5 },
  { code: 'embajador', name: 'Embajador', emoji: '🌍', description: 'Primero de tu ciudad en unirse', isSecret: false, sortOrder: 6 },
  { code: 'en_el_bombo', name: 'En el Bombo', emoji: '🎟', description: 'Primera participación en sorteo', isSecret: false, sortOrder: 7 },
  { code: 'fan_directo', name: 'Fan Directo', emoji: '✉', description: 'Primer mensaje a un creador', isSecret: false, sortOrder: 8 },
  { code: 'dribble_spirit', name: 'Dribble Spirit', emoji: '🇮🇳', description: 'Donación al proyecto India', isSecret: false, sortOrder: 9 },
  { code: 'mentor', name: 'Mentor', emoji: '🎓', description: 'Donación al proyecto Tecnificar', isSecret: false, sortOrder: 10 },
  { code: 'impacto_global', name: 'Impacto Global', emoji: '🌐', description: 'Donaste a ambos proyectos sociales', isSecret: false, sortOrder: 11 },
  { code: 'reclutador', name: 'Reclutador', emoji: '🤝', description: 'Invita a 3 amigos que se hacen socios', isSecret: false, sortOrder: 12 },
  { code: 'semana_perfecta', name: 'Semana Perfecta', emoji: '⭐', description: 'Completa todas las misiones de una semana', isSecret: false, sortOrder: 13 },
  { code: 'og_dia_1', name: 'OG · Desde el Día 1', emoji: '🥇', description: 'Primer fan en entrar al club', isSecret: true, sortOrder: 14 },
  { code: 'temporada_verano_2026', name: 'Badge de Verano 2026', emoji: '⭐', description: 'Consiguiste 1.000 XP durante la Temporada Verano 2026', isSecret: false, sortOrder: 15 },
];

// EN: Injectable badges service with badge/user-badge repositories and notifications.
// ES: Servicio de insignias inyectable con repositorios de insignia/insignia-usuario y notificaciones.
@Injectable()
export class BadgesService {
  constructor(
    @InjectRepository(Badge) private readonly badgeRepo: Repository<Badge>,
    @InjectRepository(UserBadge) private readonly userBadgeRepo: Repository<UserBadge>,
    private readonly notifications: NotificationsService,
  ) {}

  // EN: Returns the full badge catalog ordered by sort order.
  // ES: Devuelve el catálogo completo de insignias ordenado por orden de clasificación.
  catalog() {
    return this.badgeRepo.find({ order: { sortOrder: 'ASC' } });
  }

  // EN: Lists the badges unlocked by a user.
  // ES: Lista las insignias desbloqueadas por un usuario.
  listForUser(userId: string) {
    return this.userBadgeRepo.find({ where: { userId } });
  }

  // EN: Returns whether a user already has a given badge.
  // ES: Indica si un usuario ya tiene una insignia dada.
  async hasBadge(userId: string, badgeCode: string): Promise<boolean> {
    const existing = await this.userBadgeRepo.findOne({ where: { userId, badgeCode } });
    return !!existing;
  }

  // EN: Awards a badge to a user (if not already owned) and notifies them.
  // ES: Concede una insignia a un usuario (si aún no la tiene) y le notifica.
  async award(userId: string, badgeCode: string): Promise<boolean> {
    if (await this.hasBadge(userId, badgeCode)) return false;

    const badge = await this.badgeRepo.findOne({ where: { code: badgeCode } });
    if (!badge) return false;

    await this.userBadgeRepo.save({ userId, badgeCode });
    await this.notifications.notify(
      userId,
      'badge_unlock',
      `¡Insignia desbloqueada! ${badge.emoji}`,
      `Ganaste la insignia "${badge.name}"`,
      { badgeCode, badgeName: badge.name, emoji: badge.emoji },
    );
    return true;
  }

  // EN: Inserts any missing default badges into the database.
  // ES: Inserta en la base de datos las insignias predeterminadas que falten.
  async seedDefinitions() {
    for (const def of BADGE_DEFINITIONS) {
      const existing = await this.badgeRepo.findOne({ where: { code: def.code } });
      if (!existing) {
        await this.badgeRepo.save(def);
      }
    }
  }
}