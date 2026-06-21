const GROUP_LABELS = {
  GROUP_A: "グループ A",
  GROUP_B: "グループ B",
  GROUP_C: "グループ C",
  GROUP_D: "グループ D",
  GROUP_E: "グループ E",
  GROUP_F: "グループ F",
  GROUP_G: "グループ G",
  GROUP_H: "グループ H",
  GROUP_I: "グループ I",
  GROUP_J: "グループ J",
  GROUP_K: "グループ K",
  GROUP_L: "グループ L",
};

const STAGE_LABELS = {
  GROUP_STAGE: "グループステージ",
  LAST_32: "ラウンド32",
  LAST_16: "ラウンド16",
  QUARTER_FINALS: "準々決勝",
  SEMI_FINALS: "準決勝",
  THIRD_PLACE: "3位決定戦",
  FINAL: "決勝",
};

const STATUS_LABELS = {
  FINISHED: "試合終了",
  IN_PLAY: "試合中",
  PAUSED: "ハーフタイム",
  TIMED: "開始前",
  SCHEDULED: "開始前",
  POSTPONED: "延期",
  CANCELLED: "中止",
};

const APPLICATION_COUNTRY_NOTES = {
  JPN: "脇田元樹",
  ENG: "松本空大, 亀井翔太",
  AUS: "神谷友斗",
  POR: "松川巧実",
  MEX: "高沢ザイオン",
  BRA: "河村樹人",
  BEL: "中村大紀, 佐藤輝弥",
  ESP: "後藤友輔, 吉井佑作",
  ARG: "小関凌太",
  ECU: "竹内廉",
};

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function crestMarkup(team) {
  if (team.crest) {
    return `<img class="team-crest" src="${escapeHtml(team.crest)}" alt="" loading="lazy" />`;
  }

  const teamName = team?.name || "未定";
  const teamCode = team?.tla || teamName.slice(0, 2) || "TBD";
  return `<span class="team-placeholder" aria-hidden="true">${escapeHtml(teamCode)}</span>`;
}

export function renderStandings(container, standings, selectedGroup = "ALL") {
  const filtered =
    selectedGroup === "ALL"
      ? standings
      : standings.filter((item) => item.group === selectedGroup);

  if (!filtered.length) {
    container.innerHTML =
      '<div class="empty-state">表示できる順位データがありません。</div>';
    return;
  }

  container.innerHTML = filtered
    .map(
      ({ group, table }) => `
        <article class="group-card">
          <header class="group-header">
            <h3>${escapeHtml(GROUP_LABELS[group] || group)}</h3>
            <span>上位2チームが突破</span>
          </header>
          <div class="table-scroll">
            <table class="standings-table">
              <thead>
                <tr>
                  <th scope="col">順位</th>
                  <th scope="col">チーム</th>
                  <th scope="col">試合</th>
                  <th scope="col">勝点</th>
                  <th scope="col">得点</th>
                  <th scope="col">失点</th>
                  <th scope="col">得失</th>
                </tr>
              </thead>
              <tbody>
                ${table
                  .map(
                    (row) => `
                    <tr>
                      <td>${row.position}</td>
                      <td>
                        <div class="team-cell">
                          ${crestMarkup(row.team)}
                          <span>${escapeHtml(row.team.name)}</span>
                        </div>
                      </td>
                      <td>${row.playedGames}</td>
                      <td class="points">${row.points}</td>
                      <td>${row.goalsFor}</td>
                      <td>${row.goalsAgainst}</td>
                      <td>${row.goalDifference > 0 ? "+" : ""}${row.goalDifference}</td>
                    </tr>`,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </article>`,
    )
    .join("");
}

export function renderMatches(container, matches, selectedStatus = "ALL") {
  const filtered = matches.filter((match) => {
    if (selectedStatus === "ALL") return true;
    if (selectedStatus === "TODAY") return match.isToday;
    if (selectedStatus === "SCHEDULED") {
      return ["SCHEDULED", "TIMED"].includes(match.status);
    }
    return match.status === selectedStatus;
  });

  if (!filtered.length) {
    container.innerHTML =
      '<div class="empty-state">該当する試合がありません。</div>';
    return;
  }

  container.innerHTML = filtered
    .map((match) => {
      const date = new Intl.DateTimeFormat("ja-JP", {
        month: "short",
        day: "numeric",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Tokyo",
      }).format(new Date(match.utcDate));
      const isFinished = match.status === "FINISHED";
      const score =
        match.score.home == null || match.score.away == null
          ? "VS"
          : `${match.score.home} - ${match.score.away}`;

      return `
        <article class="match-card ${match.isToday ? "is-today" : ""}">
          <div class="match-meta">
            <strong>${match.isToday ? '<span class="today-label">TODAY</span>' : ""}${escapeHtml(GROUP_LABELS[match.group] || STAGE_LABELS[match.stage] || match.stage)}</strong>
            <time datetime="${escapeHtml(match.utcDate)}">${escapeHtml(date)}</time>
          </div>
          <div class="match-teams">
            <div class="match-team home">
              ${crestMarkup(match.homeTeam)}
              <span>${escapeHtml(match.homeTeam.name)}</span>
            </div>
            <div class="match-score ${isFinished ? "" : "is-scheduled"}">${score}</div>
            <div class="match-team away">
              <span>${escapeHtml(match.awayTeam.name)}</span>
              ${crestMarkup(match.awayTeam)}
            </div>
          </div>
          <span class="match-status ${isFinished ? "" : "is-scheduled"}">
            ${escapeHtml(STATUS_LABELS[match.status] || match.status)}
          </span>
        </article>`;
    })
    .join("");
}

export function renderDefenseRanking(container, standings) {
  const ranking = standings
    .flatMap(({ group, table }) =>
      table.map((row) => ({ ...row, group })),
    )
    .filter((row) => row.playedGames > 0)
    .sort(
      (a, b) =>
        a.goalsAgainst - b.goalsAgainst ||
        b.playedGames - a.playedGames ||
        b.goalDifference - a.goalDifference ||
        b.goalsFor - a.goalsFor,
    );

  if (!ranking.length) {
    container.innerHTML =
      '<div class="empty-state">失点データがありません。</div>';
    return;
  }

  const leader = ranking[0];
  const applicationCountries = ranking.filter(
    (row) => APPLICATION_COUNTRY_NOTES[row.team.tla],
  );
  const otherCountries = ranking.filter(
    (row) => !APPLICATION_COUNTRY_NOTES[row.team.tla],
  );

  const renderRankingRow = (row, { application = false } = {}) => {
    const overallPosition = ranking.indexOf(row) + 1;
    const note = APPLICATION_COUNTRY_NOTES[row.team.tla];

    return `
      <article class="defense-row ${application ? "is-application" : ""}">
        <span class="defense-position">${overallPosition}</span>
        <div class="defense-country">
          ${crestMarkup(row.team)}
          <div>
            <strong>${escapeHtml(row.team.name)}</strong>
            <span>${escapeHtml(GROUP_LABELS[row.group] || row.group)} · ${row.playedGames}試合</span>
          </div>
        </div>
        ${
          application
            ? `<div class="defense-note"><span>応募者</span><strong>${escapeHtml(note)}</strong></div>`
            : ""
        }
        <div class="defense-stat"><strong>${row.goalsAgainst}</strong><span>失点</span></div>
      </article>`;
  };

  container.innerHTML = `
    <div class="defense-hero-card">
      <div class="crown" aria-label="1位">♛</div>
      <div class="defense-team-badge">${crestMarkup(leader.team)}</div>
      <p class="defense-rank-label">CLEANEST DEFENSE</p>
      <h3>${escapeHtml(leader.team.name)}</h3>
      <div class="conceded-number">
        <strong>${leader.goalsAgainst}</strong>
        <span>失点</span>
      </div>
      <p>${leader.playedGames}試合を消化 · ${escapeHtml(GROUP_LABELS[leader.group] || leader.group)}</p>
    </div>
    <section class="defense-ranking-section application-ranking">
      <div class="ranking-section-heading">
        <div>
          <h3>応募対象国</h3>
        </div>
        <p>対象国を失点数の少ない順に優先表示</p>
      </div>
      <div class="defense-list application-list">
        ${applicationCountries
          .map((row) => renderRankingRow(row, { application: true }))
          .join("")}
      </div>
    </section>
    <section class="defense-ranking-section">
      <div class="ranking-section-heading">
        <h3>その他の国</h3>
      </div>
      <div class="defense-list">
        ${otherCountries.map((row) => renderRankingRow(row)).join("")}
      </div>
    </section>
  `;
}

export function renderTournament(container, matches) {
  const bracketStages = [
    { key: "LAST_32", slots: 16 },
    { key: "LAST_16", slots: 8 },
    { key: "QUARTER_FINALS", slots: 4 },
    { key: "SEMI_FINALS", slots: 2 },
    { key: "FINAL", slots: 1 },
  ];
  const knockoutMatches = matches.filter((match) =>
    bracketStages.some((stage) => stage.key === match.stage) ||
    match.stage === "THIRD_PLACE",
  );

  const getWinnerSide = (match) => {
    if (!match || match.status !== "FINISHED") return null;
    if (match.winner === "HOME_TEAM") return "home";
    if (match.winner === "AWAY_TEAM") return "away";
    if (match.score.penaltiesHome > match.score.penaltiesAway) return "home";
    if (match.score.penaltiesAway > match.score.penaltiesHome) return "away";
    if (match.score.home > match.score.away) return "home";
    if (match.score.away > match.score.home) return "away";
    return null;
  };

  container.innerHTML = `
    ${
      !knockoutMatches.length
        ? '<p class="bracket-notice">決勝トーナメントは未開始です。組み合わせ確定後、各枠へ自動反映されます。</p>'
        : ""
    }
    <div class="bracket-scroll">
      <div class="bracket">
        ${bracketStages
          .map(({ key, slots }) => {
            const stageMatches = knockoutMatches
              .filter((match) => match.stage === key)
              .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));

            return `
              <section class="bracket-round">
                <header>
                  <span>${escapeHtml(STAGE_LABELS[key] || key)}</span>
                  <small>${slots}試合</small>
                </header>
                <div class="bracket-round-matches">
                  ${Array.from({ length: slots }, (_, index) => {
                    const match = stageMatches[index];
                    const winnerSide = getWinnerSide(match);
                    const homeScore = match?.score?.home;
                    const awayScore = match?.score?.away;
                    return `
                      <article class="bracket-match ${match ? "has-match" : "is-pending"}">
                        <div class="bracket-team ${winnerSide === "home" ? "is-winner" : ""}">
                          ${match ? crestMarkup(match.homeTeam) : '<span class="team-placeholder">?</span>'}
                          <span>${escapeHtml(match?.homeTeam?.name || "未定")}</span>
                          <strong>${homeScore ?? "–"}</strong>
                        </div>
                        <div class="bracket-team ${winnerSide === "away" ? "is-winner" : ""}">
                          ${match ? crestMarkup(match.awayTeam) : '<span class="team-placeholder">?</span>'}
                          <span>${escapeHtml(match?.awayTeam?.name || "未定")}</span>
                          <strong>${awayScore ?? "–"}</strong>
                        </div>
                      </article>`;
                  }).join("")}
                </div>
              </section>`;
          })
          .join("")}
        <section class="bracket-champion">
          <span aria-hidden="true">♛</span>
          <small>CHAMPION</small>
          <strong>${
            (() => {
              const final = knockoutMatches.find(
                (match) => match.stage === "FINAL",
              );
              const side = getWinnerSide(final);
              return escapeHtml(
                side === "home"
                  ? final.homeTeam.name
                  : side === "away"
                    ? final.awayTeam.name
                    : "未定",
              );
            })()
          }</strong>
        </section>
      </div>
    </div>
    ${
      knockoutMatches.some((match) => match.stage === "THIRD_PLACE")
        ? `<div class="third-place-result">
            <strong>3位決定戦</strong>
            ${renderCompactMatch(
              knockoutMatches.find((match) => match.stage === "THIRD_PLACE"),
            )}
          </div>`
        : ""
    }
  `;
}

function renderCompactMatch(match) {
  if (!match) return "";
  const score =
    match.score.home == null ? "VS" : `${match.score.home} - ${match.score.away}`;
  return `<span>${escapeHtml(match.homeTeam.name)} ${score} ${escapeHtml(match.awayTeam.name)}</span>`;
}

export function renderScoringRanking(container, standings) {
  const ranking = standings
    .flatMap(({ group, table }) =>
      table.map((row) => ({ ...row, group })),
    )
    .filter((row) => row.playedGames > 0)
    .sort(
      (a, b) =>
        b.goalsFor - a.goalsFor ||
        b.goalDifference - a.goalDifference ||
        b.points - a.points,
    );

  if (!ranking.length) {
    container.innerHTML =
      '<div class="empty-state">得点データがありません。</div>';
    return;
  }

  container.innerHTML = `
    <div class="scoring-podium">
      ${ranking
        .slice(0, 3)
        .map(
          (row, index) => `
            <article class="scoring-podium-card rank-${index + 1}">
              <span class="podium-position">${index + 1}</span>
              ${crestMarkup(row.team)}
              <h3>${escapeHtml(row.team.name)}</h3>
              <strong>${row.goalsFor}</strong>
              <span>得点</span>
            </article>`,
        )
        .join("")}
    </div>
    <div class="scoring-list">
      ${ranking
        .slice(3)
        .map(
          (row, index) => `
            <article class="scoring-row">
              <span>${index + 4}</span>
              <div>${crestMarkup(row.team)}<strong>${escapeHtml(row.team.name)}</strong></div>
              <small>${escapeHtml(GROUP_LABELS[row.group] || row.group)}</small>
              <strong>${row.goalsFor}<small> 得点</small></strong>
            </article>`,
        )
        .join("")}
    </div>`;
}

export function populateGroupFilter(select, standings) {
  const groups = [...new Set(standings.map((item) => item.group))];
  select.innerHTML = `
    <option value="ALL">全グループ</option>
    ${groups
      .map(
        (group) =>
          `<option value="${escapeHtml(group)}">${escapeHtml(GROUP_LABELS[group] || group)}</option>`,
      )
      .join("")}
  `;
}
