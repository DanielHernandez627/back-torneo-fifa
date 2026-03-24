import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropLocalPasswordFromUsers1773001000000 implements MigrationInterface {
    name = 'DropLocalPasswordFromUsers1773001000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "password" character varying(255)`);
    }
}
