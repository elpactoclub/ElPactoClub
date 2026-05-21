import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GamificationService } from './gamification.service';

class CastVoteDto {
  @ApiProperty()
  @IsString()
  selectedOption: string;
}

class SettleBetDto {
  @ApiProperty()
  @IsString()
  correctOption: string;
}

@ApiTags('Gamification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  // Votes
  @Get('votes')
  @ApiOperation({ summary: 'Get active vote decisions' })
  getVotes() {
    return this.gamificationService.getActiveVotes();
  }

  @Post('votes/:id/cast')
  @ApiOperation({ summary: 'Cast a vote (costs credits)' })
  castVote(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: CastVoteDto,
  ) {
    return this.gamificationService.castVote(req.user.id, id, dto.selectedOption);
  }

  @Get('votes/my')
  @ApiOperation({ summary: 'Get my vote history' })
  myVotes(@Request() req: { user: { id: string } }) {
    return this.gamificationService.getUserVotes(req.user.id);
  }

  @Post('votes/:id/settle')
  @ApiOperation({ summary: 'Settle a group bet (admin) — pays out winners; doubles if ≥60% correct' })
  settle(@Param('id') id: string, @Body() dto: SettleBetDto) {
    return this.gamificationService.settleBet(id, dto.correctOption);
  }

  // Raffles
  @Get('raffles')
  @ApiOperation({ summary: 'Get active raffles' })
  getRaffles() {
    return this.gamificationService.getActiveRaffles();
  }

  @Post('raffles/:id/enter')
  @ApiOperation({ summary: 'Enter a raffle (costs credits)' })
  enterRaffle(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.gamificationService.enterRaffle(req.user.id, id);
  }

  // Roulette
  @Post('roulette/spin')
  @ApiOperation({ summary: 'Spin the daily roulette' })
  spinRoulette(@Request() req: { user: { id: string } }) {
    return this.gamificationService.spinRoulette(req.user.id);
  }
}
