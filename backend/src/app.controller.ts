// EN: Root controller — exposes health/hello, global stats, and public pricing endpoints.
// ES: Controlador raíz — expone los endpoints de salud/hello, estadísticas globales y precios públicos.
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './users/user.entity';
import { Vote } from './gamification/vote.entity';
import { SettingsService } from './settings/settings.service';

// EN: Root controller class grouping top-level public endpoints.
// ES: Clase del controlador raíz que agrupa los endpoints públicos de nivel superior.
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(Vote) private readonly votesRepo: Repository<Vote>,
    private readonly settings: SettingsService,
  ) {}

  // EN: Health/hello endpoint returning a simple greeting string.
  // ES: Endpoint de salud/hello que devuelve un saludo simple.
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // EN: Returns global stats — total registered fans and total decisions (votes) cast.
  // ES: Devuelve estadísticas globales — total de fans registrados y total de decisiones (votos) emitidas.
  @Get('stats')
  async getStats() {
    const [fans, decisions] = await Promise.all([
      this.usersRepo.count(),
      this.votesRepo.count(),
    ]);
    return { fans, decisions };
  }

  // EN: Returns the public pricing configuration managed from the admin settings.
  // ES: Devuelve la configuración de precios públicos gestionada desde los ajustes de administración.
  @Get('prices')
  getPrices() {
    return this.settings.getPublicPrices();
  }
}
