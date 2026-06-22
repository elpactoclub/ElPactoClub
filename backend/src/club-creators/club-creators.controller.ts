import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ClubCreatorsService } from './club-creators.service';

@ApiTags('club-creators')
@Controller('club-creators')
export class ClubCreatorsController {
  constructor(private readonly service: ClubCreatorsService) {}

  @Get()
  getActive() {
    return this.service.getActive();
  }
}
