import { FootballDataApi } from "../api/footballDataApi.js";
import {
  DEMO_MATCHES,
  DEMO_STANDINGS,
} from "../data/demoData.js";

export class WorldCupService {
  constructor(config) {
    this.config = config;
  }

  async getTournamentData() {
    if (!this.config.apiBaseUrl) {
      return this.getDemoData();
    }

    const api = new FootballDataApi({
      apiBaseUrl: this.config.apiBaseUrl,
      competitionCode: this.config.competitionCode,
      season: this.config.season,
    });

    try {
      const [standingsResponse, matchesResponse] = await Promise.all([
        api.getStandings(),
        api.getMatches(),
      ]);

      return {
        source: "live",
        season: this.config.season,
        standings: this.normalizeStandings(standingsResponse.standings ?? []),
        matches: this.normalizeMatches(matchesResponse.matches ?? []),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.warn("Live API failed. Falling back to demo data.", error);
      return {
        ...this.getDemoData(),
        fallbackReason: this.getFriendlyError(error),
      };
    }
  }

  getDemoData() {
    return {
      source: "demo",
      season: 2026,
      standings: DEMO_STANDINGS,
      matches: DEMO_MATCHES,
      updatedAt: new Date(),
    };
  }

  normalizeStandings(standings) {
    return standings
      .filter((standing) => standing.type === "TOTAL")
      .map((standing) => ({
        group: standing.group ?? "GROUP_STAGE",
        table: standing.table.map((row) => ({
          position: row.position,
          team: {
            name: row.team.shortName || row.team.name,
            tla: row.team.tla,
            crest: row.team.crest,
          },
          playedGames: row.playedGames,
          won: row.won,
          draw: row.draw,
          lost: row.lost,
          points: row.points,
          goalsFor: row.goalsFor,
          goalsAgainst: row.goalsAgainst,
          goalDifference: row.goalDifference,
        })),
      }));
  }

  normalizeMatches(matches) {
    const todayInJapan = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    return matches
      .map((match) => ({
        id: match.id,
        utcDate: match.utcDate,
        status: match.status,
        stage: match.stage,
        group: match.group,
        isToday:
          new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Tokyo",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(new Date(match.utcDate)) === todayInJapan,
        homeTeam: {
          name: match.homeTeam.shortName || match.homeTeam.name,
          tla: match.homeTeam.tla,
          crest: match.homeTeam.crest,
        },
        awayTeam: {
          name: match.awayTeam.shortName || match.awayTeam.name,
          tla: match.awayTeam.tla,
          crest: match.awayTeam.crest,
        },
        score: {
          home: match.score?.fullTime?.home,
          away: match.score?.fullTime?.away,
          penaltiesHome: match.score?.penalties?.home,
          penaltiesAway: match.score?.penalties?.away,
        },
        winner: match.score?.winner,
      }))
      .sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate));
  }

  getFriendlyError(error) {
    if (error.status === 401 || error.status === 403) {
      return "APIキーを確認してください。デモデータを表示しています。";
    }
    if (error.status === 429) {
      return "APIの利用上限に達しました。デモデータを表示しています。";
    }
    return "APIに接続できないため、デモデータを表示しています。";
  }
}
