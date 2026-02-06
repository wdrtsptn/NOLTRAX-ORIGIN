let data = null;

const uploadInput = document.getElementById("uploadJSON");
const exportBtn = document.getElementById("exportPDF");
const insightEl = document.getElementById("autoInsight");

uploadInput.addEventListener("change", handleUpload);
exportBtn.addEventListener("click", exportPDF);

function handleUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = evt => {
    data = JSON.parse(evt.target.result);
    normalizeData();
    renderMatchInfo();
    renderSquad();
    renderStrategyBoard();
    renderSummary();
    renderActionDistribution();
    renderTimeline();
    renderActionRhythm();
  };
  reader.readAsText(file);
}

function normalizeData() {
  data.metadata = data.metadata || {};
  data.events = Array.isArray(data.events) ? data.events : [];
  data.squad = data.squad || { startingXI: [], substitutes: [] };
  data.strategyBoard = data.strategyBoard || [];
}

function renderMatchInfo() {
  const m = data.metadata;
  matchName.textContent = m.matchName || "-";
  matchDate.textContent = m.matchDate || "-";
  homeTeam.textContent = m.homeTeam || "-";
  awayTeam.textContent = m.awayTeam || "-";
  analyzedTeam.textContent = m.analyzedTeam || m.homeTeam || "-";
  analyst.textContent = m.analyst || "-";
}

function renderSquad() {
  startingXI.innerHTML = "";
  substitutes.innerHTML = "";

  data.squad.startingXI.forEach(p => {
    const d = document.createElement("div");
    d.textContent = p.number;
    startingXI.appendChild(d);
  });

  data.squad.substitutes.forEach(p => {
    const d = document.createElement("div");
    d.textContent = p.number;
    substitutes.appendChild(d);
  });
}

/* STRATEGY BOARD */
function renderStrategyBoard() {
  const container = document.getElementById("strategyTokens");
  container.innerHTML = "";

  data.strategyBoard.forEach(p => {
    const t = document.createElement("div");
    t.className = "token";
    t.textContent = p.number;
    t.style.left = `${p.x}%`;
    t.style.top = `${p.y}%`;
    container.appendChild(t);
  });
}

function renderSummary() {
  const events = data.events;
  totalEvents.textContent = events.length;

  if (!events.length) {
    insightEl.textContent = "No actions recorded.";
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

  dominantAction.textContent = dominant[0];
  peakMinute.textContent = peak ? `${peak[0]}'` : "-";

  const pct = Math.round((dominant[1]/events.length)*100);
  insightEl.textContent = `Most logged action: "${dominant[0]}", ${pct}% of total events.`;
}

function renderActionDistribution() {
  actionList.innerHTML = "";
  const map = {};
  data.events.forEach(e => map[e.action] = (map[e.action] || 0) + 1);

  Object.entries(map)
    .sort((a,b)=>b[1]-a[1])
    .forEach(([k,v])=>{
      const d = document.createElement("div");
      d.innerHTML = `<span>${k}</span><strong>${v}</strong>`;
      actionList.appendChild(d);
    });
}

/* TIMELINE DENSITY */
function renderTimeline() {
  const canvas = document.getElementById("timelineCanvas");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0,0,canvas.width,canvas.height);

  const events = data.events.filter(e=>e.time!==null);
  if (!events.length) return;

  const maxTime = Math.max(...events.map(e=>e.time));
  const bucketCount = 10;
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

/* ACTION RHYTHM */
function renderActionRhythm() {
  const canvas = document.getElementById("rhythmCanvas");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0,0,canvas.width,canvas.height);

  const events = data.events;
  if(events.length<2) return;

  const intervals = [];
  let lastTime = null;
  events.forEach(e=>{
    if(e.time!==null){
      if(lastTime!==null) intervals.push(e.time-lastTime);
      lastTime = e.time;
    }
  });

  if(!intervals.length) return;

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

/* EXPORT PDF */
async function exportPDF() {
  if (!data) return alert("Upload JSON first");

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p","pt","a4");
  const sections = document.querySelectorAll(".card");

  let y = 20;
  for (const sec of sections) {
    const canvas = await html2canvas(sec,{scale:2});
    const w = pdf.internal.pageSize.getWidth()-40;
    const h = canvas.height*w/canvas.width;
    if (y+h > pdf.internal.pageSize.getHeight()) {
      pdf.addPage(); y=20;
    }
    pdf.addImage(canvas.toDataURL(),"PNG",20,y,w,h);
    y+=h+20;
  }

  pdf.save(`${data.metadata.matchName || "Noltrax"}_Report.pdf`);
}
