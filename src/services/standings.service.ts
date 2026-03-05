import { Match } from "../entities/matches.entity";
import { Phase } from "../entities/phase.entity";
import { Team } from "../entities/teams.entity";
import { StandingsRow } from "../models/tournament-engine";

export class StandingsService {
    buildStandingsRows(teams: Team[], matches: Match[]): StandingsRow[] {
        const standings = new Map<number, StandingsRow>();

        teams.forEach((team) => {
            standings.set(team.id, {
                teamId: team.id,
                teamName: team.name,
                played: 0,
                won: 0,
                drawn: 0,
                lost: 0,
                goalsFor: 0,
                goalsAgainst: 0,
                goalDifference: 0,
                points: 0,
            });
        });

        matches.forEach((match) => {
            if (!match.isPlayed || typeof match.homeTeamScore === "undefined" || typeof match.awayTeamScore === "undefined") {
                return;
            }

            const home = standings.get(match.homeTeam.id);
            const away = standings.get(match.awayTeam.id);
            if (!home || !away) {
                return;
            }

            home.played += 1;
            away.played += 1;

            home.goalsFor += match.homeTeamScore;
            home.goalsAgainst += match.awayTeamScore;
            away.goalsFor += match.awayTeamScore;
            away.goalsAgainst += match.homeTeamScore;

            if (match.homeTeamScore > match.awayTeamScore) {
                home.won += 1;
                home.points += 3;
                away.lost += 1;
            } else if (match.homeTeamScore < match.awayTeamScore) {
                away.won += 1;
                away.points += 3;
                home.lost += 1;
            } else {
                home.drawn += 1;
                away.drawn += 1;
                home.points += 1;
                away.points += 1;
            }

            home.goalDifference = home.goalsFor - home.goalsAgainst;
            away.goalDifference = away.goalsFor - away.goalsAgainst;
        });

        return Array.from(standings.values()).sort((a, b) => {
            const pointsDiff = b.points - a.points;
            if (pointsDiff !== 0) {
                return pointsDiff;
            }

            const gdDiff = b.goalDifference - a.goalDifference;
            if (gdDiff !== 0) {
                return gdDiff;
            }

            return b.goalsFor - a.goalsFor;
        });
    }

    getSortedStandingsFromPhase(phase: Phase) {
        const participantsById = new Map<number, Team>();

        phase.matches.forEach((match) => {
            participantsById.set(match.homeTeam.id, match.homeTeam);
            participantsById.set(match.awayTeam.id, match.awayTeam);
        });

        const participantTeams = Array.from(participantsById.values());
        const standings = this.buildStandingsRows(participantTeams, phase.matches);

        return standings.map((row) => ({
            teamId: row.teamId,
            points: row.points,
            gf: row.goalsFor,
            gc: row.goalsAgainst,
        }));
    }
}
