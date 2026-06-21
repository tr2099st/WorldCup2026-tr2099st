import { FootballDataApi } from "../api/footballDataApi.js?v=20260621-3";
import {
  DEMO_MATCHES,
  DEMO_STANDINGS,
} from "../data/demoData.js?v=20260621-3";

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
        standings: this.normalizeStandings(
          standingsResponse.standings ?? [],
          matchesResponse.matches ?? [],
        ),
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

  normalizeStandings(standings, matches) {
    const totalStanding = standings.find(
      (standing) =>
        standing.type === "TOTAL" && standing.stage === "GROUP_STAGE",
    );
    if (!totalStanding) return [];

    const teamGroupMap = new Map();
    matches
      .filter((match) => match.stage === "GROUP_STAGE" && match.group)
      .forEach((match) => {
        if (match.homeTeam?.id) {
          teamGroupMap.set(match.homeTeam.id, match.group);
        }
        if (match.awayTeam?.id) {
          teamGroupMap.set(match.awayTeam.id, match.group);
        }
      });

    const groupedRows = new Map();
    totalStanding.table.forEach((row) => {
      const group = teamGroupMap.get(row.team?.id);
      if (!group) return;
      if (!groupedRows.has(group)) groupedRows.set(group, []);
      groupedRows.get(group).push({
        position: 0,
        team: this.normalizeTeam(row.team),
        playedGames: row.playedGames ?? 0,
        won: row.won ?? 0,
        draw: row.draw ?? 0,
        lost: row.lost ?? 0,
        points: row.points ?? 0,
        goalsFor: row.goalsFor ?? 0,
        goalsAgainst: row.goalsAgainst ?? 0,
        goalDifference: row.goalDifference ?? 0,
      });
    });

    return [...groupedRows.entries()]
      .sort(([groupA], [groupB]) => groupA.localeCompare(groupB))
      .map(([group, table]) => ({
        group,
        table: table
          .sort(
            (a, b) =>
              b.points - a.points ||
              b.goalDifference - a.goalDifference ||
              b.goalsFor - a.goalsFor ||
              a.team.name.localeCompare(b.team.name),
          )
          .map((row, index) => ({ ...row, position: index + 1 })),
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
        homeTeam: this.normalizeTeam(match.homeTeam),
        awayTeam: this.normalizeTeam(match.awayTeam),
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

  normalizeTeam(team) {
    return {
      name: team?.shortName || team?.name || "未定",
      tla: team?.tla || "TBD",
      crest: team?.crest || null,
    };
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
