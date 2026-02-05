// === LOAD DATA ===
const raw = localStorage.getItem("noltrax_match_data");
const data = raw ? JSON.parse(raw) : null;

if (!data) {
  document.getElementById("autoInsight").textContent =
    "No Noltrax Match data found.";
} else {
  renderMatchInfo();
  renderSummary();
  renderActionDistribution();
}

// === RENDER MATCH INFO ===
function renderMatchInfo() {
  const info = data.info;
  document.getElementById("matchName").textContent = info.matchName || "-";
  document.getElementById("matchDate").textContent = info.date || "-";
  document.getElementById("homeTeam").textContent = info.home || "-";
  document.getElementById("awayTeam").textContent = info.away || "-";
  document.getElementById("analyzedTeam").textContent = info.analyzedTeam || "-";
  document.getElementById("analyst").textContent = info.analyst || "-";
}

// === SUMMARY ===
function renderSummary() {
  const events = data.events || [];
  document.getElementById("totalEvents").textContent = events.length;

  if (events.length === 0) return;

  const actionCount = {};
  const minuteCount = {};

  events.forEach(e => {
    actionCount[e.action] = (actionCount[e.action] || 0) + 1;
    minuteCount[e.minute] = (minuteCount[e.minute] || 0) + 1;
  });

  const dominant = Object.entries(actionCount).sort((a,b)=>b[1]-a[1])[0];
  const peak = Object.entries(minuteCount).sort((a,b)=>b[1]-a[1])[0];

  document.getElementById("dominantAction").textContent = dominant[0];
  document.getElementById("peakMinute").textContent = peak[0];

  document.getElementById("autoInsight").textContent =
    `Most recorded action was "${dominant[0]}", accounting for ${Math.round(
      (dominant[1] / events.length) * 100
    )}% of all events.`;
}

// === ACTION DISTRIBUTION ===
function renderActionDistribution() {
  const container = document.getElementById("actionList");
  const events = data.events || [];
  const map = {};

  events.forEach(e => {
    map[e.action] = (map[e.action] || 0) + 1;
  });

  Object.entries(map).forEach(([label, count]) => {
    const row = document.createElement("div");
    row.innerHTML = `<span>${label}</span><strong>${count}</strong>`;
    container.appendChild(row);
  });
}

// PDF EXPORT akan nyusul
