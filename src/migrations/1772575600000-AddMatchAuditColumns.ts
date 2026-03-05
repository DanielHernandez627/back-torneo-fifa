import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMatchAuditColumns1772575600000 implements MigrationInterface {
    name = 'AddMatchAuditColumns1772575600000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "matches" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "matches" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "matches" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "matches" DROP COLUMN "created_at"`);
    }
}
