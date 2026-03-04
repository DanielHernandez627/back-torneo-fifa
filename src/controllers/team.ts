import { Request, Response } from "express";
import { TeamService } from "../services/team.service";
import { errorHandler } from "../utilities/error.handler";
import { TeamModel } from "../models/team.model";

export class TeamController {
    private teamService = new TeamService();

    getAllTeams = async (_req: Request, res: Response) => {
        try {
            const teams = await this.teamService.getAllTeams();
            res.json(teams);
        } catch (error) {
            errorHandler(res, 400, error);
        }
    };

    getTeamById = async (req: Request<{ id: string }>, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            const team = await this.teamService.getTeamById(id);
            res.json(team);
        } catch (error) {
            errorHandler(res, 404, error);
        }
    };

    createTeam = async (req: Request<{}, {}, TeamModel>, res: Response) => {
        try {
            const team = await this.teamService.createTeam(req.body);
            res.status(201).json(team);
        } catch (error) {
            errorHandler(res, 400, error);
        }
    };

    updateTeam = async (req: Request<{ id: string }, {}, Partial<TeamModel>>, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            const team = await this.teamService.updateTeam(id, req.body);
            res.json(team);
        } catch (error) {
            errorHandler(res, 400, error);
        }
    };

    deleteTeam = async (req: Request<{ id: string }>, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            await this.teamService.deleteTeam(id);
            res.status(204).send();
        } catch (error) {
            errorHandler(res, 404, error);
        }
    };
}
