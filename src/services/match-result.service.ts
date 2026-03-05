import { AppDataSource } from "../config/database";
import { Match } from "../entities/matches.entity";
import { PhaseStatus } from "../enums/phaseStatus";
import { RegisterMatchResultCommand } from "../models/tournament-engine";
import { TournamentAuthorizationService } from "./tournament-authorization.service";

export class MatchResultService {
    private authorizationService = new TournamentAuthorizationService();

    private validateNonNegativeScore(value: number, label: string) {
        if (!Number.isInteger(value) || value < 0) {
            throw new Error(`${label} must be an integer greater than or equal to 0`);
        }
    }

    async registerMatchResult(command: RegisterMatchResultCommand, requesterUserId: number) {
        const { matchId, homeTeamScore, awayTeamScore, overwrite = false } = command;

        this.validateNonNegativeScore(homeTeamScore, "homeTeamScore");
        this.validateNonNegativeScore(awayTeamScore, "awayTeamScore");

        return AppDataSource.transaction(async (manager) => {
            const txMatchRepository = manager.getRepository(Match);
            const match = await txMatchRepository.findOne({
                where: { id: matchId },
                relations: {
                    phase: {
                        tournament: {
                            user: true,
                        },
                    },
                    homeTeam: true,
                    awayTeam: true,
                },
            });

            if (!match) {
                throw new Error("Match not found");
            }

            this.authorizationService.ensureOwnership(match.phase.tournament.user.id, requesterUserId);

            if (match.phase.status === PhaseStatus.CLOSED) {
                throw new Error("Cannot register result in a closed phase");
            }

            const alreadyPlayed = match.isPlayed;
            if (alreadyPlayed && !overwrite) {
                throw new Error("Match result already registered. Use overwrite=true to update it");
            }

            match.homeTeamScore = homeTeamScore;
            match.awayTeamScore = awayTeamScore;
            match.isPlayed = true;

            const savedMatch = await txMatchRepository.save(match);

            return {
                id: savedMatch.id,
                phaseId: savedMatch.phase.id,
                homeTeamId: savedMatch.homeTeam.id,
                awayTeamId: savedMatch.awayTeam.id,
                homeTeamScore: savedMatch.homeTeamScore,
                awayTeamScore: savedMatch.awayTeamScore,
                matchday: savedMatch.matchday,
                isPlayed: savedMatch.isPlayed,
                overwritten: alreadyPlayed,
                createdAt: savedMatch.createdAt,
                updatedAt: savedMatch.updatedAt,
            };
        });
    }
}
