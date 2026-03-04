export interface MatchModel {
    phaseId: number;
    homeTeamId: number;
    awayTeamId: number;
    homeTeamScore?: number;
    awayTeamScore?: number;
    matchday?: number;
    isPlayed?: boolean;
}
