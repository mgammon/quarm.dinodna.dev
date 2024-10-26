import { Module } from '@nestjs/common';
import { Log } from './logs/log.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import {
  Auction,
  AuctionTracker,
  DailyAuction,
} from './auctions/auction.entity';
import { ItemModule } from './items/item.module';
import {
  Item,
  LootDrop,
  LootDropEntry,
  LootTable,
  LootTableEntry,
} from './items/item.entity';
import {
  MerchantEntry,
  Npc,
  Spawn,
  SpawnEntry,
  SpawnGroup,
} from './npcs/npc.entity';
import { NpcModule } from './npcs/npc.module';
import { SpellNew } from './spells/spell-new.entity';
import { SpellModule } from './spells/spell.module';
import { Zone } from './zones/zone.entity';
import { ZoneModule } from './zones/zone.module';
import { EventsModule } from './events/events.module';
import { Rule } from './npcs/rule.entity';
import { AdminModule } from './admin/admin.module';
import { config } from './config';
import { UserModule } from './user/user.module';
import { User } from './user/user.entity';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { LogModule } from './logs/log.module';
import { LocationModule } from './location/location.module';
import { ScheduleModule } from '@nestjs/schedule';
import { PlayerModule } from './player/player.module';
import { SkillCap } from './player/skill-cap.entity';
import { FeedbackModule } from './feedback/feedback.module';

@Module({
  imports: [
    LocationModule,
    LogModule,
    ItemModule,
    NpcModule,
    SpellModule,
    ZoneModule,
    EventsModule,
    AdminModule,
    UserModule,
    PlayerModule,
    FeedbackModule,
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    ServeStaticModule.forRoot({
      // rootPath: './public',
      rootPath: join(__dirname, '.', 'public'),
      exclude: ['/api/(.*)'],
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: config.mysql.host,
      port: config.mysql.port,
      username: config.mysql.username,
      password: config.mysql.password,
      database: config.mysql.database,
      entities: [
        // API Entities
        Log,
        Auction,
        DailyAuction,
        User,
        AuctionTracker,
        // Quarm Entities
        Item,
        SpellNew,
        Npc,
        Spawn,
        SpawnGroup,
        SpawnEntry,
        LootTable,
        LootTableEntry,
        LootDrop,
        LootDropEntry,
        MerchantEntry,
        Zone,
        Rule,
        SkillCap,
      ],
      migrationsRun: true,
      migrations: ['dist/migrations/*{.ts,.js}'],
      logging: ['error', 'warn'],
      synchronize: true,
    }),
  ],
})
export class AppModule {}
