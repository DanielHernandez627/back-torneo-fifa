import { PhaseStatus } from "../../enums/phaseStatus";

export interface PhaseSummary {
    phaseId: number;
    name: string;
    orderNumber?: number;
    status: PhaseStatus;
    totalMatches: number;
    playedMatches: number;
}