import { AppDataSource } from "../config/database";
import { Team } from "../entities/teams.entity";
import { Tournament } from "../entities/tournaments.entity";
import { User } from "../entities/user.entity";
import {
    AdvanceToNextPhaseCommand,
    ClosePhaseCommand,
    GenerateFinalCommand,
    GenerateLeagueFixtureCommand,
    GenerateQuadrangularCommand,
    RegisterMatchResultCommand,
} from "../models/tournament-engine";
import { TournamentModel } from "../models/tournament.model";
import { DeepPartial } from "typeorm";
import { TournamentAuthorizationService } from "./tournament-authorization.service";
import { FixtureGenerationService } from "./fixture-generation.service";
import { MatchResultService } from "./match-result.service";
import { PhaseLifecycleService } from "./phase-lifecycle.service";
import { StandingsService } from "./standings.service";
import { PhaseStatus } from "../enums/phaseStatus";

export class TournamentService {
    private tournamentRepository = AppDataSource.getRepository(Tournament);
    private userRepository = AppDataSource.getRepository(User);
    private teamRepository = AppDataSource.getRepository(Team);

    private authorizationService = new TournamentAuthorizationService();
    private fixtureGenerationService = new FixtureGenerationService();
    private matchResultService = new MatchResultService();
    private phaseLifecycleService = new PhaseLifecycleService();
    private standingsService = new StandingsService();

    private toResponse(tournament: Tournament) {
        return {
            id: tournament.id,
            name: tournament.name,
            type: tournament.type,
            userId: tournament.user?.id,
            championId: tournament.champion?.id,
            createdAt: tournament.createdAt,
            updatedAt: tournament.updatedAt,
        };
    }

    async getAllTournaments(requesterUserId?: number) {
        const options: {
            relations: {
                user: true;
                champion: true;
            };
            where?: {
                user: {
                    id: number;
                };
            };
        } = {
            relations: {
                user: true,
                champion: true,
            },
        };

        if (typeof requesterUserId !== "undefined") {
            options.where = { user: { id: requesterUserId } };
        }

        const tournaments = await this.tournamentRepository.find(options);

        return tournaments.map((tournament) => this.toResponse(tournament));
    }

    async getTournamentById(id: number, requesterUserId?: number) {
        const tournament = await this.tournamentRepository.findOne({
            where: { id },
            relations: {
                user: true,
                champion: true,
            },
        });

        if (!tournament) {
            throw new Error("Tournament not found");
        }

        if (typeof requesterUserId !== "undefined") {
            this.authorizationService.ensureOwnership(tournament.user.id, requesterUserId);
        }

        return this.toResponse(tournament);
    }

    async createTournament(data: TournamentModel, requesterUserId?: number) {
        const ownerUserId = typeof requesterUserId !== "undefined" ? requesterUserId : data.userId;
        const user = await this.userRepository.findOneBy({ id: ownerUserId });
        if (!user) {
            throw new Error("User not found");
        }

        let champion: Team | undefined;
        if (data.championId) {
            const championTeam = await this.teamRepository.findOneBy({ id: data.championId });
            if (!championTeam) {
                throw new Error("Champion team not found");
            }
            champion = championTeam;
        }

        const tournamentData: DeepPartial<Tournament> = {
            name: data.name,
            type: data.type,
            user,
        };

        if (champion) {
            tournamentData.champion = champion;
        }

        const tournament = this.tournamentRepository.create(tournamentData);

        const savedTournament = await this.tournamentRepository.save(tournament);
        return this.getTournamentById(savedTournament.id, requesterUserId);
    }

    async updateTournament(id: number, data: Partial<TournamentModel>, requesterUserId?: number) {
        if (typeof requesterUserId !== "undefined") {
            await this.authorizationService.ensureTournamentOwner(id, requesterUserId);
        }

        const tournament = await this.tournamentRepository.findOne({
            where: { id },
            relations: {
                user: true,
                champion: true,
            },
        });

        if (!tournament) {
            throw new Error("Tournament not found");
        }

        if (data.name) tournament.name = data.name;
        if (data.type) tournament.type = data.type;

        if (data.userId) {
            const user = await this.userRepository.findOneBy({ id: data.userId });
            if (!user) {
                throw new Error("User not found");
            }
            tournament.user = user;
        }

        if (data.championId) {
            const champion = await this.teamRepository.findOneBy({ id: data.championId });
            if (!champion) {
                throw new Error("Champion team not found");
            }
            tournament.champion = champion;
        }

        const updatedTournament = await this.tournamentRepository.save(tournament);
        return this.getTournamentById(updatedTournament.id, requesterUserId);
    }

    async deleteTournament(id: number, requesterUserId?: number): Promise<void> {
        if (typeof requesterUserId !== "undefined") {
            await this.authorizationService.ensureTournamentOwner(id, requesterUserId);
        }

        const tournament = await this.tournamentRepository.findOneBy({ id });
        if (!tournament) {
            throw new Error("Tournament not found");
        }

        await this.tournamentRepository.remove(tournament);
    }

    async generateLeagueFixture(command: GenerateLeagueFixtureCommand, requesterUserId: number) {
        return this.fixtureGenerationService.generateLeagueFixture(command, requesterUserId);
    }

    async generateQuadrangular(command: GenerateQuadrangularCommand, requesterUserId: number) {
        return this.fixtureGenerationService.generateQuadrangular(command, requesterUserId);
    }

    async generateFinal(command: GenerateFinalCommand, requesterUserId: number) {
        return this.fixtureGenerationService.generateFinal(command, requesterUserId);
    }

    async registerMatchResult(command: RegisterMatchResultCommand, requesterUserId: number) {
        return this.matchResultService.registerMatchResult(command, requesterUserId);
    }

    async getStandings(tournamentId: number, requesterUserId?: number) {
        if (typeof requesterUserId !== "undefined") {
            await this.authorizationService.ensureTournamentOwner(tournamentId, requesterUserId);
        }

        const tournament = await this.tournamentRepository.findOne({
            where: { id: tournamentId },
            relations: {
                teams: true,
                phases: {
                    matches: {
                        homeTeam: true,
                        awayTeam: true,
                    },
                },
            },
        });

        if (!tournament) {
            throw new Error("Tournament not found");
        }

        if ((tournament.phases?.length ?? 0) === 0) {
            throw new Error("Tournament has no phases");
        }

        const orderedPhases = [...tournament.phases].sort((a, b) => {
            const orderA = a.orderNumber ?? Number.MAX_SAFE_INTEGER;
            const orderB = b.orderNumber ?? Number.MAX_SAFE_INTEGER;
            if (orderA !== orderB) {
                return orderA - orderB;
            }
            return a.id - b.id;
        });

        const activePhase = orderedPhases.find((phase) => phase.status === PhaseStatus.IN_PROGRESS);
        const latestWithMatches = [...orderedPhases]
            .reverse()
            .find((phase) => (phase.matches?.length ?? 0) > 0);
        const targetPhase = activePhase ?? latestWithMatches ?? orderedPhases[0];

        if (!targetPhase) {
            throw new Error("Unable to resolve target phase for standings");
        }

        const participantIds = new Set<number>();
        targetPhase.matches.forEach((match) => {
            participantIds.add(match.homeTeam.id);
            participantIds.add(match.awayTeam.id);
        });

        const participantTeams =
            participantIds.size > 0 ? tournament.teams.filter((team) => participantIds.has(team.id)) : tournament.teams;

        const standings = this.standingsService.buildStandingsRows(participantTeams, targetPhase.matches);

        return {
            tournamentId,
            phaseId: targetPhase.id,
            phaseName: targetPhase.name,
            phaseStatus: targetPhase.status,
            standings,
        };
    }

    async closePhase(command: ClosePhaseCommand, requesterUserId: number) {
        return this.phaseLifecycleService.closePhase(command, requesterUserId);
    }

    async advanceToNextPhase(command: AdvanceToNextPhaseCommand, requesterUserId: number) {
        return this.phaseLifecycleService.advanceToNextPhase(command, requesterUserId);
    }
}
