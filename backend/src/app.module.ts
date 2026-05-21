import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GamificationModule } from './gamification/gamification.module';
import { EventsModule } from './events/events.module';
import { CommunityModule } from './community/community.module';
import { StoreModule } from './store/store.module';
import { BadgesModule } from './badges/badges.module';
import { MissionsModule } from './missions/missions.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DonationsModule } from './donations/donations.module';
import { DmModule } from './dm/dm.module';
import { AdminModule } from './admin/admin.module';

import { Event } from './events/event.entity';
import { Raffle } from './gamification/raffle.entity';
import { Vote } from './gamification/vote.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [
    // Config (env variables)
    ConfigModule.forRoot({ isGlobal: true }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USER', 'postgres'),
        password: config.get('DB_PASS', 'postgres'),
        database: config.get('DB_NAME', 'elpacto'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: config.get('NODE_ENV') !== 'production',
        logging: config.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),

    TypeOrmModule.forFeature([Event, Raffle, Vote]),

    // Feature modules — order matters for seed service dependencies
    NotificationsModule,
    BadgesModule,
    MissionsModule,
    AuthModule,
    UsersModule,
    GamificationModule,
    EventsModule,
    CommunityModule,
    DonationsModule,
    DmModule,
    StoreModule,
    AdminModule,
  ],
  providers: [SeedService],
})
export class AppModule {}
