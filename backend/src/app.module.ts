// EN: Root application module — wires up config, database (TypeORM), global rate limiting, and all feature modules.
// ES: Módulo raíz de la aplicación — conecta la configuración, la base de datos (TypeORM), el rate limiting global y todos los módulos de funcionalidad.
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GamificationModule } from './gamification/gamification.module';
import { EventsModule } from './events/events.module';
import { CommunityModule } from './community/community.module';
import { StoreModule } from './store/store.module';
import { ProjectsModule } from './projects/projects.module';
import { ClubCreatorsModule } from './club-creators/club-creators.module';
import { BadgesModule } from './badges/badges.module';
import { MissionsModule } from './missions/missions.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DonationsModule } from './donations/donations.module';
import { DmModule } from './dm/dm.module';
import { AdminModule } from './admin/admin.module';
import { SettingsModule } from './settings/settings.module';
import { GatewayModule } from './gateway/gateway.module';

import { Event } from './events/event.entity';
import { Raffle } from './gamification/raffle.entity';
import { Vote } from './gamification/vote.entity';
import { Post, Message } from './community/post.entity';
import { User } from './users/user.entity';
import { StoreBenefit } from './store/store-benefit.entity';
import { Project } from './projects/project.entity';
import { ClubCreator } from './club-creators/club-creator.entity';
import { SeedService } from './seed.service';
import { MailModule } from './mail/mail.module';
import { ContactController } from './contact.controller';

@Module({
  imports: [
    // Config (env variables)
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),

    // Rate limiting — 60 requests per minute per IP globally
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),

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

    TypeOrmModule.forFeature([Event, Raffle, Vote, Post, Message, User, StoreBenefit, Project, ClubCreator]),

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
    ProjectsModule,
    ClubCreatorsModule,
    AdminModule,
    SettingsModule,
    MailModule,
    GatewayModule,
  ],
  controllers: [AppController, ContactController],
  providers: [
    AppService,
    SeedService,
    // Apply rate limiting globally to all routes
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
// EN: Root module class assembled by the @Module decorator above.
// ES: Clase del módulo raíz ensamblada por el decorador @Module de arriba.
export class AppModule {}
