// EN: Tigris module: provides and exports the TigrisService for file uploads.
// ES: Módulo Tigris: provee y exporta el TigrisService para subidas de archivos.
import { Module } from '@nestjs/common';
import { TigrisService } from './tigris.service';

// EN: Tigris feature module declaration.
// ES: Declaración del módulo de la funcionalidad Tigris.
@Module({
  providers: [TigrisService],
  exports: [TigrisService],
})
export class TigrisModule {}
