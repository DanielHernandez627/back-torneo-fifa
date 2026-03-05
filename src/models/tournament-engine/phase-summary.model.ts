import { PhaseStatus } from "../../enums/phaseStatus";

export interface PhaseSummary {
    phaseId: number;
    name: string;
    status: PhaseStatus;
    totalMatches: number;
    playedMatches: number;
}