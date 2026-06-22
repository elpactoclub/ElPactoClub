import { Module } from '@nestjs/common';
import { TigrisService } from './tigris.service';

@Module({
  providers: [TigrisService],
  exports: [TigrisService],
})
export class TigrisModule {}
