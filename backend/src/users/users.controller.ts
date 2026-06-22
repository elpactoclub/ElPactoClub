import { Controller, Get, Patch, Body, UseGuards, Request, Param, Post, Delete, Query, HttpCode, ForbiddenException } from '@nestjs/common';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateCredentialsDto } from './dto/update-credentials.dto';

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

  @Get('count')
  @ApiOperation({ summary: 'Total number of registered fans' })
  fansCount() {
    return this.usersService.getFansCount();
  }

  @Get('by-country')
  @ApiOperation({ summary: 'Fan counts grouped by country' })
  fansByCountry() {
    return this.usersService.getFansByCountry();
  }

  @Post('visitor-ping')
  @HttpCode(200)
  @ApiOperation({ summary: 'Anonymous heartbeat — track visitor presence' })
  visitorPing(@Body() body: { sessionId: string }) {
    if (body?.sessionId) this.usersService.visitorPing(body.sessionId);
    return { ok: true };
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Global XP leaderboard' })
  getLeaderboard() {
    return this.usersService.getLeaderboard(50);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('search')
  @ApiOperation({ summary: 'Search users by name' })
  searchUsers(@Query('q') q: string, @Request() req: any) {
    return this.usersService.searchUsers(q, req.user?.id);
  }

  // ─── AUTH REQUIRED ──────────────────────────────────────────────────────
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@Request() req: { user: { id: string } }) {
    const user = await this.usersService.findById(req.user.id);
    const { password, stripeCustomerId, stripeSubscriptionId, ...safe } = user as any;
    return safe;
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @ApiOperation({ summary: 'Update profile' })
  async updateMe(@Request() req: { user: { id: string } }, @Body() dto: UpdateUserDto) {
    const user = await this.usersService.update(req.user.id, dto);
    const { password, stripeCustomerId, stripeSubscriptionId, ...safe } = user as any;
    return safe;
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('me/credentials')
  @ApiOperation({ summary: 'Update own email and/or password' })
  updateCredentials(@Request() req: { user: { id: string } }, @Body() dto: UpdateCredentialsDto) {
    return this.usersService.updateCredentials(req.user.id, dto);
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
  @ApiOperation({ summary: 'Activate Socio plan via Stripe — use /store/checkout instead' })
  becomeSocio() {
    // Mock payment endpoint disabled — socio status is granted via Stripe webhook after real payment
    throw new ForbiddenException('Use the Stripe checkout flow to become a Socio');
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
  @Get('me/weekly-votes')
  @ApiOperation({ summary: 'Get weekly vote stats for the current user' })
  getWeeklyVotes(@Request() req: { user: { id: string } }) {
    return this.usersService.getWeeklyVoteStats(req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me/daily-reward')
  @ApiOperation({ summary: 'Claim daily reward' })
  claimDaily(@Request() req: { user: { id: string } }) {
    return this.usersService.claimDailyReward(req.user.id);
  }

  // ─── ADMIN ONLY ─────────────────────────────────────────────────────────
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('set-admin')
  @ApiOperation({ summary: '[ADMIN] Set user role by email' })
  async setAdmin(@Body() { email, role }: { email: string; role: 'admin' | 'creator' | 'fan' }) {
    return this.usersService.setUserRole(email, role);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('delete-by-email')
  @ApiOperation({ summary: '[ADMIN] Delete user by email' })
  async deleteByEmail(@Body() { email }: { email: string }) {
    return this.usersService.deleteByEmail(email);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me/activity')
  @ApiOperation({ summary: 'Recent activity for the current user' })
  getMyActivity(@Request() req: any) {
    return this.usersService.getActivity(req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me/followers')
  @ApiOperation({ summary: 'List users who follow me' })
  getMyFollowers(@Request() req: any) {
    return this.usersService.getFollowers(req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me/following')
  @ApiOperation({ summary: 'List users I follow' })
  getMyFollowing(@Request() req: any) {
    return this.usersService.getFollowing(req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me/blocked')
  @ApiOperation({ summary: 'List users I have blocked' })
  getMyBlocked(@Request() req: any) {
    return this.usersService.getBlockedUsers(req.user.id);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id/profile')
  @ApiOperation({ summary: 'Get public user profile with follow counts' })
  getProfile(@Param('id') id: string, @Request() req: any) {
    return this.usersService.getPublicProfile(id, req.user?.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/follow')
  @HttpCode(200)
  @ApiOperation({ summary: 'Follow a user' })
  follow(@Param('id') id: string, @Request() req: any) {
    return this.usersService.follow(req.user.id, id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id/follow')
  @ApiOperation({ summary: 'Unfollow a user' })
  unfollow(@Param('id') id: string, @Request() req: any) {
    return this.usersService.unfollow(req.user.id, id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/block')
  @HttpCode(200)
  @ApiOperation({ summary: 'Block a user' })
  block(@Param('id') id: string, @Request() req: any) {
    return this.usersService.blockUser(req.user.id, id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id/block')
  @ApiOperation({ summary: 'Unblock a user' })
  unblock(@Param('id') id: string, @Request() req: any) {
    return this.usersService.unblockUser(req.user.id, id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get public fan profile (simple)' })
  getUser(@Param('id') id: string) {
    return this.usersService.findByIdPublic(id);
  }
}