import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  getActiveVotes(): Promise<Vote[]> {
    return this.votesRepo.find({ where: { isActive: true }, order: { createdAt: 'DESC' } });
  }

  async castVote(userId: string, voteId: string, selectedOption: string): Promise<Vote> {
    const vote = await this.votesRepo.findOne({ where: { id: voteId } });
    if (!vote) throw new NotFoundException('Vote not found');
    if (!vote.isActive) throw new ConflictException('Vote is closed');
    if (!vote.options.includes(selectedOption)) throw new ConflictException('Invalid option');

    const existing = await this.userVotesRepo.findOne({ where: { userId, voteId } });
    if (existing) throw new ConflictException('Already voted');

    if (vote.creditsCost > 0) {
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

    return this.votesRepo.findOne({ where: { id: voteId } }) as Promise<Vote>;
  }

  getUserVotes(userId: string): Promise<UserVote[]> {
    return this.userVotesRepo.find({ where: { userId } });
  }

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
  getActiveRaffles(): Promise<Raffle[]> {
    return this.rafflesRepo.find({ where: { isActive: true } });
  }

  async enterRaffle(userId: string, raffleId: string): Promise<RaffleEntry> {
    const raffle = await this.rafflesRepo.findOne({ where: { id: raffleId } });
    if (!raffle) throw new NotFoundException('Raffle not found');
    if (!raffle.isActive) throw new ConflictException('Raffle is closed');

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
      { label: '¡Ánimo!', credits: 2, xp: 3 },
    ];

    const prize = prizes[Math.floor(Math.random() * prizes.length)];
    if (prize.credits > 0) await this.usersService.addCredits(userId, prize.credits);
    if (prize.xp > 0) await this.usersService.addXP(userId, prize.xp);

    // Mission: daily_300 counter increments per roulette spin
    await this.missions.increment('daily_300', 1);

    return { prize: prize.label, credits: prize.credits, xp: prize.xp };
  }
}