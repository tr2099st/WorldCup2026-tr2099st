import { APP_CONFIG } from "./config.js";
import { WorldCupService } from "./services/worldCupService.js";
import {
  populateGroupFilter,
  renderDefenseRanking,
  renderMatches,
  renderScoringRanking,
  renderStandings,
  renderTournament,
} from "./ui/render.js";

const elements = {
  standingsGrid: document.querySelector("#standingsGrid"),
  matchesList: document.querySelector("#matchesList"),
  defenseRanking: document.querySelector("#defenseRanking"),
  tournamentResults: document.querySelector("#tournamentResults"),
  scoringRanking: document.querySelector("#scoringRanking"),
  groupFilter: document.querySelector("#groupFilter"),
  matchFilter: document.querySelector("#matchFilter"),
  standingsTab: document.querySelector("#standingsTab"),
  matchesTab: document.querySelector("#matchesTab"),
  defenseTab: document.querySelector("#defenseTab"),
  tournamentTab: document.querySelector("#tournamentTab"),
  scoringTab: document.querySelector("#scoringTab"),
  standingsPanel: document.querySelector("#standingsPanel"),
  matchesPanel: document.querySelector("#matchesPanel"),
  defensePanel: document.querySelector("#defensePanel"),
  tournamentPanel: document.querySelector("#tournamentPanel"),
  scoringPanel: document.querySelector("#scoringPanel"),
  refreshButton: document.querySelector("#refreshButton"),
  detailMenuButton: document.querySelector("#detailMenuButton"),
  detailMenu: document.querySelector("#detailMenu"),
  dataStatus: document.querySelector("#dataStatus"),
  statusDot: document.querySelector("#statusDot"),
  lastUpdated: document.querySelector("#lastUpdated"),
  errorCard: document.querySelector("#errorCard"),
  errorMessage: document.querySelector("#errorMessage"),
};

const service = new WorldCupService(APP_CONFIG);
let tournamentData = null;
let isLoading = false;
let nextRefreshAt = null;
let refreshTimer = null;

function setLoading(isLoading) {
  window.clearTimeout(refreshTimer);
  elements.refreshButton.disabled = isLoading;
  if (isLoading && !tournamentData) {
    elements.dataStatus.textContent = "データを読み込んでいます...";
    elements.statusDot.className = "status-dot";
    elements.standingsGrid.innerHTML =
      '<div class="loading-card">順位表を読み込んでいます...</div>';
    elements.matchesList.innerHTML =
      '<div class="loading-card">試合情報を読み込んでいます...</div>';
    elements.defenseRanking.innerHTML =
      '<div class="loading-card">守備ランキングを読み込んでいます...</div>';
    elements.tournamentResults.innerHTML =
      '<div class="loading-card">トーナメントを読み込んでいます...</div>';
    elements.scoringRanking.innerHTML =
      '<div class="loading-card">得点ランキングを読み込んでいます...</div>';
  }
}

function scheduleNextRefresh() {
  window.clearTimeout(refreshTimer);
  nextRefreshAt = new Date(Date.now() + APP_CONFIG.refreshIntervalMs);
  refreshTimer = window.setTimeout(() => {
    if (document.visibilityState === "visible") {
      loadData();
    } else {
      scheduleNextRefresh();
    }
  }, APP_CONFIG.refreshIntervalMs);
}

function updateStatus(data) {
  const isLive = data.source === "live";
  elements.statusDot.className = `status-dot ${isLive ? "is-live" : "is-demo"}`;
  elements.dataStatus.textContent = isLive
    ? `${data.season}年大会・ライブAPI`
    : `${data.season}年大会・デモデータ`;
  elements.lastUpdated.textContent = `更新: ${new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(data.updatedAt)}`;

  if (data.fallbackReason) {
    elements.errorMessage.textContent = data.fallbackReason;
    elements.errorCard.hidden = false;
  } else {
    elements.errorCard.hidden = true;
  }
}

function renderAll() {
  renderStandings(
    elements.standingsGrid,
    tournamentData.standings,
    elements.groupFilter.value,
  );
  renderMatches(
    elements.matchesList,
    tournamentData.matches,
    elements.matchFilter.value,
  );
  renderDefenseRanking(elements.defenseRanking, tournamentData.standings);
  renderTournament(elements.tournamentResults, tournamentData.matches);
  renderScoringRanking(elements.scoringRanking, tournamentData.standings);
}

async function loadData() {
  if (isLoading) return;
  isLoading = true;
  setLoading(true);
  try {
    tournamentData = await service.getTournamentData();
    populateGroupFilter(elements.groupFilter, tournamentData.standings);
    updateStatus(tournamentData);
    renderAll();
  } catch (error) {
    console.error(error);
    elements.errorMessage.textContent =
      "ページを再読み込みするか、ネットワーク接続を確認してください。";
    elements.errorCard.hidden = false;
  } finally {
    isLoading = false;
    setLoading(false);
    scheduleNextRefresh();
  }
}

function activateTab(tabName) {
  const tabMap = {
    standings: [elements.standingsTab, elements.standingsPanel],
    matches: [elements.matchesTab, elements.matchesPanel],
    defense: [elements.defenseTab, elements.defensePanel],
    tournament: [elements.tournamentTab, elements.tournamentPanel],
    scoring: [elements.scoringTab, elements.scoringPanel],
  };

  Object.entries(tabMap).forEach(([name, [tab, panel]]) => {
    const isActive = name === tabName;
    tab?.classList.toggle("is-active", isActive);
    tab?.setAttribute("aria-selected", String(isActive));
    panel.hidden = !isActive;
  });
}

elements.standingsTab.addEventListener("click", () => activateTab("standings"));
elements.matchesTab.addEventListener("click", () => activateTab("matches"));
elements.defenseTab.addEventListener("click", () => activateTab("defense"));
elements.tournamentTab.addEventListener("click", () =>
  activateTab("tournament"),
);
elements.scoringTab.addEventListener("click", () => activateTab("scoring"));
elements.detailMenuButton.addEventListener("click", () => {
  const willOpen = elements.detailMenu.hidden;
  elements.detailMenu.hidden = !willOpen;
  elements.detailMenuButton.setAttribute("aria-expanded", String(willOpen));
});
elements.detailMenu.addEventListener("click", (event) => {
  const button = event.target.closest("[data-tab-target]");
  if (!button) return;
  activateTab(button.dataset.tabTarget);
  elements.detailMenu.hidden = true;
  elements.detailMenuButton.setAttribute("aria-expanded", "false");
  document.querySelector(".main-content").scrollIntoView({ behavior: "smooth" });
});
document.addEventListener("click", (event) => {
  if (!event.target.closest(".detail-menu-wrap")) {
    elements.detailMenu.hidden = true;
    elements.detailMenuButton.setAttribute("aria-expanded", "false");
  }
});
elements.groupFilter.addEventListener("change", () => {
  renderStandings(
    elements.standingsGrid,
    tournamentData.standings,
    elements.groupFilter.value,
  );
});
elements.matchFilter.addEventListener("change", () => {
  renderMatches(
    elements.matchesList,
    tournamentData.matches,
    elements.matchFilter.value,
  );
});
elements.refreshButton.addEventListener("click", loadData);
document.addEventListener("visibilitychange", () => {
  if (
    document.visibilityState === "visible" &&
    nextRefreshAt &&
    Date.now() >= nextRefreshAt.getTime()
  ) {
    loadData();
  }
});

loadData();
