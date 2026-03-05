import { Request, Response } from "express";
import { TeamService } from "../services/team.service";
import { errorHandler } from "../utilities/error.handler";
import { TeamModel } from "../models/team.model";

export class TeamController {
    private teamService = new TeamService();

    private getAuthenticatedUserId(req: Request) {
        const userId = req.user?.id;
        if (!userId) {
            throw new Error("Unauthorized");
        }

        const parsed = parseInt(userId, 10);
        if (Number.isNaN(parsed)) {
            throw new Error("Invalid authenticated user id");
        }

        return parsed;
    }

    getAllTeams = async (req: Request, res: Response) => {
        try {
            const requesterUserId = this.getAuthenticatedUserId(req);
            const teams = await this.teamService.getAllTeams(requesterUserId);
            res.json(teams);
        } catch (error) {
            errorHandler(res, 400, error);
        }
    };

    getTeamById = async (req: Request<{ id: string }>, res: Response) => {
        try {
            const requesterUserId = this.getAuthenticatedUserId(req);
            const id = parseInt(req.params.id);
            const team = await this.teamService.getTeamById(id, requesterUserId);
            res.json(team);
        } catch (error) {
            errorHandler(res, 404, error);
        }
    };

    createTeam = async (req: Request<{}, {}, TeamModel>, res: Response) => {
        try {
            const requesterUserId = this.getAuthenticatedUserId(req);
            const team = await this.teamService.createTeam(req.body, requesterUserId);
            res.status(201).json(team);
        } catch (error) {
            errorHandler(res, 400, error);
        }
    };

    updateTeam = async (req: Request<{ id: string }, {}, Partial<TeamModel>>, res: Response) => {
        try {
            const requesterUserId = this.getAuthenticatedUserId(req);
            const id = parseInt(req.params.id);
            const team = await this.teamService.updateTeam(id, req.body, requesterUserId);
            res.json(team);
        } catch (error) {
            errorHandler(res, 400, error);
        }
    };

    deleteTeam = async (req: Request<{ id: string }>, res: Response) => {
        try {
            const requesterUserId = this.getAuthenticatedUserId(req);
            const id = parseInt(req.params.id);
            await this.teamService.deleteTeam(id, requesterUserId);
            res.status(204).send();
        } catch (error) {
            errorHandler(res, 404, error);
        }
    };
}
