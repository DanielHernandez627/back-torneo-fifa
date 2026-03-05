import { AppDataSource } from "../config/database";
import { Match } from "../entities/matches.entity";
import { Phase } from "../entities/phase.entity";
import { Tournament } from "../entities/tournaments.entity";

export class TournamentAuthorizationService {
    private tournamentRepository = AppDataSource.getRepository(Tournament);
    private phaseRepository = AppDataSource.getRepository(Phase);
    private matchRepository = AppDataSource.getRepository(Match);

    ensureOwnership(ownerUserId: number, requesterUserId: number) {
        if (ownerUserId !== requesterUserId) {
            throw new Error("Forbidden: you are not the owner of this tournament");
        }
    }

    async ensureTournamentOwner(tournamentId: number, requesterUserId: number) {
        const tournament = await this.tournamentRepository.findOne({
            where: { id: tournamentId },
            relations: { user: true },
        });

        if (!tournament) {
            throw new Error("Tournament not found");
        }

        this.ensureOwnership(tournament.user.id, requesterUserId);
    }

    async ensurePhaseOwner(phaseId: number, requesterUserId: number) {
        const phase = await this.phaseRepository.findOne({
            where: { id: phaseId },
            relations: {
                tournament: {
                    user: true,
                },
            },
        });

        if (!phase) {
            throw new Error("Phase not found");
        }

        this.ensureOwnership(phase.tournament.user.id, requesterUserId);
    }

    async ensureMatchOwner(matchId: number, requesterUserId: number) {
        const match = await this.matchRepository.findOne({
            where: { id: matchId },
            relations: {
                phase: {
                    tournament: {
                        user: true,
                    },
                },
            },
        });

        if (!match) {
            throw new Error("Match not found");
        }

        this.ensureOwnership(match.phase.tournament.user.id, requesterUserId);
    }
}
