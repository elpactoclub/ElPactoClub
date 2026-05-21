import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DonationsService } from './donations.service';
import { ProjectId } from './donation.entity';

@ApiTags('donations')
@Controller('donations')
export class DonationsController {
  constructor(private readonly svc: DonationsService) {}

  @Get('totals')
  totals() {
    return this.svc.totalsByProject();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  mine(@Request() req: { user: { id: string } }) {
    return this.svc.myDonations(req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Request() req: { user: { id: string } },
    @Body() body: { projectId: ProjectId; amount: number },
  ) {
    return this.svc.create(req.user.id, body.projectId, body.amount);
  }
}