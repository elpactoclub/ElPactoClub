// EN: REST controller exposing gamification endpoints: votes, bet settlement, raffles and the daily roulette.
// ES: Controlador REST que expone los endpoints de gamificación: votaciones, liquidación de apuestas, sorteos y la ruleta diaria.
import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GamificationService } from './gamification.service';

// EN: Request body for casting a vote: the option the user selected.
// ES: Cuerpo de la petición para emitir un voto: la opción seleccionada por el usuario.
class CastVoteDto {
  @ApiProperty()
  @IsString()
  selectedOption: string;
}

// EN: Request body for settling a bet: the winning/correct option.
// ES: Cuerpo de la petición para liquidar una apuesta: la opción ganadora/correcta.
class SettleBetDto {
  @ApiProperty()
  @IsString()
  correctOption: string;
}

// EN: Groups all gamification endpoints under /gamification, requiring a valid JWT.
// ES: Agrupa todos los endpoints de gamificación bajo /gamification, exigiendo un JWT válido.
@ApiTags('Gamification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  // Votes
  // EN: Returns the active vote decisions for the current user.
  // ES: Devuelve las decisiones de votación activas para el usuario actual.
  @Get('votes')
  @ApiOperation({ summary: 'Get active vote decisions' })
  getVotes(@Request() req: { user: { id: string } }) {
    return this.gamificationService.getActiveVotes(req.user.id);
  }

  // EN: Casts the current user's vote on a given vote (may cost credits).
  // ES: Emite el voto del usuario actual en una votación dada (puede costar créditos).
  @Post('votes/:id/cast')
  @ApiOperation({ summary: 'Cast a vote (costs credits)' })
  castVote(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: CastVoteDto,
  ) {
    return this.gamificationService.castVote(req.user.id, id, dto.selectedOption);
  }

  // EN: Returns the current user's vote history.
  // ES: Devuelve el historial de votos del usuario actual.
  @Get('votes/my')
  @ApiOperation({ summary: 'Get my vote history' })
  myVotes(@Request() req: { user: { id: string } }) {
    return this.gamificationService.getUserVotes(req.user.id);
  }

  // EN: Settles a group bet and pays out winners (admin only; doubles payout if >=60% correct).
  // ES: Liquida una apuesta grupal y paga a los ganadores (solo admin; dobla el pago si >=60% acertó).
  @Post('votes/:id/settle')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Settle a group bet (admin only) — pays out winners; doubles if ≥60% correct' })
  settle(@Param('id') id: string, @Body() dto: SettleBetDto) {
    return this.gamificationService.settleBet(id, dto.correctOption);
  }

  // Raffles
  // EN: Returns the active raffles for the current user.
  // ES: Devuelve los sorteos activos para el usuario actual.
  @Get('raffles')
  @ApiOperation({ summary: 'Get active raffles' })
  getRaffles(@Request() req: { user: { id: string } }) {
    return this.gamificationService.getActiveRaffles(req.user.id);
  }

  // EN: Enters the current user into a raffle (costs credits).
  // ES: Inscribe al usuario actual en un sorteo (cuesta créditos).
  @Post('raffles/:id/enter')
  @ApiOperation({ summary: 'Enter a raffle (costs credits)' })
  enterRaffle(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.gamificationService.enterRaffle(req.user.id, id);
  }

  // Roulette
  // EN: Spins the daily roulette for the current user (rate-limited to 5 per minute).
  // ES: Gira la ruleta diaria para el usuario actual (limitado a 5 por minuto).
  @Post('roulette/spin')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Spin the daily roulette' })
  spinRoulette(@Request() req: { user: { id: string } }) {
    return this.gamificationService.spinRoulette(req.user.id);
  }
}
