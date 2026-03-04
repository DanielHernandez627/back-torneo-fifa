import { AppDataSource } from "../config/database";
import { Team } from "../entities/teams.entity";
import { Tournament } from "../entities/tournaments.entity";
import { User } from "../entities/user.entity";
import { TournamentModel } from "../models/tournament.model";
import { DeepPartial } from "typeorm";

export class TournamentService {
    private tournamentRepository = AppDataSource.getRepository(Tournament);
    private userRepository = AppDataSource.getRepository(User);
    private teamRepository = AppDataSource.getRepository(Team);

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

    async getAllTournaments() {
        const tournaments = await this.tournamentRepository.find({
            relations: {
                user: true,
                champion: true,
            },
        });

        return tournaments.map((tournament) => this.toResponse(tournament));
    }

    async getTournamentById(id: number) {
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

        return this.toResponse(tournament);
    }

    async createTournament(data: TournamentModel) {
        const user = await this.userRepository.findOneBy({ id: data.userId });
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
        return this.getTournamentById(savedTournament.id);
    }

    async updateTournament(id: number, data: Partial<TournamentModel>) {
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
        return this.getTournamentById(updatedTournament.id);
    }

    async deleteTournament(id: number): Promise<void> {
        const tournament = await this.tournamentRepository.findOneBy({ id });
        if (!tournament) {
            throw new Error("Tournament not found");
        }

        await this.tournamentRepository.remove(tournament);
    }
}
