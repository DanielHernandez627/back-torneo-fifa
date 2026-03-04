import { Request, Response } from "express";
import { TournamentService } from "../services/tournament.service";
import { errorHandler } from "../utilities/error.handler";
import { TournamentModel } from "../models/tournament.model";

export class TournamentController {
    private tournamentService = new TournamentService();

    getAllTournaments = async (_req: Request, res: Response) => {
        try {
            const tournaments = await this.tournamentService.getAllTournaments();
            res.json(tournaments);
        } catch (error) {
            errorHandler(res, 400, error);
        }
    };

    getTournamentById = async (req: Request<{ id: string }>, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            const tournament = await this.tournamentService.getTournamentById(id);
            res.json(tournament);
        } catch (error) {
            errorHandler(res, 404, error);
        }
    };

    createTournament = async (req: Request<{}, {}, TournamentModel>, res: Response) => {
        try {
            const tournament = await this.tournamentService.createTournament(req.body);
            res.status(201).json(tournament);
        } catch (error) {
            errorHandler(res, 400, error);
        }
    };

    updateTournament = async (req: Request<{ id: string }, {}, Partial<TournamentModel>>, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            const tournament = await this.tournamentService.updateTournament(id, req.body);
            res.json(tournament);
        } catch (error) {
            errorHandler(res, 400, error);
        }
    };

    deleteTournament = async (req: Request<{ id: string }>, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            await this.tournamentService.deleteTournament(id);
            res.status(204).send();
        } catch (error) {
            errorHandler(res, 404, error);
        }
    };
}
