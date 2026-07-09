// EN: Admin REST controller exposing protected endpoints for users, events, votes, raffles, store, projects and settings.
// ES: Controlador REST admin que expone endpoints protegidos de usuarios, eventos, votaciones, sorteos, tienda, proyectos y ajustes.
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';
import { CreateEventAdminDto, UpdateEventAdminDto } from './dto/event-admin.dto';

// EN: Controller guarded by JWT auth and role checks; all routes are under the /admin prefix.
// ES: Controlador protegido por autenticación JWT y comprobación de roles; todas las rutas bajo el prefijo /admin.
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  // ─── Dashboard ────────────────────────────────────────────────────────
  // EN: Returns global dashboard statistics (users, events, votes, missions, posts).
  // ES: Devuelve estadísticas globales del panel (usuarios, eventos, votaciones, misiones, posts).
  @Get('stats')
  @Roles('admin', 'creator')
  stats() {
    return this.admin.getStats();
  }

  // EN: Returns the requesting creator's own content stats (posts, likes).
  // ES: Devuelve las estadísticas de contenido del propio creador (posts, likes).
  @Get('my-stats')
  @Roles('admin', 'creator')
  myStats(@Req() req: any) {
    return this.admin.getCreatorStats(req.user.id);
  }

  // ─── Users ────────────────────────────────────────────────────────────
  // EN: Lists users with pagination, optional text search and role/socio filter.
  // ES: Lista usuarios con paginación, búsqueda de texto opcional y filtro por rol/socio.
  @Get('users')
  @Roles('admin')
  listUsers(
    @Query('page') page = '1',
    @Query('limit') limit = '30',
    @Query('search') search?: string,
    @Query('filter') filter?: string,
  ) {
    return this.admin.listUsers(parseInt(page, 10), parseInt(limit, 10), search, filter);
  }

  // EN: Bulk-updates XP for all users by adding to or setting a fixed amount.
  // ES: Actualiza en masa el XP de todos los usuarios sumando o fijando una cantidad.
  @Patch('users/bulk-xp')
  @Roles('admin')
  bulkUpdateXP(@Body() body: { mode: 'add' | 'set'; amount: number }) {
    return this.admin.bulkUpdateXP(body.mode, body.amount);
  }

  // EN: Creates a new user with optional admin overrides (role, credits, XP).
  // ES: Crea un usuario nuevo con anulaciones opcionales de admin (rol, créditos, XP).
  @Post('users')
  @Roles('admin')
  createUser(@Body() dto: any) {
    return this.admin.createUser(dto);
  }

  // EN: Returns a single user by id (without the password field).
  // ES: Devuelve un único usuario por id (sin el campo de contraseña).
  @Get('users/:id')
  @Roles('admin')
  getUser(@Param('id') id: string) {
    return this.admin.getUser(id);
  }

  // EN: Updates a user's profile, role, credits, XP or password by id.
  // ES: Actualiza el perfil, rol, créditos, XP o contraseña de un usuario por id.
  @Patch('users/:id')
  @Roles('admin')
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserAdminDto) {
    return this.admin.updateUser(id, dto);
  }

  // EN: Deletes a user by id.
  // ES: Elimina un usuario por id.
  @Delete('users/:id')
  @Roles('admin')
  deleteUser(@Param('id') id: string) {
    return this.admin.deleteUser(id);
  }

  // ─── Events (admin + creator) ─────────────────────────────────────────
  // EN: Lists all events with their real attendee counts.
  // ES: Lista todos los eventos con su conteo real de asistentes.
  @Get('events')
  @Roles('admin', 'creator')
  listEvents() {
    return this.admin.listEvents();
  }

  // EN: Lists events awaiting approval (status pending).
  // ES: Lista eventos pendientes de aprobación (estado pending).
  @Get('events/pending')
  @Roles('admin')
  getPendingEvents() {
    return this.admin.getPendingEvents();
  }

  // EN: Returns a single event by id.
  // ES: Devuelve un único evento por id.
  @Get('events/:id')
  @Roles('admin', 'creator')
  getEvent(@Param('id') id: string) {
    return this.admin.getEvent(id);
  }

  // EN: Creates a new event (auto-approved).
  // ES: Crea un evento nuevo (auto-aprobado).
  @Post('events')
  @Roles('admin')
  createEvent(@Body() dto: CreateEventAdminDto) {
    return this.admin.createEvent(dto);
  }

  // EN: Approves a pending event.
  // ES: Aprueba un evento pendiente.
  @Patch('events/:id/approve')
  @Roles('admin')
  approveEvent(@Param('id') id: string) {
    return this.admin.approveEvent(id);
  }

  // EN: Rejects a pending event.
  // ES: Rechaza un evento pendiente.
  @Patch('events/:id/reject')
  @Roles('admin')
  rejectEvent(@Param('id') id: string) {
    return this.admin.rejectEvent(id);
  }

  // EN: Updates an event's fields by id.
  // ES: Actualiza los campos de un evento por id.
  @Patch('events/:id')
  @Roles('admin', 'creator')
  updateEvent(@Param('id') id: string, @Body() dto: UpdateEventAdminDto) {
    return this.admin.updateEvent(id, dto);
  }

  // EN: Deletes an event by id.
  // ES: Elimina un evento por id.
  @Delete('events/:id')
  @Roles('admin')
  deleteEvent(@Param('id') id: string) {
    return this.admin.deleteEvent(id);
  }

  // EN: Removes an attendee from an event and refunds their credits.
  // ES: Quita a un asistente de un evento y le reembolsa sus créditos.
  @Delete('events/:id/attendees/:userId')
  @Roles('admin')
  removeAttendee(@Param('id') id: string, @Param('userId') userId: string) {
    return this.admin.removeAttendee(id, userId);
  }

  // ─── Votes (historial UserVotes) ─────────────────────────────────────
  // EN: Lists the history of cast user votes.
  // ES: Lista el historial de votos emitidos por los usuarios.
  @Get('votes')
  @Roles('admin')
  listVotes() {
    return this.admin.listVotes();
  }

  // ─── Vote objects (gestión) ───────────────────────────────────────────
  // EN: Lists votation objects (the votes themselves).
  // ES: Lista los objetos de votación (las votaciones en sí).
  @Get('vote-objects')
  @Roles('admin')
  listVoteObjects() {
    return this.admin.listVoteObjects();
  }

  // EN: Creates a new votation.
  // ES: Crea una nueva votación.
  @Post('vote-objects')
  @Roles('admin')
  createVoteObject(@Body() dto: any) {
    return this.admin.createVoteObject(dto);
  }

  // EN: Updates a votation's fields by id.
  // ES: Actualiza los campos de una votación por id.
  @Patch('vote-objects/:id')
  @Roles('admin')
  updateVoteObject(@Param('id') id: string, @Body() dto: any) {
    return this.admin.updateVoteObject(id, dto);
  }

  // EN: Settles a votation by marking the correct option and closing it.
  // ES: Resuelve una votación marcando la opción correcta y cerrándola.
  @Patch('vote-objects/:id/settle')
  @Roles('admin')
  settleVote(@Param('id') id: string, @Body() body: { correctOption: string }) {
    return this.admin.settleVote(id, body.correctOption);
  }

  // EN: Deletes a votation and its associated user votes.
  // ES: Elimina una votación y sus votos de usuario asociados.
  @Delete('vote-objects/:id')
  @Roles('admin')
  deleteVoteObject(@Param('id') id: string) {
    return this.admin.deleteVoteObject(id);
  }

  // ─── Raffles ──────────────────────────────────────────────────────────
  @Get('raffles')
  @Roles('admin')
  listRaffles() {
    return this.admin.listRaffles();
  }

  @Post('raffles')
  @Roles('admin')
  createRaffle(@Body() dto: any) {
    return this.admin.createRaffle(dto);
  }

  @Patch('raffles/:id')
  @Roles('admin')
  updateRaffle(@Param('id') id: string, @Body() dto: any) {
    return this.admin.updateRaffle(id, dto);
  }

  @Get('raffles/:id/entries')
  @Roles('admin')
  listRaffleEntries(@Param('id') id: string) {
    return this.admin.listRaffleEntries(id);
  }

  @Post('raffles/:id/draw')
  @Roles('admin')
  drawRaffle(@Param('id') id: string) {
    return this.admin.drawRaffle(id);
  }

  @Delete('raffles/:id')
  @Roles('admin')
  deleteRaffle(@Param('id') id: string) {
    return this.admin.deleteRaffle(id);
  }

  // ─── Store benefits ───────────────────────────────────────────────────
  @Get('store-benefits')
  @Roles('admin')
  listStoreBenefits() {
    return this.admin.listStoreBenefits();
  }

  @Post('store-benefits')
  @Roles('admin')
  createStoreBenefit(@Body() dto: any) {
    return this.admin.createStoreBenefit(dto);
  }

  @Patch('store-benefits/:id')
  @Roles('admin')
  updateStoreBenefit(@Param('id') id: string, @Body() dto: any) {
    return this.admin.updateStoreBenefit(id, dto);
  }

  @Delete('store-benefits/:id')
  @Roles('admin')
  deleteStoreBenefit(@Param('id') id: string) {
    return this.admin.deleteStoreBenefit(id);
  }

  // ─── Impact projects ──────────────────────────────────────────────────
  @Get('projects')
  @Roles('admin')
  listProjects() {
    return this.admin.listProjects();
  }

  @Post('projects')
  @Roles('admin')
  createProject(@Body() dto: any) {
    return this.admin.createProject(dto);
  }

  @Patch('projects/:id')
  @Roles('admin')
  updateProject(@Param('id') id: string, @Body() dto: any) {
    return this.admin.updateProject(id, dto);
  }

  @Delete('projects/:id')
  @Roles('admin')
  deleteProject(@Param('id') id: string) {
    return this.admin.deleteProject(id);
  }

  // ─── Club creators (showcase) ─────────────────────────────────────────
  @Get('creator-users')
  @Roles('admin')
  listCreatorUsers() {
    return this.admin.listCreatorUsers();
  }

  @Get('club-creators')
  @Roles('admin')
  listClubCreators() {
    return this.admin.listClubCreators();
  }

  @Post('club-creators')
  @Roles('admin')
  createClubCreator(@Body() dto: any) {
    return this.admin.createClubCreator(dto);
  }

  @Patch('club-creators/:id')
  @Roles('admin')
  updateClubCreator(@Param('id') id: string, @Body() dto: any) {
    return this.admin.updateClubCreator(id, dto);
  }

  @Delete('club-creators/:id')
  @Roles('admin')
  deleteClubCreator(@Param('id') id: string) {
    return this.admin.deleteClubCreator(id);
  }

  // ─── Notificaciones (broadcast) ───────────────────────────────────────
  @Post('broadcast')
  @Roles('admin')
  broadcast(@Body() body: { title: string; message: string }) {
    return this.admin.broadcastNotification(body.title, body.message);
  }

  // ─── Mensaje directo masivo (a la bandeja de DMs) ─────────────────────
  @Post('dm-broadcast')
  @Roles('admin')
  dmBroadcast(@Req() req: any, @Body() body: { content: string; userIds?: string[] }) {
    return this.admin.sendAdminDm(req.user.id, body.content, body.userIds);
  }

  // ─── Missions ─────────────────────────────────────────────────────────
  @Get('missions')
  @Roles('admin')
  listMissions() {
    return this.admin.listMissions();
  }

  @Patch('missions/:code/reset')
  @Roles('admin')
  resetMission(@Param('code') code: string) {
    return this.admin.resetMission(code);
  }

  @Patch('missions/:code')
  @Roles('admin')
  updateMission(
    @Param('code') code: string,
    @Body() dto: { title?: string; description?: string; target?: number; reward?: string; isActive?: boolean },
  ) {
    return this.admin.updateMission(code, dto);
  }

  @Post('missions')
  @Roles('admin')
  createMission(@Body() dto: { code: string; title: string; description?: string; target: number; reward?: string; isActive?: boolean }) {
    return this.admin.createMission(dto);
  }

  // ─── Badges ───────────────────────────────────────────────────────────
  @Get('badges/catalog')
  @Roles('admin')
  getBadgeCatalog() {
    return this.admin.getBadgeCatalog();
  }

  @Get('users/:id/badges')
  @Roles('admin')
  getUserBadges(@Param('id') id: string) {
    return this.admin.getUserBadges(id);
  }

  @Post('users/:id/badges/:code')
  @Roles('admin')
  awardBadge(@Param('id') id: string, @Param('code') code: string) {
    return this.admin.awardBadge(id, code);
  }

  @Delete('users/:id/badges/:code')
  @Roles('admin')
  revokeBadge(@Param('id') id: string, @Param('code') code: string) {
    return this.admin.revokeBadge(id, code);
  }

  // ─── Settings ─────────────────────────────────────────────────────────
  @Get('settings')
  @Roles('admin')
  getSettings() {
    return this.admin.getSettings();
  }

  @Patch('settings/:key')
  @Roles('admin')
  updateSetting(@Param('key') key: string, @Body() body: { value: string }) {
    return this.admin.updateSetting(key, body.value);
  }

  // ─── Posts (moderation) ───────────────────────────────────────────────
  @Get('posts')
  @Roles('admin', 'creator')
  listPosts(@Query('limit') limit = '50') {
    return this.admin.listPosts(parseInt(limit, 10));
  }

  @Delete('posts/:id')
  @Roles('admin')
  deletePost(@Param('id') id: string) {
    return this.admin.deletePost(id);
  }

  // ─── Deleted messages (moderation) ───────────────────────────────────
  // EN: Lists soft-deleted chat messages, optionally filtered by channel.
  // ES: Lista los mensajes de chat borrados suavemente, filtrables por canal.
  @Get('deleted-messages')
  @Roles('admin')
  getDeletedMessages(@Query('channel') channel?: string) {
    return this.admin.getDeletedMessages(channel);
  }

  // EN: Restores a soft-deleted message by id.
  // ES: Restaura un mensaje borrado suavemente por id.
  @Patch('deleted-messages/:id/restore')
  @Roles('admin')
  restoreMessage(@Param('id') id: string) {
    return this.admin.restoreMessage(id);
  }

  // ─── Deleted posts (moderation) ──────────────────────────────────────
  @Get('deleted-posts')
  @Roles('admin')
  getDeletedPosts() {
    return this.admin.getDeletedPosts();
  }

  @Patch('deleted-posts/:id/restore')
  @Roles('admin')
  restorePost(@Param('id') id: string) {
    return this.admin.restorePost(id);
  }

  // ─── Deleted comments (moderation) ───────────────────────────────────
  @Get('deleted-comments')
  @Roles('admin')
  getDeletedComments() {
    return this.admin.getDeletedComments();
  }

  @Patch('deleted-comments/:id/restore')
  @Roles('admin')
  restoreComment(@Param('id') id: string) {
    return this.admin.restoreComment(id);
  }
}
