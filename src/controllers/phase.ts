import { Request, Response } from "express";
import { PhaseService } from "../services/phase.service";
import { errorHandler } from "../utilities/error.handler";
import { PhaseModel } from "../models/phase.model";

export class PhaseController {
    private phaseService = new PhaseService();

    getAllPhases = async (_req: Request, res: Response) => {
        try {
            const phases = await this.phaseService.getAllPhases();
            res.json(phases);
        } catch (error) {
            errorHandler(res, 400, error);
        }
    };

    getPhaseById = async (req: Request<{ id: string }>, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            const phase = await this.phaseService.getPhaseById(id);
            res.json(phase);
        } catch (error) {
            errorHandler(res, 404, error);
        }
    };

    createPhase = async (req: Request<{}, {}, PhaseModel>, res: Response) => {
        try {
            const phase = await this.phaseService.createPhase(req.body);
            res.status(201).json(phase);
        } catch (error) {
            errorHandler(res, 400, error);
        }
    };

    updatePhase = async (req: Request<{ id: string }, {}, Partial<PhaseModel>>, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            const phase = await this.phaseService.updatePhase(id, req.body);
            res.json(phase);
        } catch (error) {
            errorHandler(res, 400, error);
        }
    };

    deletePhase = async (req: Request<{ id: string }>, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            await this.phaseService.deletePhase(id);
            res.status(204).send();
        } catch (error) {
            errorHandler(res, 404, error);
        }
    };
}
