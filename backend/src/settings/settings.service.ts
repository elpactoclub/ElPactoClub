// EN: Settings service: cached key/value app settings (prices, DM costs) with defaults seeding.
// ES: Servicio de ajustes: ajustes clave/valor en caché (precios, costes de DM) con siembra de valores por defecto.
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppSetting } from './app-setting.entity';

// EN: Default values for app settings.
// ES: Valores por defecto de los ajustes de la app.
export const SETTING_DEFAULTS: Record<string, string> = {
  price_socio_cents: '500',
  price_credits_100_cents: '350',
  price_credits_200_cents: '600',
  dm_creator_cost_credits: '50',
  dm_creator_xp_reward: '30',
};

// EN: Injectable settings service keeping an in-memory cache, initialized on module start.
// ES: Servicio de ajustes inyectable que mantiene una caché en memoria, inicializada al arrancar el módulo.
@Injectable()
export class SettingsService implements OnModuleInit {
  private cache: Record<string, string> = { ...SETTING_DEFAULTS };

  constructor(
    @InjectRepository(AppSetting) private readonly repo: Repository<AppSetting>,
  ) {}

  // EN: On startup, seeds missing default settings and loads all into the cache.
  // ES: Al arrancar, siembra los ajustes por defecto que falten y carga todos en la caché.
  async onModuleInit() {
    for (const [key, value] of Object.entries(SETTING_DEFAULTS)) {
      const existing = await this.repo.findOne({ where: { key } });
      if (!existing) await this.repo.save({ key, value });
    }
    const all = await this.repo.find();
    for (const s of all) this.cache[s.key] = s.value;
  }

  // EN: Returns a setting value parsed as an integer from the cache.
  // ES: Devuelve el valor de un ajuste parseado como entero desde la caché.
  getNumber(key: string): number {
    const v = this.cache[key] ?? SETTING_DEFAULTS[key] ?? '0';
    return parseInt(v, 10);
  }

  // EN: Returns all settings ordered by key.
  // ES: Devuelve todos los ajustes ordenados por clave.
  getAll(): Promise<AppSetting[]> {
    return this.repo.find({ order: { key: 'ASC' } });
  }

  // EN: Returns the public-facing prices (in euros) derived from the cents settings.
  // ES: Devuelve los precios públicos (en euros) derivados de los ajustes en céntimos.
  getPublicPrices(): { socio: number; credits100: number; credits200: number } {
    return {
      socio:      this.getNumber('price_socio_cents') / 100,
      credits100: this.getNumber('price_credits_100_cents') / 100,
      credits200: this.getNumber('price_credits_200_cents') / 100,
    };
  }

  // EN: Persists a setting and updates the in-memory cache.
  // ES: Persiste un ajuste y actualiza la caché en memoria.
  async set(key: string, value: string): Promise<AppSetting> {
    const saved = await this.repo.save({ key, value });
    this.cache[key] = value;
    return saved;
  }
}
