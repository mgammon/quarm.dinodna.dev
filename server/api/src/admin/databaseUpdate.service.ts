import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { PassThrough, Stream } from 'stream';
import { config } from '../config';
import { writeFileSync, rmSync } from 'fs';
const tar = require('tar-stream');
const gunzip = require('gunzip-maybe');

@Injectable()
export class DatabaseUpdateService {
  async update() {
    // Download
    console.log('Downloading DB dump...');
    const response = await axios.get<Stream>(config.quarmDatabaseDumpUrl, {
      responseType: 'stream',
    });

    // Extract
    const sql = await this.extract(response.data);

    // Write the SQL out to a file
    return this.writeSqlUpdate(sql);
  }

  private async extract(download: Stream) {
    let dropTables: string;
    let dataTables: string;
    let quarmData: string;
    let resolved = false;

    return new Promise<string>((resolve) => {
      console.log('Extracting SQL files...');
      const extract = tar.extract();
      extract.on('entry', async (header, stream, next) => {
        stream.on('end', () => next());
        stream.resume();

        if (header.name.includes('drop_system')) {
          dropTables = await this.streamToString(stream);
        }
        if (header.name.includes('data_tables')) {
          dataTables = await this.streamToString(stream);
        }
        if (header.name.includes('quarm')) {
          quarmData = await this.streamToString(stream);
        }
        if (dropTables && dataTables && quarmData && !resolved) {
          resolved = true;
          resolve(dropTables + dataTables + quarmData);
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

  private async writeSqlUpdate(sql: string) {
    console.log('Writing raw SQL');

    const dropTables = `DROP TABLE IF EXISTS 
    command_settings,
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
      zoneserver_auth; \n
      `;

    // This makes it compatible with SQL.  Probs should just use MariaDB, but I'M TOO FAR IN
    const fixedSql = sql
      .replaceAll(/\/\*.*\*\/(;)?/g, '')
      .replaceAll('0000-00-00 00:00:00', '1337-01-01 01:01:01');

    rmSync('db-update.sql', { force: true });
    writeFileSync('db-update.sql', dropTables + fixedSql + cleanUpDatabaseSql);

    console.log('Done writing SQL file');
  }
}

const cleanUpDatabaseSql = `

alter table items
    CHANGE Name name varchar(64) NOT NULL; 
ALTER TABLE items ADD COLUMN average7d INT DEFAULT 0;
ALTER TABLE items ADD COLUMN average30d INT DEFAULT 0;

UPDATE items
    SET name = replace(name, '_', ' ');

UPDATE npc_types
    SET name = replace(name, '_', ' ');

UPDATE npc_types
    SET maxlevel = IF(maxlevel > 0, maxlevel, level);

/* Add primary keys (missing this on some tables, will find on the next import) */
ALTER TABLE spawnentry DROP PRIMARY KEY;
ALTER TABLE spawnentry ADD id INT PRIMARY KEY AUTO_INCREMENT;
ALTER TABLE merchantlist DROP PRIMARY KEY;
ALTER TABLE merchantlist ADD id INT PRIMARY KEY AUTO_INCREMENT;
ALTER TABLE skill_caps DROP PRIMARY KEY;
ALTER TABLE skill_caps ADD id INT PRIMARY KEY AUTO_INCREMENT;

/* Items search */
ALTER TABLE items ENGINE = InnoDB;
ALTER TABLE items ADD COLUMN searchable_name text;
UPDATE items SET searchable_name = LOWER(name);
UPDATE items SET searchable_name = replace(searchable_name, '\\\'', '');
UPDATE items SET searchable_name = replace(searchable_name, '\\\`', '');
UPDATE items SET searchable_name = replace(searchable_name, '#', '');
UPDATE items SET searchable_name = TRIM(searchable_name);
CREATE FULLTEXT INDEX searchable_name_fulltext ON items(searchable_name);

/* NPC search */
ALTER TABLE npc_types ENGINE = InnoDB;
ALTER TABLE npc_types ADD COLUMN searchable_name text;
UPDATE npc_types SET searchable_name = LOWER(name);
UPDATE npc_types SET searchable_name = replace(searchable_name, '\\\'', '');
UPDATE npc_types SET searchable_name = replace(searchable_name, '\\\`', '');
UPDATE npc_types SET searchable_name = replace(searchable_name, '#', '');
UPDATE npc_types SET searchable_name = TRIM(searchable_name);
CREATE FULLTEXT INDEX searchable_name_fulltext ON npc_types(searchable_name);

/* Spell search */
ALTER TABLE spells_new ENGINE = InnoDB;
ALTER TABLE spells_new ADD COLUMN searchable_name text;
UPDATE spells_new SET searchable_name = LOWER(name);
UPDATE spells_new SET searchable_name = replace(searchable_name, '\\\'', '');
UPDATE spells_new SET searchable_name = replace(searchable_name, '\\\`', '');
UPDATE spells_new SET searchable_name = replace(searchable_name, '#', '');
UPDATE spells_new SET searchable_name = TRIM(searchable_name);
CREATE FULLTEXT INDEX searchable_name_fulltext ON spells_new(searchable_name);
/* Blank Spell */
DELETE FROM spells_new WHERE id = 0;

/* Zone search */
ALTER TABLE zone ENGINE = InnoDB;
ALTER TABLE zone ADD COLUMN searchable_name text;
UPDATE zone SET searchable_name = LOWER(CONCAT(long_name, ' ', short_name));
UPDATE zone SET searchable_name = replace(searchable_name, '\\\'', '');
CREATE FULLTEXT INDEX searchable_name_fulltext ON zone(searchable_name);

/* Indexing */
ALTER TABLE npc_types
    ADD INDEX (loottable_id);
ALTER TABLE npc_types
    ADD INDEX (merchant_id);

ALTER TABLE items
    ADD INDEX (clickeffect);
ALTER TABLE items
    ADD INDEX (proceffect);
ALTER TABLE items
    ADD INDEX (scrolleffect);
ALTER TABLE items
    ADD INDEX (worneffect);

ALTER TABLE loottable_entries
    ADD INDEX (loottable_id);
ALTER TABLE loottable_entries
    ADD INDEX (lootdrop_id);

ALTER TABLE lootdrop_entries
    ADD INDEX (item_id);
ALTER TABLE lootdrop_entries
    ADD INDEX (lootdrop_id);

ALTER TABLE spawnentry
    ADD INDEX (spawngroupID);
ALTER TABLE spawnentry
    ADD INDEX (npcID);

    `;
