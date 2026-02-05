// =====================================
// LOAD DATA FROM NOLTRAX MATCH
// =====================================
const raw = localStorage.getItem("noltrax_match_data");
const data = raw ? JSON.parse(raw) : null;

const insightEl = document.getElementById("autoInsight");

if (!data) {
  insightEl.textContent =
    "No Noltrax Match data found. Please save a session in Noltrax Match first.";
} else {
  normalizeData();
  renderMatchInfo();
  renderSummary();
  renderActionDistribution();
}

// =====================================
// NORMALIZE DATA (ANTI ERROR)
// =====================================
function normalizeData() {
  // pastiin struktur aman
  data.metadata = data.metadata || {};
  data.events = Array.isArray(data.events) ? data.events : [];

  // normalisasi event
  data.events = data.events.map(e => ({
    action: e.action || e.label || "Unknown",
    time: typeof e.time === "number" ? e.time : null
  }));
}

// =====================================
// RENDER MATCH INFO
// =====================================
function renderMatchInfo() {
  const m = data.metadata;

  document.getElementById("matchName").textContent = m.matchName || "-";
  document.getElementById("matchDate").textContent = m.matchDate || "-";
  document.getElementById("homeTeam").textContent = m.homeTeam || "-";
  document.getElementById("awayTeam").textContent = m.awayTeam || "-";
  document.getElementById("analyzedTeam").textContent =
    m.analyzedTeam || m.homeTeam || "-";
  document.getElementById("analyst").textContent = m.analyst || "-";
}

// =====================================
// SUMMARY (AUTO INSIGHT)
// =====================================
function renderSummary() {
  const events = data.events;

  document.getElementById("totalEvents").textContent = events.length;

  if (events.length === 0) {
    insightEl.textContent =
      "No actions recorded. Analytics will appear once events are logged.";
    return;
  }

  const actionCount = {};
  const timeBuckets = {};

  events.forEach(e => {
    actionCount[e.action] = (actionCount[e.action] || 0) + 1;

    if (e.time !== null) {
      const minute = Math.floor(e.time / 60);
      timeBuckets[minute] = (timeBuckets[minute] || 0) + 1;
    }
  });

  const dominant = Object.entries(actionCount)
    .sort((a, b) => b[1] - a[1])[0];

  const peakMinute = Object.entries(timeBuckets)
    .sort((a, b) => b[1] - a[1])[0];

  document.getElementById("dominantAction").textContent = dominant[0];
  document.getElementById("peakMinute").textContent =
    peakMinute ? `${peakMinute[0]}'` : "-";

  const pct = Math.round((dominant[1] / events.length) * 100);

  insightEl.textContent =
    `The most frequently logged action was "${dominant[0]}", ` +
    `representing ${pct}% of all recorded events.`;
}

// =====================================
// ACTION DISTRIBUTION (LABEL AGNOSTIC)
// =====================================
function renderActionDistribution() {
  const container = document.getElementById("actionList");
  container.innerHTML = "";

  const map = {};
  data.events.forEach(e => {
    map[e.action] = (map[e.action] || 0) + 1;
  });

  Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .forEach(([label, count]) => {
      const row = document.createElement("div");
      row.className = "action-row";
      row.innerHTML = `
        <span>${label}</span>
        <strong>${count}</strong>
      `;
      container.appendChild(row);
    });
}
