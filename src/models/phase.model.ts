import { PhaseStatus } from "../enums/phaseStatus";

export interface PhaseModel {
    name: string;
    orderNumber?: number;
    status?: PhaseStatus;
    tournamentId: number;
}
