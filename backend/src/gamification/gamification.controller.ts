import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
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
  getVotes(@Request() req: { user: { id: string } }) {
    return this.gamificationService.getActiveVotes(req.user.id);
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
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Settle a group bet (admin only) — pays out winners; doubles if ≥60% correct' })
  settle(@Param('id') id: string, @Body() dto: SettleBetDto) {
    return this.gamificationService.settleBet(id, dto.correctOption);
  }

  // Raffles
  @Get('raffles')
  @ApiOperation({ summary: 'Get active raffles' })
  getRaffles(@Request() req: { user: { id: string } }) {
    return this.gamificationService.getActiveRaffles(req.user.id);
  }

  @Post('raffles/:id/enter')
  @ApiOperation({ summary: 'Enter a raffle (costs credits)' })
  enterRaffle(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.gamificationService.enterRaffle(req.user.id, id);
  }

  // Roulette
  @Post('roulette/spin')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Spin the daily roulette' })
  spinRoulette(@Request() req: { user: { id: string } }) {
    return this.gamificationService.spinRoulette(req.user.id);
  }
}
