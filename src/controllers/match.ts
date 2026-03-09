import { Request, Response } from "express";
import { MatchService } from "../services/match.service";
import { errorHandler } from "../utilities/error.handler";
import { MatchModel } from "../models/match.model";

export class MatchController {
    private matchService = new MatchService();

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

    getAllMatches = async (req: Request, res: Response) => {
        try {
            const requesterUserId = this.getAuthenticatedUserId(req);
            const phaseIdRaw = req.query.phaseId;
            const groupByMatchdayRaw = req.query.groupByMatchday;

            let phaseId: number | undefined;
            if (typeof phaseIdRaw === "string") {
                const parsedPhaseId = parseInt(phaseIdRaw, 10);
                if (!Number.isNaN(parsedPhaseId)) {
                    phaseId = parsedPhaseId;
                }
            }

            const groupByMatchday =
                typeof groupByMatchdayRaw === "string" ? groupByMatchdayRaw.toLowerCase() !== "false" : true;

            const queryParams: {
                requesterUserId: number;
                phaseId?: number;
                groupByMatchday: boolean;
            } = {
                requesterUserId,
                groupByMatchday,
            };

            if (typeof phaseId !== "undefined") {
                queryParams.phaseId = phaseId;
            }

            const matches = await this.matchService.getAllMatches(queryParams);
            res.json(matches);
        } catch (error) {
            errorHandler(res, 400, error);
        }
    };

    getMatchById = async (req: Request<{ id: string }>, res: Response) => {
        try {
            const requesterUserId = this.getAuthenticatedUserId(req);
            const id = parseInt(req.params.id);
            const match = await this.matchService.getMatchById(id, requesterUserId);
            res.json(match);
        } catch (error) {
            errorHandler(res, 404, error);
        }
    };

    createMatch = async (req: Request<{}, {}, MatchModel>, res: Response) => {
        try {
            const requesterUserId = this.getAuthenticatedUserId(req);
            const match = await this.matchService.createMatch(req.body, requesterUserId);
            res.status(201).json(match);
        } catch (error) {
            errorHandler(res, 400, error);
        }
    };

    updateMatch = async (req: Request<{ id: string }, {}, Partial<MatchModel>>, res: Response) => {
        try {
            const requesterUserId = this.getAuthenticatedUserId(req);
            const id = parseInt(req.params.id);
            const match = await this.matchService.updateMatch(id, req.body, requesterUserId);
            res.json(match);
        } catch (error) {
            errorHandler(res, 400, error);
        }
    };

    deleteMatch = async (req: Request<{ id: string }>, res: Response) => {
        try {
            const requesterUserId = this.getAuthenticatedUserId(req);
            const id = parseInt(req.params.id);
            await this.matchService.deleteMatch(id, requesterUserId);
            res.status(204).send();
        } catch (error) {
            errorHandler(res, 404, error);
        }
    };
}
