// EN: Business logic for gamification: casting/settling votes and bets, raffle entries and the daily roulette, with credit/XP/badge/mission side effects.
// ES: Lógica de negocio de gamificación: emitir/liquidar votaciones y apuestas, participar en sorteos y la ruleta diaria, con efectos en créditos/XP/insignias/misiones.
import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { Vote, UserVote, VotationType } from './vote.entity';
import { Raffle, RaffleEntry } from './raffle.entity';
import { UsersService } from '../users/users.service';
import { BadgesService } from '../badges/badges.service';
import { MissionsService } from '../missions/missions.service';
import { NotificationsService } from '../notifications/notifications.service';

// Cashback otorgado al votar por tipo (encuesta, pregunta del día)
const TYPE_CASHBACK: Record<VotationType, number> = {
  encuesta: 2,
  pregunta: 4,
  votacion: 0,
  apuesta: 0,
};

// EN: Service exposing all gamification operations backed by the votes, raffles and entries repositories.
// ES: Servicio que expone todas las operaciones de gamificación apoyándose en los repositorios de votaciones, sorteos y participaciones.
@Injectable()
export class GamificationService {
  constructor(
    @InjectRepository(Vote) private readonly votesRepo: Repository<Vote>,
    @InjectRepository(UserVote) private readonly userVotesRepo: Repository<UserVote>,
    @InjectRepository(Raffle) private readonly rafflesRepo: Repository<Raffle>,
    @InjectRepository(RaffleEntry) private readonly entriesRepo: Repository<RaffleEntry>,
    private readonly usersService: UsersService,
    private readonly badges: BadgesService,
    private readonly missions: MissionsService,
    private readonly notifications: NotificationsService,
  ) {}

  // ─── VOTES ──────────────────────────────────────────────────────────────
  // EN: Returns all active votes, annotating each with the user's previously selected option if any.
  // ES: Devuelve todas las votaciones activas, anotando cada una con la opción que el usuario ya eligió, si la hay.
  async getActiveVotes(userId?: string): Promise<(Vote & { myVote: string | null })[]> {
    const votes = await this.votesRepo.find({ where: { isActive: true }, order: { createdAt: 'DESC' } });
    if (!userId) return votes.map((v) => ({ ...v, myVote: null }));
    const userVotes = await this.userVotesRepo.find({ where: { userId } });
    const myVoteMap = new Map(userVotes.map((uv) => [uv.voteId, uv.selectedOption]));
    return votes.map((v) => ({ ...v, myVote: myVoteMap.get(v.id) ?? null }));
  }

  // EN: Casts a user's vote, charging credits/awarding XP and cashback, updating tallies, badges and missions.
  // ES: Emite el voto de un usuario, cobrando créditos/otorgando XP y cashback, actualizando recuentos, insignias y misiones.
  async castVote(userId: string, voteId: string, selectedOption: string): Promise<Vote> {
    const vote = await this.votesRepo.findOne({ where: { id: voteId } });
    if (!vote) throw new NotFoundException('Vote not found');
    if (!vote.isActive) throw new ConflictException('Vote is closed');
    if (!vote.options.includes(selectedOption)) throw new ConflictException('Invalid option');

    const existing = await this.userVotesRepo.findOne({ where: { userId, voteId } });
    if (existing) throw new ConflictException('Already voted');

    const isFree = vote.votationType === 'encuesta' || vote.votationType === 'pregunta';
    if (!isFree && vote.creditsCost > 0) {
      await this.usersService.spendCredits(userId, vote.creditsCost);
    }
    if (vote.xpReward > 0) {
      await this.usersService.addXP(userId, vote.xpReward);
    }

    const cashback = vote.votationType ? TYPE_CASHBACK[vote.votationType] : 0;
    if (cashback > 0) {
      await this.usersService.addCredits(userId, cashback);
    }

    await this.userVotesRepo.save({ userId, voteId, selectedOption });

    const updatedResults = { ...vote.results };
    updatedResults[selectedOption] = (updatedResults[selectedOption] ?? 0) + 1;
    await this.votesRepo.update(voteId, { results: updatedResults });

    // Badge: primer_pacto on first vote
    const userVoteCount = await this.userVotesRepo.count({ where: { userId } });
    if (userVoteCount === 1) {
      await this.badges.award(userId, 'primer_pacto');
    }

    // Mission: increment weekly votes counter
    await this.missions.increment('weekly_votes_500', 1);

    // Weekly activity bit 1 = voted
    await this.usersService.updateWeekActivity(userId, 1);

    return this.votesRepo.findOne({ where: { id: voteId } }) as Promise<Vote>;
  }

  // EN: Returns all votes a given user has cast.
  // ES: Devuelve todos los votos que un usuario ha emitido.
  getUserVotes(userId: string): Promise<UserVote[]> {
    return this.userVotesRepo.find({ where: { userId } });
  }

  // EN: Settles an 'apuesta' bet, paying winners (doubled if >=60% picked correctly) and closing the vote.
  // ES: Liquida una apuesta, pagando a los ganadores (doblado si >=60% acertó) y cerrando la votación.
  async settleBet(voteId: string, correctOption: string): Promise<Vote> {
    const vote = await this.votesRepo.findOne({ where: { id: voteId } });
    if (!vote) throw new NotFoundException('Vote not found');
    if (vote.settledAt) throw new ConflictException('Already settled');
    if (vote.votationType !== 'apuesta') throw new ConflictException('Only apuesta-type votes can be settled');
    if (!vote.options.includes(correctOption)) throw new ConflictException('Invalid option');

    const totalVotes = Object.values(vote.results).reduce((a, b) => a + (b || 0), 0);
    const correctVotes = vote.results[correctOption] ?? 0;
    const pctCorrect = totalVotes > 0 ? correctVotes / totalVotes : 0;
    const doubled = pctCorrect >= 0.6;

    const winners = await this.userVotesRepo.find({ where: { voteId, selectedOption: correctOption } });
    const payout = doubled ? vote.creditsCost * 2 : vote.creditsCost;

    for (const w of winners) {
      await this.usersService.addCredits(w.userId, payout);
      await this.notifications.notify(
        w.userId,
        'bet_result',
        doubled ? '🎉 ¡Bote doblado!' : '✅ Acertaste la apuesta',
        `Recibes ${payout} ⚡ por acertar "${correctOption}"`,
        { voteId, payout, doubled },
      );
    }

    await this.votesRepo.update(voteId, {
      correctOption,
      settledAt: new Date(),
      doubledPayout: doubled,
      isActive: false,
    });

    return this.votesRepo.findOne({ where: { id: voteId } }) as Promise<Vote>;
  }

  // ─── RAFFLES ────────────────────────────────────────────────────────────
  // EN: Returns active raffles (or the latest finalized one), annotated with entry state and winner names.
  // ES: Devuelve los sorteos activos (o el último finalizado), anotados con el estado de participación y los nombres de ganadores.
  async getActiveRaffles(userId?: string) {
    // Active raffles take priority; if there are none, keep showing the most
    // recent finalized one (with its winner) until the admin activates another.
    let raffles = await this.rafflesRepo.find({ where: { isActive: true }, order: { createdAt: 'DESC' } });
    if (raffles.length === 0) {
      raffles = await this.rafflesRepo.find({ where: { winnerId: Not(IsNull()) }, order: { drawDate: 'DESC' }, take: 1 });
    }

    // Resolve winner names for finalized raffles
    const winnerIds = [...new Set(raffles.map((r) => r.winnerId).filter(Boolean) as string[])];
    const winnerName = new Map<string, string>();
    await Promise.all(winnerIds.map(async (id) => {
      try { const u = await this.usersService.findById(id); winnerName.set(id, u.name); } catch { /* ignore */ }
    }));

    const enteredIds = userId
      ? new Set((await this.entriesRepo.find({ where: { userId } })).map((e) => e.raffleId))
      : new Set<string>();

    return raffles.map((r) => ({
      ...r,
      hasEntered: enteredIds.has(r.id),
      isFinished: !!r.winnerId,
      winnerName: r.winnerId ? (winnerName.get(r.winnerId) ?? null) : null,
    }));
  }

  // EN: Enters a user into a raffle after audience checks, charging credits/XP and awarding the first-entry badge.
  // ES: Inscribe a un usuario en un sorteo tras comprobar la audiencia, cobrando créditos/XP y otorgando la insignia de primera participación.
  async enterRaffle(userId: string, raffleId: string): Promise<RaffleEntry> {
    const raffle = await this.rafflesRepo.findOne({ where: { id: raffleId } });
    if (!raffle) throw new NotFoundException('Raffle not found');
    if (!raffle.isActive) throw new ConflictException('Raffle is closed');

    // Audience eligibility
    const audience = raffle.audience ?? 'all';
    if (audience !== 'all') {
      const user = await this.usersService.findById(userId);
      if (audience === 'socios' && !user.isSocio) {
        throw new ForbiddenException('Este sorteo es solo para socios');
      }
      if (audience === 'fans' && (user.role === 'creator' || user.role === 'admin')) {
        throw new ForbiddenException('Este sorteo es solo para fans');
      }
    }

    const existing = await this.entriesRepo.findOne({ where: { userId, raffleId } });
    if (existing) throw new ConflictException('Ya participas en este sorteo');

    await this.usersService.spendCredits(userId, raffle.ticketCost);
    await this.usersService.addXP(userId, raffle.xpReward);
    await this.rafflesRepo.update(raffleId, {
      participantCount: raffle.participantCount + 1,
    });

    const entry = await this.entriesRepo.save({ userId, raffleId, tickets: 1 });

    // Badge: en_el_bombo on first raffle entry
    const userEntryCount = await this.entriesRepo.count({ where: { userId } });
    if (userEntryCount === 1) {
      await this.badges.award(userId, 'en_el_bombo');
    }

    return entry;
  }

  // ─── DAILY ROULETTE ─────────────────────────────────────────────────────
  // EN: Spins the once-per-day roulette, granting a random credit/XP/multiplier prize and marking the daily reward as claimed.
  // ES: Gira la ruleta diaria (una vez al día), otorgando un premio aleatorio de créditos/XP/multiplicador y marcando la recompensa diaria como reclamada.
  async spinRoulette(userId: string): Promise<{ prize: string; credits: number; xp: number }> {
    const user = await this.usersService.findById(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (user.dailyRewardClaimedAt) {
      const claimedDay = new Date(user.dailyRewardClaimedAt);
      claimedDay.setHours(0, 0, 0, 0);
      if (claimedDay.getTime() === today.getTime()) {
        throw new ConflictException('Roulette already spun today');
      }
    }

    const prizes = [
      { label: '+5 ⚡', credits: 5, xp: 5 },
      { label: '+10 ⚡', credits: 10, xp: 8 },
      { label: '+20 ⚡', credits: 20, xp: 12 },
      { label: '+50 ⚡', credits: 50, xp: 20 },
      { label: '2x XP', credits: 0, xp: 40 },
      { label: '1 Ticket', credits: 0, xp: 15 },
      { label: '🎁 Sorpresa', credits: 15, xp: 10 },
      { label: 'Voto gratis', credits: 5, xp: 0 },
    ];

    const prize = prizes[Math.floor(Math.random() * prizes.length)];
    if (prize.credits > 0) await this.usersService.addCredits(userId, prize.credits);

    if (prize.label === '2x XP') {
      // Real 24h multiplier instead of flat XP
      await this.usersService.setXPMultiplier(userId, 2, 24);
    } else if (prize.xp > 0) {
      await this.usersService.addXP(userId, prize.xp);
    }

    // Mission: daily_300 counter increments per roulette spin
    await this.missions.increment('daily_300', 1);

    // Mark daily reward claimed (fixes re-spin bug)
    await this.usersService.markDailyClaimed(userId);

    // Weekly activity bit 2 = spun roulette
    await this.usersService.updateWeekActivity(userId, 2);

    return { prize: prize.label, credits: prize.credits, xp: prize.label === '2x XP' ? 0 : prize.xp };
  }
}