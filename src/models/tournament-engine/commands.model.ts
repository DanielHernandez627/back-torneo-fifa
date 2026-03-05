export interface GenerateLeagueFixtureCommand {
    tournamentId: number;
    phaseId: number;
    doubleRound?: boolean;
}

export interface GenerateQuadrangularCommand {
    tournamentId: number;
    sourcePhaseId: number;
    targetPhaseId: number;
}

export interface GenerateFinalCommand {
    tournamentId: number;
    sourcePhaseId: number;
    targetPhaseId: number;
}

export interface RegisterMatchResultCommand {
    matchId: number;
    homeTeamScore: number;
    awayTeamScore: number;
    overwrite?: boolean;
}

export interface ClosePhaseCommand {
    phaseId: number;
}

export interface AdvanceToNextPhaseCommand {
    tournamentId: number;
}