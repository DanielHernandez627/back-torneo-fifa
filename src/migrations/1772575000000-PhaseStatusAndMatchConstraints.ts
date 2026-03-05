import { MigrationInterface, QueryRunner } from "typeorm";

export class PhaseStatusAndMatchConstraints1772575000000 implements MigrationInterface {
    name = 'PhaseStatusAndMatchConstraints1772575000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."phases_status_enum" AS ENUM('scheduled', 'in_progress', 'closed')`);
        await queryRunner.query(`ALTER TABLE "phases" ADD "status" "public"."phases_status_enum" NOT NULL DEFAULT 'scheduled'`);

        await queryRunner.query(`ALTER TABLE "matches" ADD CONSTRAINT "CHK_matches_home_score_non_negative" CHECK ("homeTeamScore" IS NULL OR "homeTeamScore" >= 0)`);
        await queryRunner.query(`ALTER TABLE "matches" ADD CONSTRAINT "CHK_matches_away_score_non_negative" CHECK ("awayTeamScore" IS NULL OR "awayTeamScore" >= 0)`);
        await queryRunner.query(`ALTER TABLE "matches" ADD CONSTRAINT "CHK_matches_matchday_positive" CHECK ("matchday" IS NULL OR "matchday" >= 1)`);
        await queryRunner.query(`ALTER TABLE "matches" ADD CONSTRAINT "CHK_matches_different_teams" CHECK ("homeTeamId" <> "awayTeamId")`);
        await queryRunner.query(`ALTER TABLE "matches" ADD CONSTRAINT "CHK_matches_played_has_scores" CHECK (NOT "isPlayed" OR ("homeTeamScore" IS NOT NULL AND "awayTeamScore" IS NOT NULL))`);
        await queryRunner.query(`ALTER TABLE "matches" ADD CONSTRAINT "UQ_matches_phase_home_away" UNIQUE ("phaseId", "homeTeamId", "awayTeamId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "matches" DROP CONSTRAINT "UQ_matches_phase_home_away"`);
        await queryRunner.query(`ALTER TABLE "matches" DROP CONSTRAINT "CHK_matches_played_has_scores"`);
        await queryRunner.query(`ALTER TABLE "matches" DROP CONSTRAINT "CHK_matches_different_teams"`);
        await queryRunner.query(`ALTER TABLE "matches" DROP CONSTRAINT "CHK_matches_matchday_positive"`);
        await queryRunner.query(`ALTER TABLE "matches" DROP CONSTRAINT "CHK_matches_away_score_non_negative"`);
        await queryRunner.query(`ALTER TABLE "matches" DROP CONSTRAINT "CHK_matches_home_score_non_negative"`);

        await queryRunner.query(`ALTER TABLE "phases" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."phases_status_enum"`);
    }
}
