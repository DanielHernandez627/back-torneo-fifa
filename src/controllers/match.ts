import { Request, Response } from "express";
import { MatchService } from "../services/match.service";
import { errorHandler } from "../utilities/error.handler";
import { MatchModel } from "../models/match.model";

export class MatchController {
    private matchService = new MatchService();

    getAllMatches = async (_req: Request, res: Response) => {
        try {
            const matches = await this.matchService.getAllMatches();
            res.json(matches);
        } catch (error) {
            errorHandler(res, 400, error);
        }
    };

    getMatchById = async (req: Request<{ id: string }>, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            const match = await this.matchService.getMatchById(id);
            res.json(match);
        } catch (error) {
            errorHandler(res, 404, error);
        }
    };

    createMatch = async (req: Request<{}, {}, MatchModel>, res: Response) => {
        try {
            const match = await this.matchService.createMatch(req.body);
            res.status(201).json(match);
        } catch (error) {
            errorHandler(res, 400, error);
        }
    };

    updateMatch = async (req: Request<{ id: string }, {}, Partial<MatchModel>>, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            const match = await this.matchService.updateMatch(id, req.body);
            res.json(match);
        } catch (error) {
            errorHandler(res, 400, error);
        }
    };

    deleteMatch = async (req: Request<{ id: string }>, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            await this.matchService.deleteMatch(id);
            res.status(204).send();
        } catch (error) {
            errorHandler(res, 404, error);
        }
    };
}
