// EN: REST controller for /users: public stats, profile management, social (follow/block) and admin ops.
// ES: Controlador REST de /users: estadísticas públicas, gestión de perfil, social (seguir/bloquear) y operaciones de admin.
import { Controller, Get, Patch, Body, UseGuards, Request, Param, Post, Delete, Query, HttpCode, ForbiddenException } from '@nestjs/common';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateCredentialsDto } from './dto/update-credentials.dto';

// EN: Controller exposing user-related HTTP routes.
// ES: Controlador que expone las rutas HTTP relacionadas con usuarios.
@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ─── PUBLIC ─────────────────────────────────────────────────────────────
  // EN: GET /users/online-count — number of visitors active in the last 5 minutes.
  // ES: GET /users/online-count — número de visitantes activos en los últimos 5 minutos.
  @Get('online-count')
  @ApiOperation({ summary: 'Number of fans connected in the last 5 minutes' })
  onlineCount() {
    return this.usersService.getOnlineCount();
  }

  // EN: GET /users/count — total number of registered fans.
  // ES: GET /users/count — número total de fans registrados.
  @Get('count')
  @ApiOperation({ summary: 'Total number of registered fans' })
  fansCount() {
    return this.usersService.getFansCount();
  }

  // EN: GET /users/by-country — fan counts grouped by country.
  // ES: GET /users/by-country — número de fans agrupados por país.
  @Get('by-country')
  @ApiOperation({ summary: 'Fan counts grouped by country' })
  fansByCountry() {
    return this.usersService.getFansByCountry();
  }

  // EN: POST /users/visitor-ping — anonymous heartbeat to track visitor presence.
  // ES: POST /users/visitor-ping — latido anónimo para rastrear la presencia de visitantes.
  @Post('visitor-ping')
  @HttpCode(200)
  @ApiOperation({ summary: 'Anonymous heartbeat — track visitor presence' })
  visitorPing(@Body() body: { sessionId: string }) {
    if (body?.sessionId) this.usersService.visitorPing(body.sessionId);
    return { ok: true };
  }

  // EN: GET /users/leaderboard — global XP leaderboard.
  // ES: GET /users/leaderboard — tabla de clasificación global por XP.
  @Get('leaderboard')
  @ApiOperation({ summary: 'Global XP leaderboard' })
  getLeaderboard() {
    return this.usersService.getLeaderboard(50);
  }

  // EN: GET /users/search — search users by name (optional auth tailors follow/block flags).
  // ES: GET /users/search — busca usuarios por nombre (la auth opcional ajusta los indicadores de seguir/bloquear).
  @UseGuards(OptionalJwtAuthGuard)
  @Get('search')
  @ApiOperation({ summary: 'Search users by name' })
  searchUsers(@Query('q') q: string, @Request() req: any) {
    return this.usersService.searchUsers(q, req.user?.id);
  }

  // ─── AUTH REQUIRED ──────────────────────────────────────────────────────
  // EN: GET /users/me — returns the current user's profile without sensitive fields.
  // ES: GET /users/me — devuelve el perfil del usuario actual sin campos sensibles.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@Request() req: { user: { id: string } }) {
    const user = await this.usersService.findById(req.user.id);
    const { password, stripeCustomerId, stripeSubscriptionId, ...safe } = user as any;
    return safe;
  }

  // EN: PATCH /users/me — updates the current user's profile and returns it without sensitive fields.
  // ES: PATCH /users/me — actualiza el perfil del usuario actual y lo devuelve sin campos sensibles.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @ApiOperation({ summary: 'Update profile' })
  async updateMe(@Request() req: { user: { id: string } }, @Body() dto: UpdateUserDto) {
    const user = await this.usersService.update(req.user.id, dto);
    const { password, stripeCustomerId, stripeSubscriptionId, ...safe } = user as any;
    return safe;
  }

  // EN: PATCH /users/me/credentials — updates the current user's email and/or password.
  // ES: PATCH /users/me/credentials — actualiza el email y/o la contraseña del usuario actual.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('me/credentials')
  @ApiOperation({ summary: 'Update own email and/or password' })
  updateCredentials(@Request() req: { user: { id: string } }, @Body() dto: UpdateCredentialsDto) {
    return this.usersService.updateCredentials(req.user.id, dto);
  }

  // EN: POST /users/me/ping — heartbeat that marks the current user as online.
  // ES: POST /users/me/ping — latido que marca al usuario actual como conectado.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('me/ping')
  @ApiOperation({ summary: 'Heartbeat — mark user as online' })
  ping(@Request() req: { user: { id: string } }) {
    return this.usersService.updateOnlineStatus(req.user.id, true).then(() => ({ ok: true }));
  }

  // EN: POST /users/me/become-socio — disabled mock; socio status is granted via Stripe webhook.
  // ES: POST /users/me/become-socio — mock deshabilitado; el estado socio se concede vía webhook de Stripe.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('me/become-socio')
  @ApiOperation({ summary: 'Activate Socio plan via Stripe — use /store/checkout instead' })
  becomeSocio() {
    // Mock payment endpoint disabled — socio status is granted via Stripe webhook after real payment
    throw new ForbiddenException('Use the Stripe checkout flow to become a Socio');
  }

  // EN: GET /users/me/rank — returns the current user's global XP rank.
  // ES: GET /users/me/rank — devuelve el ranking global por XP del usuario actual.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me/rank')
  @ApiOperation({ summary: 'Get user global rank' })
  getMyRank(@Request() req: { user: { id: string } }) {
    return this.usersService.getRank(req.user.id);
  }

  // EN: GET /users/me/weekly-votes — returns the current user's weekly vote stats.
  // ES: GET /users/me/weekly-votes — devuelve las estadísticas de votos semanales del usuario actual.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me/weekly-votes')
  @ApiOperation({ summary: 'Get weekly vote stats for the current user' })
  getWeeklyVotes(@Request() req: { user: { id: string } }) {
    return this.usersService.getWeeklyVoteStats(req.user.id);
  }

  // EN: GET /users/me/daily-reward — claims the current user's daily reward.
  // ES: GET /users/me/daily-reward — reclama la recompensa diaria del usuario actual.
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
  // EN: POST /users/set-admin — [ADMIN] sets a user's role by email.
  // ES: POST /users/set-admin — [ADMIN] asigna el rol de un usuario por email.
  @Roles('admin')
  @Post('set-admin')
  @ApiOperation({ summary: '[ADMIN] Set user role by email' })
  async setAdmin(@Body() { email, role }: { email: string; role: 'admin' | 'creator' | 'fan' }) {
    return this.usersService.setUserRole(email, role);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  // EN: POST /users/delete-by-email — [ADMIN] deletes a user by email.
  // ES: POST /users/delete-by-email — [ADMIN] elimina un usuario por email.
  @Roles('admin')
  @Post('delete-by-email')
  @ApiOperation({ summary: '[ADMIN] Delete user by email' })
  async deleteByEmail(@Body() { email }: { email: string }) {
    return this.usersService.deleteByEmail(email);
  }

  // EN: GET /users/me/activity — recent activity (notifications) for the current user.
  // ES: GET /users/me/activity — actividad reciente (notificaciones) del usuario actual.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me/activity')
  @ApiOperation({ summary: 'Recent activity for the current user' })
  getMyActivity(@Request() req: any) {
    return this.usersService.getActivity(req.user.id);
  }

  // EN: GET /users/me/followers — lists users who follow the current user.
  // ES: GET /users/me/followers — lista los usuarios que siguen al usuario actual.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me/followers')
  @ApiOperation({ summary: 'List users who follow me' })
  getMyFollowers(@Request() req: any) {
    return this.usersService.getFollowers(req.user.id);
  }

  // EN: GET /users/me/following — lists users the current user follows.
  // ES: GET /users/me/following — lista los usuarios a los que sigue el usuario actual.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me/following')
  @ApiOperation({ summary: 'List users I follow' })
  getMyFollowing(@Request() req: any) {
    return this.usersService.getFollowing(req.user.id);
  }

  // EN: GET /users/me/blocked — lists users the current user has blocked.
  // ES: GET /users/me/blocked — lista los usuarios que el usuario actual ha bloqueado.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me/blocked')
  @ApiOperation({ summary: 'List users I have blocked' })
  getMyBlocked(@Request() req: any) {
    return this.usersService.getBlockedUsers(req.user.id);
  }

  // EN: GET /users/:id/profile — public profile with follow counts and follow/block state.
  // ES: GET /users/:id/profile — perfil público con contadores de seguimiento y estado de seguir/bloquear.
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id/profile')
  @ApiOperation({ summary: 'Get public user profile with follow counts' })
  getProfile(@Param('id') id: string, @Request() req: any) {
    return this.usersService.getPublicProfile(id, req.user?.id);
  }

  // EN: POST /users/:id/follow — current user follows the given user.
  // ES: POST /users/:id/follow — el usuario actual sigue al usuario indicado.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/follow')
  @HttpCode(200)
  @ApiOperation({ summary: 'Follow a user' })
  follow(@Param('id') id: string, @Request() req: any) {
    return this.usersService.follow(req.user.id, id);
  }

  // EN: DELETE /users/:id/follow — current user unfollows the given user.
  // ES: DELETE /users/:id/follow — el usuario actual deja de seguir al usuario indicado.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id/follow')
  @ApiOperation({ summary: 'Unfollow a user' })
  unfollow(@Param('id') id: string, @Request() req: any) {
    return this.usersService.unfollow(req.user.id, id);
  }

  // EN: POST /users/:id/block — current user blocks the given user.
  // ES: POST /users/:id/block — el usuario actual bloquea al usuario indicado.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/block')
  @HttpCode(200)
  @ApiOperation({ summary: 'Block a user' })
  block(@Param('id') id: string, @Request() req: any) {
    return this.usersService.blockUser(req.user.id, id);
  }

  // EN: DELETE /users/:id/block — current user unblocks the given user.
  // ES: DELETE /users/:id/block — el usuario actual desbloquea al usuario indicado.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id/block')
  @ApiOperation({ summary: 'Unblock a user' })
  unblock(@Param('id') id: string, @Request() req: any) {
    return this.usersService.unblockUser(req.user.id, id);
  }

  // EN: GET /users/:id — returns a simple public fan profile.
  // ES: GET /users/:id — devuelve un perfil público de fan simplificado.
  @Get(':id')
  @ApiOperation({ summary: 'Get public fan profile (simple)' })
  getUser(@Param('id') id: string) {
    return this.usersService.findByIdPublic(id);
  }
}