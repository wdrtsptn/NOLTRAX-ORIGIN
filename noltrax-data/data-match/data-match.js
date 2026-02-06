let data = null;

const uploadInput = document.getElementById("uploadJSON");
uploadInput.addEventListener("change", handleUpload);

const insightEl = document.getElementById("autoInsight");

// ======================
// HANDLE FILE UPLOAD
// ======================
function handleUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = evt => {
    try {
      data = JSON.parse(evt.target.result);
      normalizeData();
      renderMatchInfo();
      renderSummary();
      renderActionDistribution();
      renderTimeline();
      renderActionRhythm();
    } catch (err) {
      alert("Invalid JSON file.");
      console.error(err);
    }
  };
  reader.readAsText(file);
}

// ======================
// NORMALIZE DATA
// ======================
function normalizeData() {
  data.metadata = data.metadata || {};
  data.events = Array.isArray(data.events) ? data.events : [];

  data.events = data.events.map(e => ({
    action: e.action || e.label || "Unknown",
    time: typeof e.time === "number" ? e.time : null
  }));
}

// ======================
// RENDER MATCH INFO
// ======================
function renderMatchInfo() {
  const m = data.metadata;
  document.getElementById("matchName").textContent = m.matchName || "-";
  document.getElementById("matchDate").textContent = m.matchDate || "-";
  document.getElementById("homeTeam").textContent = m.homeTeam || "-";
  document.getElementById("awayTeam").textContent = m.awayTeam || "-";
  document.getElementById("analyzedTeam").textContent = m.analyzedTeam || m.homeTeam || "-";
  document.getElementById("analyst").textContent = m.analyst || "-";
}

// ======================
// SUMMARY
// ======================
function renderSummary() {
  const events = data.events;
  document.getElementById("totalEvents").textContent = events.length;

  if (events.length === 0) {
    insightEl.textContent = "No actions recorded yet.";
    return;
  }

  const actionCount = {};
  const minuteCount = {};

  events.forEach(e => {
    actionCount[e.action] = (actionCount[e.action] || 0) + 1;
    if (e.time !== null) {
      const minute = Math.floor(e.time / 60);
      minuteCount[minute] = (minuteCount[minute] || 0) + 1;
    }
  });

  const dominant = Object.entries(actionCount).sort((a,b)=>b[1]-a[1])[0];
  const peak = Object.entries(minuteCount).sort((a,b)=>b[1]-a[1])[0];

  document.getElementById("dominantAction").textContent = dominant[0];
  document.getElementById("peakMinute").textContent = peak ? `${peak[0]}'` : "-";

  const pct = Math.round((dominant[1]/events.length)*100);
  insightEl.textContent = `Most logged action: "${dominant[0]}", ${pct}% of total events.`;
}

// ======================
// ACTION DISTRIBUTION
// ======================
function renderActionDistribution() {
  const container = document.getElementById("actionList");
  container.innerHTML = "";

  const map = {};
  data.events.forEach(e => {
    map[e.action] = (map[e.action] || 0) + 1;
  });

  Object.entries(map)
    .sort((a,b)=>b[1]-a[1])
    .forEach(([label,count]) => {
      const row = document.createElement("div");
      row.innerHTML = `<span>${label}</span><strong>${count}</strong>`;
      container.appendChild(row);
    });
}

// ======================
// TIMELINE DENSITY
// ======================
function renderTimeline() {
  const canvas = document.getElementById("timelineCanvas");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0,0,canvas.width,canvas.height);

  const events = data.events.filter(e=>e.time!==null);
  if (events.length===0) return;

  const maxTime = Math.max(...events.map(e=>e.time));
  const bucketCount = 10; // segments
  const bucketSize = Math.ceil(maxTime/bucketCount);
  const buckets = Array(bucketCount).fill(0);

  events.forEach(e=>{
    const b = Math.min(Math.floor(e.time/bucketSize), bucketCount-1);
    buckets[b]++;
  });

  const width = canvas.width;
  const height = canvas.height;
  const barWidth = width / bucketCount;

  ctx.fillStyle = "#1e5eff";
  buckets.forEach((val,i)=>{
    const barHeight = (val/Math.max(...buckets))*height;
    ctx.fillRect(i*barWidth, height-barHeight, barWidth-4, barHeight);
  });
}

// ======================
// ACTION RHYTHM
// ======================
function renderActionRhythm() {
  const canvas = document.getElementById("rhythmCanvas");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0,0,canvas.width,canvas.height);

  const events = data.events;
  if (events.length<2) return;

  const intervals = [];
  let lastTime = null;
  events.forEach(e=>{
    if (e.time!==null){
      if(lastTime!==null) intervals.push(e.time-lastTime);
      lastTime = e.time;
    }
  });

  if(intervals.length===0) return;

  const maxInt = Math.max(...intervals);
  const width = canvas.width;
  const height = canvas.height;
  const barWidth = width/intervals.length;

  ctx.fillStyle = "#1e5eff";
  intervals.forEach((val,i)=>{
    const barHeight = (val/maxInt)*height;
    ctx.fillRect(i*barWidth, height-barHeight, barWidth-2, barHeight);
  });
    }
