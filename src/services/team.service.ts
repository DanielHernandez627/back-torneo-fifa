import { AppDataSource } from "../config/database";
import { Team } from "../entities/teams.entity";
import { Tournament } from "../entities/tournaments.entity";
import { TeamModel } from "../models/team.model";

export class TeamService {
    private teamRepository = AppDataSource.getRepository(Team);
    private tournamentRepository = AppDataSource.getRepository(Tournament);

    private toResponse(team: Team) {
        return {
            id: team.id,
            name: team.name,
            tournamentId: team.tournament?.id,
            createdAt: team.createdAt,
            updatedAt: team.updatedAt,
        };
    }

    async getAllTeams() {
        const teams = await this.teamRepository.find({
            relations: {
                tournament: true,
            },
        });

        return teams.map((team) => this.toResponse(team));
    }

    async getTeamById(id: number) {
        const team = await this.teamRepository.findOne({
            where: { id },
            relations: {
                tournament: true,
            },
        });

        if (!team) {
            throw new Error("Team not found");
        }

        return this.toResponse(team);
    }

    async createTeam(data: TeamModel) {
        const tournament = await this.tournamentRepository.findOneBy({ id: data.tournamentId });
        if (!tournament) {
            throw new Error("Tournament not found");
        }

        const team = this.teamRepository.create({
            name: data.name,
            tournament,
        });

        const savedTeam = await this.teamRepository.save(team);
        return this.getTeamById(savedTeam.id);
    }

    async updateTeam(id: number, data: Partial<TeamModel>) {
        const team = await this.teamRepository.findOne({
            where: { id },
            relations: {
                tournament: true,
            },
        });

        if (!team) {
            throw new Error("Team not found");
        }

        if (data.name) team.name = data.name;

        if (data.tournamentId) {
            const tournament = await this.tournamentRepository.findOneBy({ id: data.tournamentId });
            if (!tournament) {
                throw new Error("Tournament not found");
            }
            team.tournament = tournament;
        }

        const updatedTeam = await this.teamRepository.save(team);
        return this.getTeamById(updatedTeam.id);
    }

    async deleteTeam(id: number): Promise<void> {
        const team = await this.teamRepository.findOneBy({ id });
        if (!team) {
            throw new Error("Team not found");
        }

        await this.teamRepository.remove(team);
    }
}
