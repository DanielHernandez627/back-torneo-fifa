import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1772568693330 implements MigrationInterface {
    name = 'InitSchema1772568693330'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "phases" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "orderNumber" integer, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tournamentId" integer, CONSTRAINT "PK_e93bb53460b28d4daf72735d5d3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "matches" ("id" SERIAL NOT NULL, "homeTeamScore" integer, "awayTeamScore" integer, "matchday" integer, "isPlayed" boolean NOT NULL DEFAULT false, "phaseId" integer, "homeTeamId" integer, "awayTeamId" integer, CONSTRAINT "PK_8a22c7b2e0828988d51256117f4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "teams" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tournamentId" integer, CONSTRAINT "PK_7e5523774a38b08a6236d322403" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."tournaments_type_enum" AS ENUM('LIGA', 'CUADRANGULAR', 'MIXTO')`);
        await queryRunner.query(`CREATE TABLE "tournaments" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "type" "public"."tournaments_type_enum" NOT NULL DEFAULT 'LIGA', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "userId" integer, "championId" integer, CONSTRAINT "PK_6d5d129da7a80cf99e8ad4833a9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "username" character varying(60) NOT NULL, "email" character varying(255) NOT NULL, "password" character varying(255) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "phases" ADD CONSTRAINT "FK_d1539188a26b06740aa56f83b3a" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "matches" ADD CONSTRAINT "FK_c549df0afe669309f259354778e" FOREIGN KEY ("phaseId") REFERENCES "phases"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "matches" ADD CONSTRAINT "FK_999a74ecaebaf96816112445a09" FOREIGN KEY ("homeTeamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "matches" ADD CONSTRAINT "FK_c5505de389fa5fca7ddce29fa49" FOREIGN KEY ("awayTeamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "teams" ADD CONSTRAINT "FK_f09b3fd06a61a5c842d3a8e0dee" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tournaments" ADD CONSTRAINT "FK_1785d4907599f1662fb41253a72" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tournaments" ADD CONSTRAINT "FK_6aee6103d45e551441c2191fd08" FOREIGN KEY ("championId") REFERENCES "teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tournaments" DROP CONSTRAINT "FK_6aee6103d45e551441c2191fd08"`);
        await queryRunner.query(`ALTER TABLE "tournaments" DROP CONSTRAINT "FK_1785d4907599f1662fb41253a72"`);
        await queryRunner.query(`ALTER TABLE "teams" DROP CONSTRAINT "FK_f09b3fd06a61a5c842d3a8e0dee"`);
        await queryRunner.query(`ALTER TABLE "matches" DROP CONSTRAINT "FK_c5505de389fa5fca7ddce29fa49"`);
        await queryRunner.query(`ALTER TABLE "matches" DROP CONSTRAINT "FK_999a74ecaebaf96816112445a09"`);
        await queryRunner.query(`ALTER TABLE "matches" DROP CONSTRAINT "FK_c549df0afe669309f259354778e"`);
        await queryRunner.query(`ALTER TABLE "phases" DROP CONSTRAINT "FK_d1539188a26b06740aa56f83b3a"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "tournaments"`);
        await queryRunner.query(`DROP TYPE "public"."tournaments_type_enum"`);
        await queryRunner.query(`DROP TABLE "teams"`);
        await queryRunner.query(`DROP TABLE "matches"`);
        await queryRunner.query(`DROP TABLE "phases"`);
    }

}
