import { Request, Response } from "express";
import { TournamentService } from "../services/tournament.service";
import { errorHandler } from "../utilities/error.handler";
import { TournamentModel } from "../models/tournament.model";
import {
    GenerateFinalCommand,
    GenerateLeagueFixtureCommand,
    GenerateQuadrangularCommand,
    RegisterMatchResultCommand,
} from "../models/tournament-engine";

export class TournamentController {
    private tournamentService = new TournamentService();

    private parseId(value: string, fieldName: string) {
        const parsed = parseInt(value, 10);
        if (Number.isNaN(parsed)) {
            throw new Error(`${fieldName} must be a valid number`);
        }
        return parsed;
    }

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

    getAllTournaments = async (req: Request, res: Response) => {
        try {
            const requesterUserId = this.getAuthenticatedUserId(req);
            const tournaments = await this.tournamentService.getAllTournaments(requesterUserId);
            res.json(tournaments);
        } catch (error) {
            errorHandler(res, 400, error);
        }
    };

    getTournamentById = async (req: Request<{ id: string }>, res: Response) => {
        try {
            const requesterUserId = this.getAuthenticatedUserId(req);
            const id = parseInt(req.params.id);
            const tournament = await this.tournamentService.getTournamentById(id, requesterUserId);
            res.json(tournament);
        } catch (error) {
            errorHandler(res, 404, error);
        }
    };

    createTournament = async (req: Request<{}, {}, TournamentModel>, res: Response) => {
        try {
            const requesterUserId = this.getAuthenticatedUserId(req);
            const tournament = await this.tournamentService.createTournament(req.body, requesterUserId);
            res.status(201).json(tournament);
        } catch (error) {
            errorHandler(res, 400, error);
        }
    };

    updateTournament = async (req: Request<{ id: string }, {}, Partial<TournamentModel>>, res: Response) => {
        try {
            const requesterUserId = this.getAuthenticatedUserId(req);
            const id = parseInt(req.params.id);
            const tournament = await this.tournamentService.updateTournament(id, req.body, requesterUserId);
            res.json(tournament);
        } catch (error) {
            errorHandler(res, 400, error);
        }
    };

    deleteTournament = async (req: Request<{ id: string }>, res: Response) => {
        try {
            const requesterUserId = this.getAuthenticatedUserId(req);
            const id = parseInt(req.params.id);
            await this.tournamentService.deleteTournament(id, requesterUserId);
            res.status(204).send();
        } catch (error) {
            errorHandler(res, 404, error);
        }
    };

    generateLeagueFixture = async (
        req: Request<{ id: string }, {}, Omit<GenerateLeagueFixtureCommand, "tournamentId">>,
        res: Response,
    ) => {
        try {
            const requesterUserId = this.getAuthenticatedUserId(req);
            const tournamentId = this.parseId(req.params.id, "tournamentId");
            const command: GenerateLeagueFixtureCommand = {
                tournamentId,
                phaseId: req.body.phaseId,
            };

            if (typeof req.body.doubleRound !== "undefined") {
                command.doubleRound = req.body.doubleRound;
            }

            const response = await this.tournamentService.generateLeagueFixture(command, requesterUserId);
            res.status(201).json(response);
        } catch (error) {
            errorHandler(res, 400, error);
        }
    };

    generateQuadrangular = async (
        req: Request<{ id: string }, {}, Omit<GenerateQuadrangularCommand, "tournamentId">>,
        res: Response,
    ) => {
        try {
            const requesterUserId = this.getAuthenticatedUserId(req);
            const tournamentId = this.parseId(req.params.id, "tournamentId");
            const command: GenerateQuadrangularCommand = {
                tournamentId,
                sourcePhaseId: req.body.sourcePhaseId,
                targetPhaseId: req.body.targetPhaseId,
            };

            const response = await this.tournamentService.generateQuadrangular(command, requesterUserId);
            res.status(201).json(response);
        } catch (error) {
            errorHandler(res, 400, error);
        }
    };

    generateFinal = async (
        req: Request<{ id: string }, {}, Omit<GenerateFinalCommand, "tournamentId">>,
        res: Response,
    ) => {
        try {
            const requesterUserId = this.getAuthenticatedUserId(req);
            const tournamentId = this.parseId(req.params.id, "tournamentId");
            const command: GenerateFinalCommand = {
                tournamentId,
                sourcePhaseId: req.body.sourcePhaseId,
                targetPhaseId: req.body.targetPhaseId,
            };

            const response = await this.tournamentService.generateFinal(command, requesterUserId);
            res.status(201).json(response);
        } catch (error) {
            errorHandler(res, 400, error);
        }
    };

    registerMatchResult = async (
        req: Request<{ matchId: string }, {}, Omit<RegisterMatchResultCommand, "matchId">>,
        res: Response,
    ) => {
        try {
            const requesterUserId = this.getAuthenticatedUserId(req);
            const matchId = this.parseId(req.params.matchId, "matchId");
            const command: RegisterMatchResultCommand = {
                matchId,
                homeTeamScore: req.body.homeTeamScore,
                awayTeamScore: req.body.awayTeamScore,
            };

            if (typeof req.body.overwrite !== "undefined") {
                command.overwrite = req.body.overwrite;
            }

            const response = await this.tournamentService.registerMatchResult(command, requesterUserId);
            res.json(response);
        } catch (error) {
            errorHandler(res, 400, error);
        }
    };

    getStandings = async (req: Request<{ id: string }>, res: Response) => {
        try {
            const requesterUserId = this.getAuthenticatedUserId(req);
            const tournamentId = this.parseId(req.params.id, "tournamentId");
            const response = await this.tournamentService.getStandings(tournamentId, requesterUserId);
            res.json(response);
        } catch (error) {
            errorHandler(res, 400, error);
        }
    };

    closePhase = async (req: Request<{ phaseId: string }>, res: Response) => {
        try {
            const requesterUserId = this.getAuthenticatedUserId(req);
            const phaseId = this.parseId(req.params.phaseId, "phaseId");
            const response = await this.tournamentService.closePhase({ phaseId }, requesterUserId);
            res.json(response);
        } catch (error) {
            errorHandler(res, 400, error);
        }
    };

    advanceToNextPhase = async (req: Request<{ id: string }>, res: Response) => {
        try {
            const requesterUserId = this.getAuthenticatedUserId(req);
            const tournamentId = this.parseId(req.params.id, "tournamentId");
            const response = await this.tournamentService.advanceToNextPhase({ tournamentId }, requesterUserId);
            res.json(response);
        } catch (error) {
            errorHandler(res, 400, error);
        }
    };
}
