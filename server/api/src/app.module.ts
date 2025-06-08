import { CallHandler, ExecutionContext, Injectable, Module, NestInterceptor } from '@nestjs/common';
import { Log } from './logs/log.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Auction, DailyAuction } from './auctions/auction.entity';
import { ItemModule } from './items/item.module';
import { Item, LootDrop, LootDropEntry, LootTable, LootTableEntry } from './items/item.entity';
import { MerchantEntry, Npc, Spawn, SpawnEntry, SpawnGroup } from './npcs/npc.entity';
import { NpcModule } from './npcs/npc.module';
import { SpellNew } from './spells/spell-new.entity';
import { SpellModule } from './spells/spell.module';
import { Zone } from './zones/zone.entity';
import { ZoneModule } from './zones/zone.module';
import { EventsModule } from './events/events.module';
import { Rule } from './npcs/rule.entity';
import { AdminModule } from './admin/admin.module';
import { config } from './config';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { LogModule } from './logs/log.module';
import { LocationModule } from './location/location.module';
import { ScheduleModule } from '@nestjs/schedule';
import { PlayerModule } from './player/player.module';
import { SkillCap } from './player/skill-cap.entity';
import { FeedbackModule } from './feedback/feedback.module';
import { NpcSpellsEntry, NpcSpells } from './spells/npc-spells.entity';
import { Character, InventorySlot, Verification } from './characters/character.entity';
import { CharacterModule } from './characters/character.module';
import { ItemTracker } from './item-trackers/item-tracker.entity';
import { ItemTrackerModule } from './item-trackers/item-tracker.module';
import { KeyValueModule } from './key-value/key-value-module';
import { KeyValue } from './key-value/key-value';
import { DatabaseUpdater } from './admin/database-updater';
import { UserModule } from './user/user.module';
import { User } from './user/user.entity';
import { UserService } from './user/user.service';
import { APP_INTERCEPTOR } from '@nestjs/core';

// Fixes a dumb encoding issue trying to run a DB dump for an old-ass game
const nodeModulesFolder = config.isProd ? '/dist/node_modules/' : '../node_modules';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const encodingCharset = require(`${nodeModulesFolder}/mysql2/lib/constants/encoding_charset`);
encodingCharset.utf8mb3 = 192;

//TODO: Migrate apiKey to userId!!!!
//TODO: Migrate apiKey to userId!!!!
//TODO: Migrate apiKey to userId!!!!
//TODO: Migrate apiKey to userId!!!!
//TODO: Migrate apiKey to userId!!!!
//TODO: Migrate apiKey to userId!!!!
//TODO: Migrate apiKey to userId!!!!

@Injectable()
export class GetUserInterceptor implements NestInterceptor {
  constructor(private readonly userService: UserService) {}

  async intercept(context: ExecutionContext, handler: CallHandler) {
    try {
      const apiKey: string | null = context.getArgs()[0]?.headers?.authorization?.split(' ')[1];
      if (!apiKey) {
        return handler.handle();
      }
      const user = this.userService.getUserFromApiKey(apiKey);
      if (!user) {
        return handler.handle();
      }
      const request = context.switchToHttp().getRequest();
      request.user = user;
    } catch (error) {
      console.log('Error', error);
    }
    return handler.handle();
  }
}

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: GetUserInterceptor,
    },
  ],
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
    CharacterModule,
    ItemTrackerModule,
    KeyValueModule,
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '.', 'public'),
      exclude: ['/api/(.*)'],
    }),
    TypeOrmModule.forRootAsync({
      // First, make sure we have the quarm DB dump on the server
      // Thennnn initialize our typeorm module, which synchronizes our entities (not the quarm DB entities)
      useFactory: async () => {
        await new DatabaseUpdater().initializeQuarmData();
        return {
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
            Verification,
            Character,
            InventorySlot,
            ItemTracker,
            KeyValue,
            User,
            // Quarm Entities
            Item,
            SpellNew,
            Npc,
            Spawn,
            SpawnGroup,
            SpawnEntry,
            NpcSpells,
            NpcSpellsEntry,
            LootTable,
            LootTableEntry,
            LootDrop,
            LootDropEntry,
            MerchantEntry,
            Zone,
            Rule,
            SkillCap,
          ],
          migrationsRun: false,
          logging: ['error', 'warn'],
          synchronize: true,
        };
      },
    }),
  ],
})
export class AppModule {}
