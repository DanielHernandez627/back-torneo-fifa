import { AppDataSource } from "../config/database";
import { Match } from "../entities/matches.entity";
import { Phase } from "../entities/phase.entity";
import { Team } from "../entities/teams.entity";
import { MatchModel } from "../models/match.model";
import { DeepPartial } from "typeorm";

export class MatchService {
    private matchRepository = AppDataSource.getRepository(Match);
    private phaseRepository = AppDataSource.getRepository(Phase);
    private teamRepository = AppDataSource.getRepository(Team);

    private toResponse(match: Match) {
        return {
            id: match.id,
            phaseId: match.phase?.id,
            homeTeamId: match.homeTeam?.id,
            awayTeamId: match.awayTeam?.id,
            homeTeamScore: match.homeTeamScore,
            awayTeamScore: match.awayTeamScore,
            matchday: match.matchday,
            isPlayed: match.isPlayed,
        };
    }

    async getAllMatches() {
        const matches = await this.matchRepository.find({
            relations: {
                phase: true,
                homeTeam: true,
                awayTeam: true,
            },
        });

        return matches.map((match) => this.toResponse(match));
    }

    async getMatchById(id: number) {
        const match = await this.matchRepository.findOne({
            where: { id },
            relations: {
                phase: true,
                homeTeam: true,
                awayTeam: true,
            },
        });

        if (!match) {
            throw new Error("Match not found");
        }

        return this.toResponse(match);
    }

    async createMatch(data: MatchModel) {
        if (data.homeTeamId === data.awayTeamId) {
            throw new Error("Home team and away team must be different");
        }

        const phase = await this.phaseRepository.findOneBy({ id: data.phaseId });
        if (!phase) {
            throw new Error("Phase not found");
        }

        const homeTeam = await this.teamRepository.findOneBy({ id: data.homeTeamId });
        if (!homeTeam) {
            throw new Error("Home team not found");
        }

        const awayTeam = await this.teamRepository.findOneBy({ id: data.awayTeamId });
        if (!awayTeam) {
            throw new Error("Away team not found");
        }

        const matchData: DeepPartial<Match> = {
            phase,
            homeTeam,
            awayTeam,
            isPlayed: data.isPlayed ?? false,
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
        return this.getMatchById(savedMatch.id);
    }

    async updateMatch(id: number, data: Partial<MatchModel>) {
        const match = await this.matchRepository.findOne({
            where: { id },
            relations: {
                phase: true,
                homeTeam: true,
                awayTeam: true,
            },
        });

        if (!match) {
            throw new Error("Match not found");
        }

        const nextHomeTeamId = data.homeTeamId ?? match.homeTeam.id;
        const nextAwayTeamId = data.awayTeamId ?? match.awayTeam.id;
        if (nextHomeTeamId === nextAwayTeamId) {
            throw new Error("Home team and away team must be different");
        }

        if (data.phaseId) {
            const phase = await this.phaseRepository.findOneBy({ id: data.phaseId });
            if (!phase) {
                throw new Error("Phase not found");
            }
            match.phase = phase;
        }

        if (data.homeTeamId) {
            const homeTeam = await this.teamRepository.findOneBy({ id: data.homeTeamId });
            if (!homeTeam) {
                throw new Error("Home team not found");
            }
            match.homeTeam = homeTeam;
        }

        if (data.awayTeamId) {
            const awayTeam = await this.teamRepository.findOneBy({ id: data.awayTeamId });
            if (!awayTeam) {
                throw new Error("Away team not found");
            }
            match.awayTeam = awayTeam;
        }

        if (typeof data.homeTeamScore !== "undefined") match.homeTeamScore = data.homeTeamScore;
        if (typeof data.awayTeamScore !== "undefined") match.awayTeamScore = data.awayTeamScore;
        if (typeof data.matchday !== "undefined") match.matchday = data.matchday;
        if (typeof data.isPlayed !== "undefined") match.isPlayed = data.isPlayed;

        const updatedMatch = await this.matchRepository.save(match);
        return this.getMatchById(updatedMatch.id);
    }

    async deleteMatch(id: number): Promise<void> {
        const match = await this.matchRepository.findOneBy({ id });
        if (!match) {
            throw new Error("Match not found");
        }

        await this.matchRepository.remove(match);
    }
}
