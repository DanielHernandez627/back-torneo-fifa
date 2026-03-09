import { AppDataSource } from "../config/database";
import { Match } from "../entities/matches.entity";
import { Phase } from "../entities/phase.entity";
import { Team } from "../entities/teams.entity";
import { MatchModel } from "../models/match.model";
import { DeepPartial } from "typeorm";
import { PhaseStatus } from "../enums/phaseStatus";
import { TournamentAuthorizationService } from "./tournament-authorization.service";

export class MatchService {
    private matchRepository = AppDataSource.getRepository(Match);
    private phaseRepository = AppDataSource.getRepository(Phase);
    private teamRepository = AppDataSource.getRepository(Team);
    private authorizationService = new TournamentAuthorizationService();

    private toResponse(match: Match) {
        return {
            id: match.id,
            phaseId: match.phase?.id,
            homeTeamId: match.homeTeam?.id,
            homeTeamName: match.homeTeam?.name,
            awayTeamId: match.awayTeam?.id,
            awayTeamName: match.awayTeam?.name,
            homeTeamScore: match.homeTeamScore,
            awayTeamScore: match.awayTeamScore,
            matchday: match.matchday,
            isPlayed: match.isPlayed,
            createdAt: match.createdAt,
            updatedAt: match.updatedAt,
        };
    }

    private validateTeamDifference(homeTeamId: number, awayTeamId: number) {
        if (homeTeamId === awayTeamId) {
            throw new Error("Home team and away team must be different");
        }
    }

    private validateScoreValues(homeTeamScore?: number, awayTeamScore?: number) {
        const hasHome = typeof homeTeamScore !== "undefined";
        const hasAway = typeof awayTeamScore !== "undefined";

        if (hasHome !== hasAway) {
            throw new Error("Both scores must be provided together");
        }

        if (hasHome && hasAway && (homeTeamScore < 0 || awayTeamScore < 0)) {
            throw new Error("Scores must be greater than or equal to 0");
        }
    }

    private resolveIsPlayed(currentIsPlayed: boolean, data: Partial<MatchModel>) {
        if (typeof data.isPlayed !== "undefined") {
            if (
                data.isPlayed &&
                (typeof data.homeTeamScore === "undefined" || typeof data.awayTeamScore === "undefined")
            ) {
                throw new Error("Played matches require both scores");
            }
            return data.isPlayed;
        }

        if (typeof data.homeTeamScore !== "undefined" && typeof data.awayTeamScore !== "undefined") {
            return true;
        }

        return currentIsPlayed;
    }

    private async loadPhaseWithTournament(phaseId: number) {
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

        return phase;
    }

    private async loadTeamWithTournament(teamId: number, label: "Home" | "Away") {
        const team = await this.teamRepository.findOne({
            where: { id: teamId },
            relations: { tournament: true },
        });

        if (!team) {
            throw new Error(`${label} team not found`);
        }

        return team;
    }

    private ensurePhaseIsMutable(phase: Phase) {
        if (phase.status === PhaseStatus.CLOSED) {
            throw new Error("Cannot modify matches in a closed phase");
        }
    }

    private ensureTeamsBelongToPhaseTournament(phase: Phase, homeTeam: Team, awayTeam: Team) {
        const tournamentId = phase.tournament.id;

        if (homeTeam.tournament.id !== tournamentId || awayTeam.tournament.id !== tournamentId) {
            throw new Error("Teams must belong to the same tournament as the phase");
        }
    }

    async getAllMatches(params?: {
        requesterUserId?: number;
        phaseId?: number;
        groupByMatchday?: boolean;
    }) {
        const requesterUserId = params?.requesterUserId;
        const phaseId = params?.phaseId;
        const groupByMatchday = params?.groupByMatchday ?? true;

        const options: {
            relations: {
                phase: {
                    tournament: {
                        user: true;
                    };
                };
                homeTeam: true;
                awayTeam: true;
            };
            where?: {
                phase: {
                    tournament: {
                        user: {
                            id: number;
                        };
                    };
                };
            };
        } = {
            relations: {
                phase: {
                    tournament: {
                        user: true,
                    },
                },
                homeTeam: true,
                awayTeam: true,
            },
        };

        if (typeof requesterUserId !== "undefined") {
            options.where = {
                phase: {
                    tournament: {
                        user: {
                            id: requesterUserId,
                        },
                    },
                },
            };
        }

        const matches = await this.matchRepository.find(options);
        const filteredMatches =
            typeof phaseId !== "undefined" ? matches.filter((match) => match.phase?.id === phaseId) : matches;
        const serializedMatches = filteredMatches
            .map((match) => this.toResponse(match))
            .sort((a, b) => {
                const matchdayA = a.matchday ?? Number.MAX_SAFE_INTEGER;
                const matchdayB = b.matchday ?? Number.MAX_SAFE_INTEGER;
                if (matchdayA !== matchdayB) {
                    return matchdayA - matchdayB;
                }

                return a.id - b.id;
            });

        if (!groupByMatchday) {
            return serializedMatches;
        }

        const groupedByMatchday = serializedMatches.reduce<
            Array<{
                matchday: number | null;
                totalMatches: number;
                matches: ReturnType<MatchService["toResponse"]>[];
            }>
        >((accumulator, match) => {
            const key = typeof match.matchday === "number" ? match.matchday : null;
            const group = accumulator.find((item) => item.matchday === key);

            if (group) {
                group.matches.push(match);
                group.totalMatches = group.matches.length;
                return accumulator;
            }

            accumulator.push({
                matchday: key,
                totalMatches: 1,
                matches: [match],
            });

            return accumulator;
        }, []);

        groupedByMatchday.sort((a, b) => {
            const matchdayA = a.matchday ?? Number.MAX_SAFE_INTEGER;
            const matchdayB = b.matchday ?? Number.MAX_SAFE_INTEGER;
            return matchdayA - matchdayB;
        });

        return {
            totalMatches: serializedMatches.length,
            totalMatchdays: groupedByMatchday.length,
            matchdays: groupedByMatchday,
        };
    }

    async getMatchById(id: number, requesterUserId?: number) {
        const match = await this.matchRepository.findOne({
            where: { id },
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

        if (typeof requesterUserId !== "undefined") {
            this.authorizationService.ensureOwnership(match.phase.tournament.user.id, requesterUserId);
        }

        return this.toResponse(match);
    }

    async createMatch(data: MatchModel, requesterUserId?: number) {
        this.validateTeamDifference(data.homeTeamId, data.awayTeamId);
        this.validateScoreValues(data.homeTeamScore, data.awayTeamScore);

        const phase = await this.loadPhaseWithTournament(data.phaseId);

        if (typeof requesterUserId !== "undefined") {
            this.authorizationService.ensureOwnership(phase.tournament.user.id, requesterUserId);
        }

        this.ensurePhaseIsMutable(phase);

        const homeTeam = await this.loadTeamWithTournament(data.homeTeamId, "Home");
        const awayTeam = await this.loadTeamWithTournament(data.awayTeamId, "Away");
        this.ensureTeamsBelongToPhaseTournament(phase, homeTeam, awayTeam);

        const isPlayed = this.resolveIsPlayed(false, data);

        const matchData: DeepPartial<Match> = {
            phase,
            homeTeam,
            awayTeam,
            isPlayed,
        };

        if (typeof data.homeTeamScore !== "undefined") {
            matchData.homeTeamScore = data.homeTeamScore;
        }

        if (typeof data.awayTeamScore !== "undefined") {
            matchData.awayTeamScore = data.awayTeamScore;
        }

        if (typeof data.matchday !== "undefined") {
            matchData.matchday = data.matchday;
        }

        const match = this.matchRepository.create(matchData);

        const savedMatch = await this.matchRepository.save(match);
        return this.getMatchById(savedMatch.id, requesterUserId);
    }

    async updateMatch(id: number, data: Partial<MatchModel>, requesterUserId?: number) {
        const match = await this.matchRepository.findOne({
            where: { id },
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

        if (typeof requesterUserId !== "undefined") {
            this.authorizationService.ensureOwnership(match.phase.tournament.user.id, requesterUserId);
        }

        const nextHomeTeamId = data.homeTeamId ?? match.homeTeam.id;
        const nextAwayTeamId = data.awayTeamId ?? match.awayTeam.id;
        this.validateTeamDifference(nextHomeTeamId, nextAwayTeamId);

        const nextHomeTeamScore =
            typeof data.homeTeamScore !== "undefined" ? data.homeTeamScore : match.homeTeamScore;
        const nextAwayTeamScore =
            typeof data.awayTeamScore !== "undefined" ? data.awayTeamScore : match.awayTeamScore;
        this.validateScoreValues(nextHomeTeamScore, nextAwayTeamScore);

        const targetPhaseId = data.phaseId ?? match.phase.id;
        const targetPhase = await this.loadPhaseWithTournament(targetPhaseId);

        if (typeof requesterUserId !== "undefined") {
            this.authorizationService.ensureOwnership(targetPhase.tournament.user.id, requesterUserId);
        }

        this.ensurePhaseIsMutable(targetPhase);

        const nextHomeTeam = await this.loadTeamWithTournament(nextHomeTeamId, "Home");
        const nextAwayTeam = await this.loadTeamWithTournament(nextAwayTeamId, "Away");
        this.ensureTeamsBelongToPhaseTournament(targetPhase, nextHomeTeam, nextAwayTeam);

        match.phase = targetPhase;
        match.homeTeam = nextHomeTeam;
        match.awayTeam = nextAwayTeam;

        if (typeof data.homeTeamScore !== "undefined") {
            match.homeTeamScore = data.homeTeamScore;
        }
        if (typeof data.awayTeamScore !== "undefined") {
            match.awayTeamScore = data.awayTeamScore;
        }
        if (typeof data.matchday !== "undefined") {
            match.matchday = data.matchday;
        }

        const isPlayedInput: Partial<MatchModel> = {
            ...data,
        };

        if (typeof nextHomeTeamScore !== "undefined") {
            isPlayedInput.homeTeamScore = nextHomeTeamScore;
        }

        if (typeof nextAwayTeamScore !== "undefined") {
            isPlayedInput.awayTeamScore = nextAwayTeamScore;
        }

        match.isPlayed = this.resolveIsPlayed(match.isPlayed, isPlayedInput);

        const updatedMatch = await this.matchRepository.save(match);
        return this.getMatchById(updatedMatch.id, requesterUserId);
    }

    async deleteMatch(id: number, requesterUserId?: number): Promise<void> {
        const match = await this.matchRepository.findOne({
            where: { id },
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

        if (typeof requesterUserId !== "undefined") {
            this.authorizationService.ensureOwnership(match.phase.tournament.user.id, requesterUserId);
        }

        if (match.phase.status === PhaseStatus.CLOSED) {
            throw new Error("Cannot delete matches from a closed phase");
        }

        await this.matchRepository.remove(match);
    }
}
