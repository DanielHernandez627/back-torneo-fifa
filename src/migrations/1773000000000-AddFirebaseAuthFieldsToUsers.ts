import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFirebaseAuthFieldsToUsers1773000000000 implements MigrationInterface {
    name = 'AddFirebaseAuthFieldsToUsers1773000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "firebaseUid" character varying(128)`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_users_firebase_uid" UNIQUE ("firebaseUid")`);
        await queryRunner.query(`ALTER TABLE "users" ADD "provider" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE "users" SET "password" = 'ROLLBACK_PLACEHOLDER' WHERE "password" IS NULL`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "provider"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_users_firebase_uid"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "firebaseUid"`);
    }
}
