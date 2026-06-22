import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppSetting } from './app-setting.entity';

export const SETTING_DEFAULTS: Record<string, string> = {
  price_socio_cents: '500',
  price_credits_100_cents: '350',
  price_credits_200_cents: '600',
  dm_creator_cost_credits: '50',
  dm_creator_xp_reward: '30',
};

@Injectable()
export class SettingsService implements OnModuleInit {
  private cache: Record<string, string> = { ...SETTING_DEFAULTS };

  constructor(
    @InjectRepository(AppSetting) private readonly repo: Repository<AppSetting>,
  ) {}

  async onModuleInit() {
    for (const [key, value] of Object.entries(SETTING_DEFAULTS)) {
      const existing = await this.repo.findOne({ where: { key } });
      if (!existing) await this.repo.save({ key, value });
    }
    const all = await this.repo.find();
    for (const s of all) this.cache[s.key] = s.value;
  }

  getNumber(key: string): number {
    const v = this.cache[key] ?? SETTING_DEFAULTS[key] ?? '0';
    return parseInt(v, 10);
  }

  getAll(): Promise<AppSetting[]> {
    return this.repo.find({ order: { key: 'ASC' } });
  }

  getPublicPrices(): { socio: number; credits100: number; credits200: number } {
    return {
      socio:      this.getNumber('price_socio_cents') / 100,
      credits100: this.getNumber('price_credits_100_cents') / 100,
      credits200: this.getNumber('price_credits_200_cents') / 100,
    };
  }

  async set(key: string, value: string): Promise<AppSetting> {
    const saved = await this.repo.save({ key, value });
    this.cache[key] = value;
    return saved;
  }
}
