import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
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
import { Post, Message } from './community/post.entity';
import { User } from './users/user.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [
    // Config (env variables)
    ConfigModule.forRoot({ isGlobal: true }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => {
        const isProd = config.get<string>('NODE_ENV') === 'production';
        const dbUrl = config.get<string>('DATABASE_URL');
        const base = {
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: config.get<string>('DB_SYNCHRONIZE') === 'true' || !isProd,
          logging: !isProd,
          ssl: isProd ? { rejectUnauthorized: false } : false,
        };
        if (dbUrl) {
          return { type: 'postgres', url: dbUrl, ...base };
        }
        return {
          type: 'postgres',
          host: config.get<string>('DB_HOST') ?? 'localhost',
          port: Number(config.get<string>('DB_PORT') ?? 5432),
          username: config.get<string>('DB_USER') ?? 'postgres',
          password: config.get<string>('DB_PASS') ?? 'postgres',
          database: config.get<string>('DB_NAME') ?? 'elpacto',
          ...base,
        };
      },
      inject: [ConfigService],
    }),

    TypeOrmModule.forFeature([Event, Raffle, Vote, Post, Message, User]),

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
