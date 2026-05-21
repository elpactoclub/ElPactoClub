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

  // ─── Users ────────────────────────────────────────────────────────────
  @Get('users')
  @Roles('admin')
  listUsers(
    @Query('page') page = '1',
    @Query('limit') limit = '30',
    @Query('search') search?: string,
  ) {
    return this.admin.listUsers(parseInt(page, 10), parseInt(limit, 10), search);
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

  @Get('events/:id')
  @Roles('admin', 'creator')
  getEvent(@Param('id') id: string) {
    return this.admin.getEvent(id);
  }

  @Post('events')
  @Roles('admin', 'creator')
  createEvent(@Body() dto: CreateEventAdminDto, @Req() req: any) {
    // Creators can create events but they are flagged as their own
    return this.admin.createEvent(dto);
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

  // ─── Votes ────────────────────────────────────────────────────────────
  @Get('votes')
  @Roles('admin')
  listVotes() {
    return this.admin.listVotes();
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
