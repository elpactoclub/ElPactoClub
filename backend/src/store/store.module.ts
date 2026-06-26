// EN: Store module: wires the store controller, service and entities (Stripe checkout + benefits).
// ES: Módulo de tienda: conecta el controlador, servicio y entidades de la tienda (checkout de Stripe + beneficios).
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreService } from './store.service';
import { StoreController } from './store.controller';
import { User } from '../users/user.entity';
import { StoreBenefit } from './store-benefit.entity';
import { SettingsModule } from '../settings/settings.module';

// EN: Store feature module declaration.
// ES: Declaración del módulo de la funcionalidad de tienda.
@Module({
  imports: [TypeOrmModule.forFeature([User, StoreBenefit]), SettingsModule],
  providers: [StoreService],
  controllers: [StoreController],
})
export class StoreModule {}
