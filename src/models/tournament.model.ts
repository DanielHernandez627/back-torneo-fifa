import { TournamentType } from "../enums/tournamentType";

export interface TournamentModel {
    name: string;
    type: TournamentType;
    userId: number;
    championId?: number;
}
