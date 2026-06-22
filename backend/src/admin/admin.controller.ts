import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';
import { CreateEventAdminDto, UpdateEventAdminDto } from './dto/event-admin.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  // ─── Dashboard ────────────────────────────────────────────────────────
  @Get('stats')
  @Roles('admin', 'creator')
  stats() {
    return this.admin.getStats();
  }

  @Get('my-stats')
  @Roles('admin', 'creator')
  myStats(@Req() req: any) {
    return this.admin.getCreatorStats(req.user.id);
  }

  // ─── Users ────────────────────────────────────────────────────────────
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

  @Patch('users/bulk-xp')
  @Roles('admin')
  bulkUpdateXP(@Body() body: { mode: 'add' | 'set'; amount: number }) {
    return this.admin.bulkUpdateXP(body.mode, body.amount);
  }

  @Post('users')
  @Roles('admin')
  createUser(@Body() dto: any) {
    return this.admin.createUser(dto);
  }

  @Get('users/:id')
  @Roles('admin')
  getUser(@Param('id') id: string) {
    return this.admin.getUser(id);
  }

  @Patch('users/:id')
  @Roles('admin')
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserAdminDto) {
    return this.admin.updateUser(id, dto);
  }

  @Delete('users/:id')
  @Roles('admin')
  deleteUser(@Param('id') id: string) {
    return this.admin.deleteUser(id);
  }

  // ─── Events (admin + creator) ─────────────────────────────────────────
  @Get('events')
  @Roles('admin', 'creator')
  listEvents() {
    return this.admin.listEvents();
  }

  @Get('events/pending')
  @Roles('admin')
  getPendingEvents() {
    return this.admin.getPendingEvents();
  }

  @Get('events/:id')
  @Roles('admin', 'creator')
  getEvent(@Param('id') id: string) {
    return this.admin.getEvent(id);
  }

  @Post('events')
  @Roles('admin')
  createEvent(@Body() dto: CreateEventAdminDto) {
    return this.admin.createEvent(dto);
  }

  @Patch('events/:id/approve')
  @Roles('admin')
  approveEvent(@Param('id') id: string) {
    return this.admin.approveEvent(id);
  }

  @Patch('events/:id/reject')
  @Roles('admin')
  rejectEvent(@Param('id') id: string) {
    return this.admin.rejectEvent(id);
  }

  @Patch('events/:id')
  @Roles('admin', 'creator')
  updateEvent(@Param('id') id: string, @Body() dto: UpdateEventAdminDto) {
    return this.admin.updateEvent(id, dto);
  }

  @Delete('events/:id')
  @Roles('admin')
  deleteEvent(@Param('id') id: string) {
    return this.admin.deleteEvent(id);
  }

  @Delete('events/:id/attendees/:userId')
  @Roles('admin')
  removeAttendee(@Param('id') id: string, @Param('userId') userId: string) {
    return this.admin.removeAttendee(id, userId);
  }

  // ─── Votes (historial UserVotes) ─────────────────────────────────────
  @Get('votes')
  @Roles('admin')
  listVotes() {
    return this.admin.listVotes();
  }

  // ─── Vote objects (gestión) ───────────────────────────────────────────
  @Get('vote-objects')
  @Roles('admin')
  listVoteObjects() {
    return this.admin.listVoteObjects();
  }

  @Post('vote-objects')
  @Roles('admin')
  createVoteObject(@Body() dto: any) {
    return this.admin.createVoteObject(dto);
  }

  @Patch('vote-objects/:id')
  @Roles('admin')
  updateVoteObject(@Param('id') id: string, @Body() dto: any) {
    return this.admin.updateVoteObject(id, dto);
  }

  @Patch('vote-objects/:id/settle')
  @Roles('admin')
  settleVote(@Param('id') id: string, @Body() body: { correctOption: string }) {
    return this.admin.settleVote(id, body.correctOption);
  }

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
}
