import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BadgesService } from './badges.service';

@ApiTags('badges')
@Controller('badges')
export class BadgesController {
  constructor(private readonly svc: BadgesService) {}

  @Get()
  catalog() {
    return this.svc.catalog();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  mine(@Request() req: { user: { id: string } }) {
    return this.svc.listForUser(req.user.id);
  }
}