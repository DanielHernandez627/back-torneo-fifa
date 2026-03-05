import { AppDataSource } from "../config/database";
import { Team } from "../entities/teams.entity";
import { Tournament } from "../entities/tournaments.entity";
import { TeamModel } from "../models/team.model";
import { TournamentAuthorizationService } from "./tournament-authorization.service";

export class TeamService {
    private teamRepository = AppDataSource.getRepository(Team);
    private tournamentRepository = AppDataSource.getRepository(Tournament);
    private authorizationService = new TournamentAuthorizationService();

    private toResponse(team: Team) {
        return {
            id: team.id,
            name: team.name,
            tournamentId: team.tournament?.id,
            createdAt: team.createdAt,
            updatedAt: team.updatedAt,
        };
    }

    async getAllTeams(requesterUserId?: number) {
        const options: {
            relations: {
                tournament: {
                    user: true;
                };
            };
            where?: {
                tournament: {
                    user: {
                        id: number;
                    };
                };
            };
        } = {
            relations: {
                tournament: {
                    user: true,
                },
            },
        };

        if (typeof requesterUserId !== "undefined") {
            options.where = {
                tournament: {
                    user: {
                        id: requesterUserId,
                    },
                },
            };
        }

        const teams = await this.teamRepository.find(options);

        return teams.map((team) => this.toResponse(team));
    }

    async getTeamById(id: number, requesterUserId?: number) {
        const team = await this.teamRepository.findOne({
            where: { id },
            relations: {
                tournament: {
                    user: true,
                },
            },
        });

        if (!team) {
            throw new Error("Team not found");
        }

        if (typeof requesterUserId !== "undefined") {
            this.authorizationService.ensureOwnership(team.tournament.user.id, requesterUserId);
        }

        return this.toResponse(team);
    }

    async createTeam(data: TeamModel, requesterUserId?: number) {
        if (typeof requesterUserId !== "undefined") {
            await this.authorizationService.ensureTournamentOwner(data.tournamentId, requesterUserId);
        }

        const tournament = await this.tournamentRepository.findOneBy({ id: data.tournamentId });
        if (!tournament) {
            throw new Error("Tournament not found");
        }

        const team = this.teamRepository.create({
            name: data.name,
            tournament,
        });

        const savedTeam = await this.teamRepository.save(team);
        return this.getTeamById(savedTeam.id, requesterUserId);
    }

    async updateTeam(id: number, data: Partial<TeamModel>, requesterUserId?: number) {
        const team = await this.teamRepository.findOne({
            where: { id },
            relations: {
                tournament: {
                    user: true,
                },
            },
        });

        if (!team) {
            throw new Error("Team not found");
        }

        if (typeof requesterUserId !== "undefined") {
            this.authorizationService.ensureOwnership(team.tournament.user.id, requesterUserId);
        }

        if (data.name) team.name = data.name;

        if (data.tournamentId) {
            if (typeof requesterUserId !== "undefined") {
                await this.authorizationService.ensureTournamentOwner(data.tournamentId, requesterUserId);
            }

            const tournament = await this.tournamentRepository.findOneBy({ id: data.tournamentId });
            if (!tournament) {
                throw new Error("Tournament not found");
            }
            team.tournament = tournament;
        }

        const updatedTeam = await this.teamRepository.save(team);
        return this.getTeamById(updatedTeam.id, requesterUserId);
    }

    async deleteTeam(id: number, requesterUserId?: number): Promise<void> {
        const team = await this.teamRepository.findOne({
            where: { id },
            relations: {
                tournament: {
                    user: true,
                },
            },
        });

        if (!team) {
            throw new Error("Team not found");
        }

        if (typeof requesterUserId !== "undefined") {
            this.authorizationService.ensureOwnership(team.tournament.user.id, requesterUserId);
        }

        await this.teamRepository.remove(team);
    }
}
