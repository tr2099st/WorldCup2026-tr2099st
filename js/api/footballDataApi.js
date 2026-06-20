export class FootballDataApi {
  constructor({ apiBaseUrl, competitionCode, season }) {
    this.apiBaseUrl = apiBaseUrl.replace(/\/$/, "");
    this.competitionCode = competitionCode;
    this.season = season;
  }

  async request(endpoint) {
    const url = new URL(
      `${this.apiBaseUrl}/${endpoint}`,
      window.location.href,
    );
    url.searchParams.set("competition", this.competitionCode);
    url.searchParams.set("season", String(this.season));

    const response = await fetch(url);

    if (!response.ok) {
      const error = new Error(`API request failed: ${response.status}`);
      error.status = response.status;
      throw error;
    }

    return response.json();
  }

  getStandings() {
    return this.request("standings");
  }

  getMatches() {
    return this.request("matches");
  }
}
