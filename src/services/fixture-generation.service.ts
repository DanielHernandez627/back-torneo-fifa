import { AppDataSource } from "../config/database";
import { Match } from "../entities/matches.entity";
import { Phase } from "../entities/phase.entity";
import { Team } from "../entities/teams.entity";
import { Tournament } from "../entities/tournaments.entity";
import { PhaseStatus } from "../enums/phaseStatus";
import {
    GenerateFinalCommand,
    GenerateLeagueFixtureCommand,
    GenerateQuadrangularCommand,
} from "../models/tournament-engine";
import { StandingsService } from "./standings.service";
import { TournamentAuthorizationService } from "./tournament-authorization.service";

export class FixtureGenerationService {
    private standingsService = new StandingsService();
    private authorizationService = new TournamentAuthorizationService();

    private ensurePhaseBelongsToTournament(phase: Phase, tournamentId: number) {
        if (phase.tournament.id !== tournamentId) {
            throw new Error("Phase does not belong to tournament");
        }
    }

    private ensureTargetPhaseReady(phase: Phase) {
        if (phase.status === PhaseStatus.CLOSED) {
            throw new Error("Cannot generate fixture for a closed phase");
        }

        if ((phase.matches?.length ?? 0) > 0) {
            throw new Error("Target phase already has matches. Fixture generation is only allowed on empty phases");
        }
    }

    private ensureSourcePhaseCompleted(phase: Phase) {
        if ((phase.matches?.length ?? 0) === 0) {
            throw new Error("Source phase has no matches");
        }

        const pendingMatches = phase.matches.filter((match) => !match.isPlayed);
        if (pendingMatches.length > 0) {
            throw new Error("Source phase has pending matches");
        }
    }

    private buildRoundRobinRounds(teamIds: number[]) {
        const rotation: Array<number | null> = [...teamIds];
        if (rotation.length % 2 !== 0) {
            rotation.push(null);
        }

        const rounds: Array<Array<[number, number]>> = [];
        const totalTeams = rotation.length;
        const roundsCount = totalTeams - 1;
        const matchesPerRound = totalTeams / 2;

        for (let roundIndex = 0; roundIndex < roundsCount; roundIndex++) {
            const roundPairs: Array<[number, number]> = [];

            for (let pairIndex = 0; pairIndex < matchesPerRound; pairIndex++) {
                const home = rotation[pairIndex];
                const away = rotation[totalTeams - 1 - pairIndex];

                if (typeof home === "number" && typeof away === "number") {
                    roundPairs.push([home, away]);
                }
            }

            rounds.push(roundPairs);

            const last = rotation.pop()!;
            rotation.splice(1, 0, last);
        }

        return rounds;
    }

    async generateLeagueFixture(command: GenerateLeagueFixtureCommand, requesterUserId: number) {
        const { tournamentId, phaseId, doubleRound = true } = command;

        return AppDataSource.transaction(async (manager) => {
            const txTournamentRepository = manager.getRepository(Tournament);
            const txPhaseRepository = manager.getRepository(Phase);
            const txMatchRepository = manager.getRepository(Match);

            const tournament = await txTournamentRepository
                .createQueryBuilder("tournament")
                .setLock("pessimistic_write")
                .leftJoinAndSelect("tournament.user", "user")
                .leftJoinAndSelect("tournament.teams", "teams")
                .where("tournament.id = :tournamentId", { tournamentId })
                .getOne();

            if (!tournament) {
                throw new Error("Tournament not found");
            }

            this.authorizationService.ensureOwnership(tournament.user.id, requesterUserId);

            const phase = await txPhaseRepository
                .createQueryBuilder("phase")
                .setLock("pessimistic_write")
                .leftJoinAndSelect("phase.tournament", "phaseTournament")
                .leftJoinAndSelect("phase.matches", "matches")
                .leftJoinAndSelect("matches.homeTeam", "homeTeam")
                .leftJoinAndSelect("matches.awayTeam", "awayTeam")
                .where("phase.id = :phaseId", { phaseId })
                .getOne();

            if (!phase) {
                throw new Error("Phase not found");
            }

            this.ensurePhaseBelongsToTournament(phase, tournament.id);
            this.ensureTargetPhaseReady(phase);

            if (tournament.teams.length < 2) {
                throw new Error("At least 2 teams are required to generate league fixture");
            }

            const rounds = this.buildRoundRobinRounds(tournament.teams.map((team) => team.id));
            const fixtureMatches: Match[] = [];

            rounds.forEach((round, index) => {
                const matchday = index + 1;

                round.forEach(([homeTeamId, awayTeamId]) => {
                    const homeTeam = tournament.teams.find((team) => team.id === homeTeamId);
                    const awayTeam = tournament.teams.find((team) => team.id === awayTeamId);

                    if (!homeTeam || !awayTeam) {
                        throw new Error("Unable to build fixture due to missing team references");
                    }

                    const match = txMatchRepository.create({
                        phase,
                        homeTeam,
                        awayTeam,
                        matchday,
                        isPlayed: false,
                    });

                    fixtureMatches.push(match);
                });
            });

            if (doubleRound) {
                const firstLegMatchdays = rounds.length;

                rounds.forEach((round, index) => {
                    const matchday = firstLegMatchdays + index + 1;

                    round.forEach(([homeTeamId, awayTeamId]) => {
                        const homeTeam = tournament.teams.find((team) => team.id === awayTeamId);
                        const awayTeam = tournament.teams.find((team) => team.id === homeTeamId);

                        if (!homeTeam || !awayTeam) {
                            throw new Error("Unable to build fixture due to missing team references");
                        }

                        const match = txMatchRepository.create({
                            phase,
                            homeTeam,
                            awayTeam,
                            matchday,
                            isPlayed: false,
                        });

                        fixtureMatches.push(match);
                    });
                });
            }

            if (fixtureMatches.length === 0) {
                throw new Error("No matches generated for fixture");
            }

            await txMatchRepository.save(fixtureMatches);

            if (phase.status === PhaseStatus.SCHEDULED) {
                phase.status = PhaseStatus.IN_PROGRESS;
                await txPhaseRepository.save(phase);
            }

            const totalMatchdays = rounds.length * (doubleRound ? 2 : 1);

            return {
                tournamentId,
                phaseId,
                totalTeams: tournament.teams.length,
                totalMatches: fixtureMatches.length,
                totalMatchdays,
                doubleRound,
            };
        });
    }

    async generateQuadrangular(command: GenerateQuadrangularCommand, requesterUserId: number) {
        const { tournamentId, sourcePhaseId, targetPhaseId } = command;

        return AppDataSource.transaction(async (manager) => {
            const txTournamentRepository = manager.getRepository(Tournament);
            const txPhaseRepository = manager.getRepository(Phase);
            const txMatchRepository = manager.getRepository(Match);

            const tournament = await txTournamentRepository
                .createQueryBuilder("tournament")
                .setLock("pessimistic_write")
                .leftJoinAndSelect("tournament.user", "user")
                .leftJoinAndSelect("tournament.teams", "teams")
                .where("tournament.id = :tournamentId", { tournamentId })
                .getOne();

            if (!tournament) {
                throw new Error("Tournament not found");
            }

            this.authorizationService.ensureOwnership(tournament.user.id, requesterUserId);

            const sourcePhase = await txPhaseRepository
                .createQueryBuilder("phase")
                .setLock("pessimistic_write")
                .leftJoinAndSelect("phase.tournament", "phaseTournament")
                .leftJoinAndSelect("phase.matches", "matches")
                .leftJoinAndSelect("matches.homeTeam", "homeTeam")
                .leftJoinAndSelect("matches.awayTeam", "awayTeam")
                .where("phase.id = :sourcePhaseId", { sourcePhaseId })
                .getOne();

            const targetPhase = await txPhaseRepository
                .createQueryBuilder("phase")
                .setLock("pessimistic_write")
                .leftJoinAndSelect("phase.tournament", "phaseTournament")
                .leftJoinAndSelect("phase.matches", "matches")
                .leftJoinAndSelect("matches.homeTeam", "homeTeam")
                .leftJoinAndSelect("matches.awayTeam", "awayTeam")
                .where("phase.id = :targetPhaseId", { targetPhaseId })
                .getOne();

            if (!sourcePhase || !targetPhase) {
                throw new Error("Phase not found");
            }

            this.ensurePhaseBelongsToTournament(sourcePhase, tournament.id);
            this.ensurePhaseBelongsToTournament(targetPhase, tournament.id);
            this.ensureSourcePhaseCompleted(sourcePhase);
            this.ensureTargetPhaseReady(targetPhase);

            const standings = this.standingsService.getSortedStandingsFromPhase(sourcePhase);
            if (standings.length < 4) {
                throw new Error("At least 4 ranked teams are required to generate quadrangular");
            }

            const qualifiedTeamIds = standings.slice(0, 4).map((row) => row.teamId);
            const qualifiedTeams = tournament.teams.filter((team) => qualifiedTeamIds.includes(team.id));

            if (qualifiedTeams.length !== 4) {
                throw new Error("Unable to resolve the 4 qualified teams for quadrangular");
            }

            const rounds = this.buildRoundRobinRounds(qualifiedTeamIds);
            const fixtureMatches: Match[] = [];

            rounds.forEach((round, index) => {
                const matchday = index + 1;

                round.forEach(([homeTeamId, awayTeamId]) => {
                    const homeTeam = qualifiedTeams.find((team) => team.id === homeTeamId);
                    const awayTeam = qualifiedTeams.find((team) => team.id === awayTeamId);

                    if (!homeTeam || !awayTeam) {
                        throw new Error("Unable to build quadrangular fixture due to missing team references");
                    }

                    fixtureMatches.push(
                        txMatchRepository.create({
                            phase: targetPhase,
                            homeTeam,
                            awayTeam,
                            matchday,
                            isPlayed: false,
                        }),
                    );
                });
            });

            const firstLegMatchdays = rounds.length;
            rounds.forEach((round, index) => {
                const matchday = firstLegMatchdays + index + 1;

                round.forEach(([homeTeamId, awayTeamId]) => {
                    const homeTeam = qualifiedTeams.find((team) => team.id === awayTeamId);
                    const awayTeam = qualifiedTeams.find((team) => team.id === homeTeamId);

                    if (!homeTeam || !awayTeam) {
                        throw new Error("Unable to build quadrangular fixture due to missing team references");
                    }

                    fixtureMatches.push(
                        txMatchRepository.create({
                            phase: targetPhase,
                            homeTeam,
                            awayTeam,
                            matchday,
                            isPlayed: false,
                        }),
                    );
                });
            });

            await txMatchRepository.save(fixtureMatches);

            if (targetPhase.status === PhaseStatus.SCHEDULED) {
                targetPhase.status = PhaseStatus.IN_PROGRESS;
                await txPhaseRepository.save(targetPhase);
            }

            return {
                tournamentId,
                sourcePhaseId,
                targetPhaseId,
                qualifiedTeamIds,
                totalMatches: fixtureMatches.length,
                totalMatchdays: firstLegMatchdays * 2,
                doubleRound: true,
            };
        });
    }

    async generateFinal(command: GenerateFinalCommand, requesterUserId: number) {
        const { tournamentId, sourcePhaseId, targetPhaseId } = command;

        return AppDataSource.transaction(async (manager) => {
            const txTournamentRepository = manager.getRepository(Tournament);
            const txPhaseRepository = manager.getRepository(Phase);
            const txMatchRepository = manager.getRepository(Match);

            const tournament = await txTournamentRepository
                .createQueryBuilder("tournament")
                .setLock("pessimistic_write")
                .leftJoinAndSelect("tournament.user", "user")
                .leftJoinAndSelect("tournament.teams", "teams")
                .where("tournament.id = :tournamentId", { tournamentId })
                .getOne();

            if (!tournament) {
                throw new Error("Tournament not found");
            }

            this.authorizationService.ensureOwnership(tournament.user.id, requesterUserId);

            const sourcePhase = await txPhaseRepository
                .createQueryBuilder("phase")
                .setLock("pessimistic_write")
                .leftJoinAndSelect("phase.tournament", "phaseTournament")
                .leftJoinAndSelect("phase.matches", "matches")
                .leftJoinAndSelect("matches.homeTeam", "homeTeam")
                .leftJoinAndSelect("matches.awayTeam", "awayTeam")
                .where("phase.id = :sourcePhaseId", { sourcePhaseId })
                .getOne();

            const targetPhase = await txPhaseRepository
                .createQueryBuilder("phase")
                .setLock("pessimistic_write")
                .leftJoinAndSelect("phase.tournament", "phaseTournament")
                .leftJoinAndSelect("phase.matches", "matches")
                .leftJoinAndSelect("matches.homeTeam", "homeTeam")
                .leftJoinAndSelect("matches.awayTeam", "awayTeam")
                .where("phase.id = :targetPhaseId", { targetPhaseId })
                .getOne();

            if (!sourcePhase || !targetPhase) {
                throw new Error("Phase not found");
            }

            this.ensurePhaseBelongsToTournament(sourcePhase, tournament.id);
            this.ensurePhaseBelongsToTournament(targetPhase, tournament.id);
            this.ensureSourcePhaseCompleted(sourcePhase);
            this.ensureTargetPhaseReady(targetPhase);

            const standings = this.standingsService.getSortedStandingsFromPhase(sourcePhase);
            if (standings.length < 2) {
                throw new Error("At least 2 ranked teams are required to generate final");
            }

            const finalistIds = standings.slice(0, 2).map((row) => row.teamId);
            const homeTeam = tournament.teams.find((team) => team.id === finalistIds[0]);
            const awayTeam = tournament.teams.find((team) => team.id === finalistIds[1]);

            if (!homeTeam || !awayTeam) {
                throw new Error("Unable to resolve finalists for final");
            }

            const finalMatches = [
                txMatchRepository.create({
                    phase: targetPhase,
                    homeTeam,
                    awayTeam,
                    matchday: 1,
                    isPlayed: false,
                }),
                txMatchRepository.create({
                    phase: targetPhase,
                    homeTeam: awayTeam,
                    awayTeam: homeTeam,
                    matchday: 2,
                    isPlayed: false,
                }),
            ];

            await txMatchRepository.save(finalMatches);

            if (targetPhase.status === PhaseStatus.SCHEDULED) {
                targetPhase.status = PhaseStatus.IN_PROGRESS;
                await txPhaseRepository.save(targetPhase);
            }

            return {
                tournamentId,
                sourcePhaseId,
                targetPhaseId,
                finalistIds,
                totalMatches: finalMatches.length,
                totalMatchdays: 2,
                doubleRound: true,
            };
        });
    }
}
