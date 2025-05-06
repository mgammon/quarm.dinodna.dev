import axios from 'axios';
import { PassThrough, Stream } from 'stream';
import { config } from '../config';
import { writeFileSync, rmSync } from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';
const tar = require('tar-stream');
const gunzip = require('gunzip-maybe');

export class DatabaseUpdater {
  public async writeDbUpdateFile() {
    const sql = await this.getSqlForUpdate();

    console.log('Writing db-update.sql...');
    rmSync('db-update.sql', { force: true });
    writeFileSync('db-update.sql', sql);
    const fullFilePath = path.resolve('db-update.sql');
    console.log(
      'db-update.sql is available in the API base folder:',
      fullFilePath,
    );
  }

  // Checks if we have quarm data.  If not, downloads the DB dump and runs it, with some changes
  // Creates a TypeOrm datasource outside the app's typeorm module to do this beeefore we initialize our entities
  public async initializeQuarmData(forceUpdate: boolean = false) {
    // Create our data source and query runner
    const appDataSource = await new DataSource({
      type: 'mysql',
      host: config.mysql.host,
      port: config.mysql.port,
      username: config.mysql.username,
      password: config.mysql.password,
      database: config.mysql.database,
      entities: [],
      migrationsRun: false,
      logging: ['error', 'warn'],
      synchronize: false,
    }).initialize();
    const queryRunner = await appDataSource.createQueryRunner();

    // Check if we already have the items table.  If so, we won't update unless forced.
    const hasItemsTable = await queryRunner.hasTable('items');
    if (hasItemsTable && !forceUpdate) {
      console.log('Quarm data already initialized!');
      return;
    }

    // Get the DB update SQL, split it up into each statement, and run them one at a time.
    console.log('Quarm data initializing...');
    const sqlStatements = (await this.getSqlForUpdate()).split(';\n');
    console.log('Running SQL dump...');
    for (const sqlStatement of sqlStatements) {
      await queryRunner.startTransaction();
      await queryRunner.manager.query(sqlStatement);
      await queryRunner.commitTransaction();
    }
    console.log('Finish running SQL dump!');

    // Make sure we close everything out when we're done
    await queryRunner.release();
    await appDataSource.destroy();
    console.log('Quarm data initialized!');
  }

  // Download the DB dump, extract the files
  private async getSqlForUpdate() {
    console.log('Downloading DB dump...');
    const response = await axios.get<Stream>(config.quarmDatabaseDumpUrl, {
      responseType: 'stream',
    });

    console.log('Extracting SQL...');
    return this.extract(response.data);
  }

  // Gets the extract the SQL files and merges them together into a single SQL string to (re)initialize the quarm tables and data
  private async extract(download: Stream) {
    let resolved = false;

    let dropTables: string; // drop the tables provided by the droptables file, plus the missing ones below.
    let dataTables: string; // add the datatables
    let quarmData: string; // add the quarm data (the good stuff like items and npc_types)

    // These are missing from the droptables file.  Sometimes more need to get added when tables get added.
    const dropIfExistsTables = `DROP TABLE IF EXISTS 
      command_settings,
      discord_webhooks,
      launcher,
      launcher_zones,
      logsys_categories,
      rule_sets,
      variables,
      aa_actions,
      aa_effects,
      altadv_vars,
      base_data,
      blocked_spells,
      books,
      char_create_combinations,
      char_create_point_allocations,
      damageshieldtypes,
      doors,
      eqtime,
      faction_list,
      faction_list_mod,
      fishing,
      forage,
      goallists,
      graveyard,
      grid,
      grid_entries,
      ground_spawns,
      horses,
      item_tick,
      items,
      keyring_data,
      level_exp_mods,
      lootdrop,
      lootdrop_entries,
      loottable,
      loottable_entries,
      merchantlist,
      npc_emotes,
      npc_faction,
      npc_faction_entries,
      npc_spells,
      npc_spells_effects,
      npc_spells_effects_entries,
      npc_spells_entries,
      npc_types,
      npc_types_metadata,
      npc_types_tint,
      object,
      pets,
      proximities,
      races,
      rule_values,
      saylink,
      skill_caps,
      skill_difficulty,
      spawn2,
      spawn_condition_values,
      spawn_conditions,
      spawn_events,
      spawnentry,
      spawngroup,
      spells_en,
      spells_new,
      start_zones,
      starting_items,
      titles,
      tradeskill_recipe,
      tradeskill_recipe_entries,
      traps,
      zone,
      zone_points,
      zone_server,
      zone_state_dump,
      zoneserver_auth;\n`;

    return new Promise<string>((resolve) => {
      console.log('Extracting SQL files...');
      const setSqlMode = "SET sql_mode = '';\n";
      const extract = tar.extract();
      extract.on('entry', async (header, stream, next) => {
        stream.on('end', () => next());
        stream.resume();

        if (header.name.includes('drop_system')) {
          dropTables = dropIfExistsTables + (await this.streamToString(stream));
        }
        if (header.name.includes('data_tables')) {
          dataTables = await this.streamToString(stream);
        }
        if (header.name.includes('quarm')) {
          quarmData = await this.streamToString(stream);
        }
        if (dropTables && dataTables && quarmData && !resolved) {
          resolved = true;
          const sql = setSqlMode + dropTables + dataTables + quarmData;
          resolve(sql + postInitializationSql(sql));
        }
      });
      extract.on('finish', () => {});
      download.pipe(gunzip()).pipe(extract);
    });
  }

  private streamToString(stream: PassThrough) {
    const chunks = [];
    return new Promise<string>((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on('error', (err) => reject(err));
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    });
  }
}

const createSearchableField = (
  table: string,
  sourceFieldName: string,
  searchableFieldName: string = 'searchable_name',
) => `
ALTER TABLE ${table} ADD COLUMN ${searchableFieldName} text;
UPDATE ${table} SET ${searchableFieldName} = LOWER(${sourceFieldName});
UPDATE ${table} SET ${searchableFieldName} = REPLACE(${searchableFieldName}, '\\\'', '');
UPDATE ${table} SET ${searchableFieldName} = REPLACE(${searchableFieldName}, '\\\`', '');
UPDATE ${table} SET ${searchableFieldName} = REPLACE(${searchableFieldName}, '#', '');
UPDATE ${table} SET ${searchableFieldName} = TRIM(${searchableFieldName});
CREATE FULLTEXT INDEX ${searchableFieldName}_fulltext ON ${table}(${searchableFieldName});
`;

const createIdField = (table: string) => `
ALTER TABLE ${table} DROP PRIMARY KEY;
ALTER TABLE ${table} ADD id INT PRIMARY KEY AUTO_INCREMENT;`;

const changeEngineToInnoDB = (sql: string) => {
  const tables = sql
    .match(/CREATE TABLE `\w+`*/g)
    .map((match) => match.replace('CREATE TABLE ', '').replaceAll('`', ''));
  console.log(JSON.stringify(tables, null, 2));
  return tables
    .map((table) => `ALTER TABLE ${table} ENGINE=InnoDB;`)
    .join('\n');
};

// should this be made using a migration or at least orm functions?  yeee.  did i?  nah.
const postInitializationSql = (sql: string) => `
/* Change the engine to InnoDB */
${changeEngineToInnoDB(sql)}

/* Clean up names across the DB */
ALTER TABLE items RENAME COLUMN Name TO name;
update items set name = REPLACE(name, '_', ' ');

UPDATE npc_types SET name = REPLACE(name, '_', ' ');
UPDATE npc_types SET maxlevel = IF(maxlevel > 0, maxlevel, level);

/* Add primary keys (missing this on some tables still, whatever; just a convenience thing for making it easier/faster to shit out typeorm entities and queries) */
${createIdField('spawnentry')}
${createIdField('merchantlist')}

/* Items: add auction average fields, make a searchable name, add indexes */
ALTER TABLE items ADD COLUMN average7d INT DEFAULT 0;
ALTER TABLE items ADD COLUMN average30d INT DEFAULT 0;
${createSearchableField('items', 'name')}
ALTER TABLE items ADD INDEX (clickeffect);
ALTER TABLE items ADD INDEX (proceffect);
ALTER TABLE items ADD INDEX (scrolleffect);
ALTER TABLE items ADD INDEX (worneffect);

/* NPC: create a searchable name */
${createSearchableField('npc_types', 'name')}
ALTER TABLE npc_types ADD INDEX (loottable_id);
ALTER TABLE npc_types ADD INDEX (merchant_id);

/* Spells: create a searchable name, remove the blank spell entry */
${createSearchableField('spells_new', 'name')}
DELETE FROM spells_new WHERE id = 0;

/* Zone: create a searchable name */
${createSearchableField('zone', "CONCAT(long_name, ' ', short_name)")}

/* More Indexing */
ALTER TABLE loottable_entries ADD INDEX (loottable_id);
ALTER TABLE loottable_entries ADD INDEX (lootdrop_id);

ALTER TABLE lootdrop_entries ADD INDEX (item_id);
ALTER TABLE lootdrop_entries ADD INDEX (lootdrop_id);

ALTER TABLE spawnentry ADD INDEX (spawngroupID);
ALTER TABLE spawnentry ADD INDEX (npcID);`;
