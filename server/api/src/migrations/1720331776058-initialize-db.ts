import { MigrationInterface, QueryRunner } from 'typeorm';
import { DatabaseUpdateService } from '../admin/databaseUpdate.service';

export class Initial1720331776058 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const updateService = new DatabaseUpdateService();
    console.log('Initializing');
    await updateService.update();
    console.log('Initialized!');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
