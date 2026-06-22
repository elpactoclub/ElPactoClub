import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './users/user.entity';
import { Vote } from './gamification/vote.entity';
import { SettingsService } from './settings/settings.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(Vote) private readonly votesRepo: Repository<Vote>,
    private readonly settings: SettingsService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('stats')
  async getStats() {
    const [fans, decisions] = await Promise.all([
      this.usersRepo.count(),
      this.votesRepo.count(),
    ]);
    return { fans, decisions };
  }

  @Get('prices')
  getPrices() {
    return this.settings.getPublicPrices();
  }
}
