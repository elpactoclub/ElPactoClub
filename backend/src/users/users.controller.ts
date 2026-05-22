import { Controller, Get, Patch, Body, UseGuards, Request, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ─── PUBLIC ─────────────────────────────────────────────────────────────
  @Get('online-count')
  @ApiOperation({ summary: 'Number of fans connected in the last 5 minutes' })
  onlineCount() {
    return this.usersService.getOnlineCount();
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Global XP leaderboard' })
  getLeaderboard() {
    return this.usersService.getLeaderboard(50);
  }

  // ─── AUTH REQUIRED ──────────────────────────────────────────────────────
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  getMe(@Request() req: { user: { id: string } }) {
    return this.usersService.findById(req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @ApiOperation({ summary: 'Update profile' })
  updateMe(@Request() req: { user: { id: string } }, @Body() dto: UpdateUserDto) {
    return this.usersService.update(req.user.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('me/ping')
  @ApiOperation({ summary: 'Heartbeat — mark user as online' })
  ping(@Request() req: { user: { id: string } }) {
    return this.usersService.updateOnlineStatus(req.user.id, true).then(() => ({ ok: true }));
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('me/become-socio')
  @ApiOperation({ summary: 'Activate Socio plan (mock payment) — adds 200 credits' })
  becomeSocio(@Request() req: { user: { id: string } }) {
    return this.usersService.becomeSocio(req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me/rank')
  @ApiOperation({ summary: 'Get user global rank' })
  getMyRank(@Request() req: { user: { id: string } }) {
    return this.usersService.getRank(req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me/daily-reward')
  @ApiOperation({ summary: 'Claim daily reward' })
  claimDaily(@Request() req: { user: { id: string } }) {
    return this.usersService.claimDailyReward(req.user.id);
  }

  // ─── DEV/ADMIN ──────────────────────────────────────────────────────────
  @Post('set-admin')
  @ApiOperation({ summary: '[DEV] Set user as admin by email' })
  async setAdmin(@Body() { email, role }: { email: string; role: 'admin' | 'creator' | 'fan' }) {
    return this.usersService.setUserRole(email, role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get public fan profile' })
  getUser(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}