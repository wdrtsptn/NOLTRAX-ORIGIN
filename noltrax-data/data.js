// =====================================
// LOAD FROM NOLTRAX MATCH (ANTI RESET)
// =====================================
let data =
  JSON.parse(localStorage.getItem("noltrax_match_data")) ||
  JSON.parse(sessionStorage.getItem("noltrax_match_data"));

const insightEl = document.getElementById("autoInsight");

if (!data) {
  insightEl.textContent =
    "No Noltrax Match data found. Save a session in Noltrax Match first.";
} else {
  normalizeData();
  renderMatchInfo();
  renderSummary();
  renderActionDistribution();
  renderTimeline();
  renderRhythm();
}

// =====================================
// NORMALIZE
// =====================================
function normalizeData() {
  data.metadata = data.metadata || {};
  data.events = Array.isArray(data.events) ? data.events : [];

  data.events = data.events.map(e => ({
    action: e.action || e.label || "Unknown",
    time: typeof e.time === "number" ? e.time : null
  }));
}

// =====================================
// MATCH INFO
// =====================================
function renderMatchInfo() {
  const m = data.metadata;
  matchName.textContent = m.matchName || "-";
  matchDate.textContent = m.matchDate || "-";
  homeTeam.textContent = m.homeTeam || "-";
  awayTeam.textContent = m.awayTeam || "-";
  analyzedTeam.textContent = m.analyzedTeam || m.homeTeam || "-";
  analyst.textContent = m.analyst || "-";
}

// =====================================
// SUMMARY + AUTO INSIGHT
// =====================================
function renderSummary() {
  const events = data.events;
  totalEvents.textContent = events.length;

  if (!events.length) {
    insightEl.textContent = "No events recorded yet.";
    return;
  }

  const actionMap = {};
  const minuteMap = {};

  events.forEach(e => {
    actionMap[e.action] = (actionMap[e.action] || 0) + 1;
    if (e.time !== null) {
      const m = Math.floor(e.time / 60);
      minuteMap[m] = (minuteMap[m] || 0) + 1;
    }
  });

  const dominant = Object.entries(actionMap).sort((a,b)=>b[1]-a[1])[0];
  const peak = Object.entries(minuteMap).sort((a,b)=>b[1]-a[1])[0];

  dominantAction.textContent = dominant[0];
  peakMinute.textContent = peak ? peak[0] + "'" : "-";

  insightEl.textContent =
    `Most actions came from "${dominant[0]}", accounting for ${Math.round(dominant[1]/events.length*100)}% of total events.`;
}

// =====================================
// ACTION DISTRIBUTION
// =====================================
function renderActionDistribution() {
  actionList.innerHTML = "";
  const map = {};
  data.events.forEach(e => map[e.action] = (map[e.action]||0)+1);

  Object.entries(map).sort((a,b)=>b[1]-a[1]).forEach(([a,c])=>{
    const div = document.createElement("div");
    div.innerHTML = `<span>${a}</span><strong>${c}</strong>`;
    actionList.appendChild(div);
  });
}

// =====================================
// TIMELINE DENSITY (5-MIN BLOCK)
// =====================================
function renderTimeline() {
  timeline.innerHTML = "";
  const buckets = Array(18).fill(0);

  data.events.forEach(e=>{
    if(e.time!==null){
      const idx = Math.min(17, Math.floor(e.time/300));
      buckets[idx]++;
    }
  });

  buckets.forEach((v,i)=>{
    const d = document.createElement("div");
    d.textContent = `${i*5}-${i*5+5}`;
    d.style.opacity = Math.min(1, v/5);
    timeline.appendChild(d);
  });
}

// =====================================
// ACTION RHYTHM (INTENSITY BAR)
// =====================================
function renderRhythm() {
  rhythm.innerHTML = "";
  const chunks = Array(10).fill(0);

  data.events.forEach(e=>{
    if(e.time!==null){
      const idx = Math.min(9, Math.floor(e.time/540));
      chunks[idx]++;
    }
  });

  chunks.forEach(v=>{
    const d = document.createElement("div");
    d.style.opacity = Math.min(1, v/4);
    rhythm.appendChild(d);
  });
  }
