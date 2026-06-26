// EN: Settings module: wires the settings service and entity, exported for other modules.
// ES: Módulo de ajustes: conecta el servicio y la entidad de ajustes, exportado para otros módulos.
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppSetting } from './app-setting.entity';
import { SettingsService } from './settings.service';

// EN: Settings feature module declaration.
// ES: Declaración del módulo de la funcionalidad de ajustes.
@Module({
  imports: [TypeOrmModule.forFeature([AppSetting])],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
