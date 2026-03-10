import { AppDataSource } from "../config/database";
import { Phase } from "../entities/phase.entity";
import { Team } from "../entities/teams.entity";
import { Tournament } from "../entities/tournaments.entity";
import { PhaseStatus } from "../enums/phaseStatus";
import { TournamentType } from "../enums/tournamentType";
import { AdvanceToNextPhaseCommand, ClosePhaseCommand, PhaseSummary } from "../models/tournament-engine";
import { FixtureGenerationService } from "./fixture-generation.service";
import { StandingsService } from "./standings.service";
import { TournamentAuthorizationService } from "./tournament-authorization.service";

export class PhaseLifecycleService {
    private authorizationService = new TournamentAuthorizationService();
    private fixtureGenerationService = new FixtureGenerationService();
    private standingsService = new StandingsService();

    private isLastTournamentPhase(phaseId: number, phases: Phase[]) {
        const orderedPhases = [...phases].sort((a, b) => {
            const orderA = a.orderNumber ?? Number.MAX_SAFE_INTEGER;
            const orderB = b.orderNumber ?? Number.MAX_SAFE_INTEGER;
            if (orderA !== orderB) {
                return orderA - orderB;
            }

            return a.id - b.id;
        });

        const lastPhase = orderedPhases[orderedPhases.length - 1];
        return lastPhase?.id === phaseId;
    }

    private resolveChampionFromPhaseMatches(phase: Phase) {
        const participantsById = new Map<number, Team>();

        phase.matches.forEach((match) => {
            participantsById.set(match.homeTeam.id, match.homeTeam);
            participantsById.set(match.awayTeam.id, match.awayTeam);
        });

        const participantTeams = Array.from(participantsById.values());
        const standings = this.standingsService.buildStandingsRows(participantTeams, phase.matches);

        if (standings.length === 0) {
            return undefined;
        }

        const leader = standings[0];
        if (!leader) {
            return undefined;
        }

        const tiedLeaders = standings.filter(
            (row) =>
                row.points === leader.points &&
                row.goalDifference === leader.goalDifference &&
                row.goalsFor === leader.goalsFor,
        );

        if (tiedLeaders.length !== 1) {
            return undefined;
        }

        return participantsById.get(leader.teamId);
    }

    private async maybeGenerateFixtureForPhase(params: {
        tournamentId: number;
        tournamentType: TournamentType;
        requesterUserId: number;
        closedPhaseId: number | null;
        nextPhase: PhaseSummary;
    }) {
        const { tournamentId, tournamentType, requesterUserId, closedPhaseId, nextPhase } = params;

        if (nextPhase.totalMatches > 0) {
            return null;
        }

        const normalizedPhaseName = nextPhase.name.trim().toLowerCase();
        const phaseOrder = nextPhase.orderNumber;
        const isLeaguePhase = normalizedPhaseName.includes("liga");
        const isQuadrangularPhase = normalizedPhaseName.includes("cuadrangular");
        const isFinalPhase = normalizedPhaseName.includes("final");
        const shouldGenerateLeague = phaseOrder === 1 || isLeaguePhase;
        const shouldGenerateQuadrangular = phaseOrder === 2 || isQuadrangularPhase;
        const shouldGenerateFinal = phaseOrder === 3 || isFinalPhase;

        if (
            (tournamentType === TournamentType.LEAGUE || tournamentType === TournamentType.MIXED) &&
            shouldGenerateLeague
        ) {
            return this.fixtureGenerationService.generateLeagueFixture(
                {
                    tournamentId,
                    phaseId: nextPhase.phaseId,
                    doubleRound: true,
                },
                requesterUserId,
            );
        }

        if (tournamentType !== TournamentType.MIXED || closedPhaseId === null) {
            return null;
        }

        if (shouldGenerateQuadrangular) {
            return this.fixtureGenerationService.generateQuadrangular(
                {
                    tournamentId,
                    sourcePhaseId: closedPhaseId,
                    targetPhaseId: nextPhase.phaseId,
                },
                requesterUserId,
            );
        }

        if (shouldGenerateFinal) {
            return this.fixtureGenerationService.generateFinal(
                {
                    tournamentId,
                    sourcePhaseId: closedPhaseId,
                    targetPhaseId: nextPhase.phaseId,
                },
                requesterUserId,
            );
        }

        return null;
    }

    private toPhaseSummary(phase: Phase): PhaseSummary {
        const totalMatches = phase.matches?.length ?? 0;
        const playedMatches = phase.matches?.filter((match) => match.isPlayed).length ?? 0;

        const summary: PhaseSummary = {
            phaseId: phase.id,
            name: phase.name,
            status: phase.status,
            totalMatches,
            playedMatches,
        };

        if (typeof phase.orderNumber !== "undefined") {
            summary.orderNumber = phase.orderNumber;
        }

        return summary;
    }

    async closePhase(command: ClosePhaseCommand, requesterUserId: number) {
        const { phaseId } = command;

        return AppDataSource.transaction(async (manager) => {
            const txPhaseRepository = manager.getRepository(Phase);
            const txTournamentRepository = manager.getRepository(Tournament);
            const phase = await txPhaseRepository.findOne({
                where: { id: phaseId },
                relations: {
                    tournament: {
                        user: true,
                        phases: true,
                    },
                    matches: {
                        homeTeam: true,
                        awayTeam: true,
                    },
                },
            });

            if (!phase) {
                throw new Error("Phase not found");
            }

            this.authorizationService.ensureOwnership(phase.tournament.user.id, requesterUserId);

            if (phase.status === PhaseStatus.CLOSED) {
                return {
                    tournamentId: phase.tournament.id,
                    ...this.toPhaseSummary(phase),
                };
            }

            const totalMatches = phase.matches.length;
            const pendingMatches = phase.matches.filter((match) => !match.isPlayed).length;

            if (totalMatches === 0) {
                throw new Error("Cannot close a phase without matches");
            }

            if (pendingMatches > 0) {
                throw new Error("Cannot close phase with pending matches");
            }

            phase.status = PhaseStatus.CLOSED;
            const savedPhase = await txPhaseRepository.save(phase);

            let championId: number | undefined;
            const shouldResolveChampion = this.isLastTournamentPhase(savedPhase.id, phase.tournament.phases);
            if (shouldResolveChampion) {
                const champion = this.resolveChampionFromPhaseMatches(phase);

                if (champion) {
                    phase.tournament.champion = champion;
                    const savedTournament = await txTournamentRepository.save(phase.tournament);
                    championId = savedTournament.champion?.id;
                }
            }

            return {
                tournamentId: savedPhase.tournament.id,
                championId,
                ...this.toPhaseSummary(savedPhase),
            };
        });
    }

    async advanceToNextPhase(command: AdvanceToNextPhaseCommand, requesterUserId: number) {
        const { tournamentId } = command;

        await this.authorizationService.ensureTournamentOwner(tournamentId, requesterUserId);

        const advanceResult = await AppDataSource.transaction(async (manager) => {
            const txTournamentRepository = manager.getRepository(Tournament);
            const txPhaseRepository = manager.getRepository(Phase);

            const tournament = await txTournamentRepository.findOne({
                where: { id: tournamentId },
                relations: {
                    phases: {
                        matches: true,
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

            const currentIndex = orderedPhases.findIndex((phase) => phase.status === PhaseStatus.IN_PROGRESS);
            const currentPhase = currentIndex >= 0 ? orderedPhases[currentIndex] : undefined;

            if (currentPhase) {
                const pendingMatches = currentPhase.matches.filter((match) => !match.isPlayed).length;
                if (pendingMatches > 0) {
                    throw new Error("Cannot advance phase while current phase has pending matches");
                }

                currentPhase.status = PhaseStatus.CLOSED;
                await txPhaseRepository.save(currentPhase);
            }

            const nextPhase = currentPhase
                ? orderedPhases.slice(currentIndex + 1).find((phase) => phase.status !== PhaseStatus.CLOSED)
                : orderedPhases.find((phase) => phase.status === PhaseStatus.SCHEDULED);

            if (!nextPhase) {
                return {
                    tournamentId,
                    tournamentType: tournament.type,
                    advanced: false,
                    closedPhase: currentPhase ? this.toPhaseSummary(currentPhase) : null,
                    nextPhase: null,
                    message: "No available next phase to advance",
                };
            }

            if (nextPhase.status === PhaseStatus.SCHEDULED) {
                nextPhase.status = PhaseStatus.IN_PROGRESS;
                await txPhaseRepository.save(nextPhase);
            }

            return {
                tournamentId,
                tournamentType: tournament.type,
                advanced: true,
                closedPhase: currentPhase ? this.toPhaseSummary(currentPhase) : null,
                nextPhase: this.toPhaseSummary(nextPhase),
            };
        });

        if (!advanceResult.advanced || !advanceResult.nextPhase) {
            return advanceResult;
        }

        const fixture = await this.maybeGenerateFixtureForPhase({
            tournamentId: advanceResult.tournamentId,
            tournamentType: advanceResult.tournamentType,
            requesterUserId,
            closedPhaseId: advanceResult.closedPhase?.phaseId ?? null,
            nextPhase: advanceResult.nextPhase,
        });

        if (!fixture) {
            return advanceResult;
        }

        return {
            ...advanceResult,
            fixture,
        };
    }
}
