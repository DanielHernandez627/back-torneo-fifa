import { AppDataSource } from "../config/database";
import { Phase } from "../entities/phase.entity";
import { Tournament } from "../entities/tournaments.entity";
import { PhaseModel } from "../models/phase.model";
import { DeepPartial } from "typeorm";
import { PhaseStatus } from "../enums/phaseStatus";

export class PhaseService {
    private phaseRepository = AppDataSource.getRepository(Phase);
    private tournamentRepository = AppDataSource.getRepository(Tournament);

    private toResponse(phase: Phase) {
        return {
            id: phase.id,
            name: phase.name,
            orderNumber: phase.orderNumber,
            status: phase.status,
            tournamentId: phase.tournament?.id,
            createdAt: phase.createdAt,
            updatedAt: phase.updatedAt,
        };
    }

    async getAllPhases() {
        const phases = await this.phaseRepository.find({
            relations: {
                tournament: true,
            },
        });

        return phases.map((phase) => this.toResponse(phase));
    }

    async getPhaseById(id: number) {
        const phase = await this.phaseRepository.findOne({
            where: { id },
            relations: {
                tournament: true,
            },
        });

        if (!phase) {
            throw new Error("Phase not found");
        }

        return this.toResponse(phase);
    }

    async createPhase(data: PhaseModel) {
        const tournament = await this.tournamentRepository.findOneBy({ id: data.tournamentId });
        if (!tournament) {
            throw new Error("Tournament not found");
        }

        const phaseData: DeepPartial<Phase> = {
            name: data.name,
            tournament,
            status: data.status ?? PhaseStatus.SCHEDULED,
        };

        if (typeof data.orderNumber !== "undefined") {
            phaseData.orderNumber = data.orderNumber;
        }

        const phase = this.phaseRepository.create(phaseData);

        const savedPhase = await this.phaseRepository.save(phase);
        return this.getPhaseById(savedPhase.id);
    }

    async updatePhase(id: number, data: Partial<PhaseModel>) {
        const phase = await this.phaseRepository.findOne({
            where: { id },
            relations: {
                tournament: true,
            },
        });

        if (!phase) {
            throw new Error("Phase not found");
        }

        if (data.name) phase.name = data.name;
        if (typeof data.orderNumber !== "undefined") phase.orderNumber = data.orderNumber;
        if (typeof data.status !== "undefined") phase.status = data.status;

        if (data.tournamentId) {
            const tournament = await this.tournamentRepository.findOneBy({ id: data.tournamentId });
            if (!tournament) {
                throw new Error("Tournament not found");
            }
            phase.tournament = tournament;
        }

        const updatedPhase = await this.phaseRepository.save(phase);
        return this.getPhaseById(updatedPhase.id);
    }

    async deletePhase(id: number): Promise<void> {
        const phase = await this.phaseRepository.findOneBy({ id });
        if (!phase) {
            throw new Error("Phase not found");
        }

        await this.phaseRepository.remove(phase);
    }
}
