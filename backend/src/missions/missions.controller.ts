import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MissionsService } from './missions.service';

@ApiTags('missions')
@Controller('missions')
export class MissionsController {
  constructor(private readonly svc: MissionsService) {}

  @Get()
  list() {
    return this.svc.listActive();
  }
}