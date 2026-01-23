let player;
let events = [];
const MAX_TAGS = 6;

// Logic Drawing & Pitch Data
let isDrawing = false;
let startX, startY;
let currentPitch = null;
let pitchData = { pitch1: { arrows: [], players: [] }, pitch2: { arrows: [], players: [] } };

// ------------------ YOUTUBE API (TETEP SAMA) ------------------
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: '360', width: '100%', videoId: '',
    events: { 'onReady': onPlayerReady, 'onError': onPlayerError }
  });
}
function onPlayerReady(event) { console.log("Player ready!"); }
function onPlayerError(event) { alert("Video error / blocked."); }

function extractVideoID(url) {
  try {
    const urlObj = new URL(url);
    if(urlObj.hostname.includes("youtu.be")) return urlObj.pathname.slice(1);
    if(urlObj.hostname.includes("youtube.com")) return urlObj.searchParams.get("v");
  } catch(e) { console.error("Invalid URL", e); }
  return null;
}

function loadVideo() {
  const url = document.getElementById('videoUrl').value;
  const videoId = extractVideoID(url);
  if(videoId && player) player.loadVideoById(videoId);
  else alert("Invalid URL or Player not ready.");
}

// ------------------ TAG EVENT (TETEP SAMA) ------------------
function tagEvent(tagName) {
  if(!player) return;
  const currentTime = Math.floor(player.getCurrentTime());
  const li = document.createElement('li');
  li.innerHTML = `<strong contenteditable="true">${tagName}</strong> <span>${formatTime(currentTime)}</span><br>
                  <input class="noteInput" placeholder="Add note...">`;
  const logList = document.getElementById('log');
  logList.insertBefore(li, logList.firstChild);
  events.unshift({tag: tagName, time: currentTime, note: ''});
}

function formatTime(sec) {
  const m = Math.floor(sec/60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2,'0')}`;
}

// ------------------ DRAG & DROP NOMOR PEMAIN ------------------
function allowDrop(ev) { ev.preventDefault(); }

function drag(ev) {
  const playerNo = ev.target.querySelector('.player-no').value;
  ev.dataTransfer.setData("text", playerNo || "?");
}

function drop(ev) {
  ev.preventDefault();
  const data = ev.dataTransfer.getData("text");
  const pitchId = ev.currentTarget.id;
  const rect = ev.currentTarget.getBoundingClientRect();
  const x = ((ev.clientX - rect.left) / rect.width) * 100; // Simpen dlm persen biar responsif
  const y = ((ev.clientY - rect.top) / rect.height) * 100;

  createPlayerToken(pitchId, data, x, y);
}

function createPlayerToken(pitchId, number, x, y) {
  const container = document.querySelector(`#${pitchId} .player-layer`);
  const token = document.createElement('div');
  token.className = 'player-token';
  token.style.left = x + "%";
  token.style.top = y + "%";
  token.innerText = number;
  
  // Klik kanan buat hapus nomor
  token.oncontextmenu = (e) => { e.preventDefault(); token.remove(); updatePitchData(); };
  container.appendChild(token);
  updatePitchData();
}

// ------------------ DRAWING PANAH (CANVAS) ------------------
document.querySelectorAll('.pitch-canvas').forEach(canvas => {
  const ctx = canvas.getContext('2d');
  
  // Resize canvas biar pas
  const resize = () => {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    redrawCanvas(canvas.parentElement.id);
  };
  window.addEventListener('resize', resize);
  setTimeout(resize, 100);

  canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;
    const rect = canvas.getBoundingClientRect();
    const currX = e.clientX - rect.left;
    const currY = e.clientY - rect.top;
    
    redrawCanvas(canvas.parentElement.id);
    drawArrow(ctx, startX, startY, currX, currY);
  });

  canvas.addEventListener('mouseup', (e) => {
    if (!isDrawing) return;
    isDrawing = false;
    const rect = canvas.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;
    
    pitchData[canvas.parentElement.id].arrows.push({ startX, startY, endX, endY });
  });
});

function drawArrow(ctx, fromX, fromY, toX, toY) {
  const headlen = 10;
  const angle = Math.atan2(toY - fromY, toX - fromX);
  ctx.strokeStyle = "#1e90ff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
  ctx.stroke();
}

function redrawCanvas(pitchId) {
  const canvas = document.querySelector(`#${pitchId} .pitch-canvas`);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  pitchData[pitchId].arrows.forEach(a => drawArrow(ctx, a.startX, a.startY, a.endX, a.endY));
}

function updatePitchData() {
  // Logic buat sync elemen UI ke object pitchData sebelum save
  ['pitch1', 'pitch2'].forEach(id => {
    const tokens = document.querySelectorAll(`#${id} .player-token`);
    pitchData[id].players = Array.from(tokens).map(t => ({
      no: t.innerText, x: t.style.left, y: t.style.top
    }));
  });
}

// ------------------ SAVE SESSION (UPDATED) ------------------
function saveSession() {
  updatePitchData(); // Update data lapangan terbaru
  
  const metadata = {
    matchName: document.getElementById("matchName").value,
    matchDate: document.getElementById("matchDate").value,
    homeTeam: document.getElementById("homeTeam").value,
    awayTeam: document.getElementById("awayTeam").value,
    analyst: document.getElementById("analyst").value,
    analyzedTeam: document.getElementById("analyzedTeam").value
  };

  const logData = [];
  document.querySelectorAll("#log li").forEach((li, index) => {
    const note = li.querySelector(".noteInput").value;
    const tag = li.querySelector("strong").textContent;
    logData.push({ tag, time: events[index]?.time || 0, note });
  });

  const notes = {};
  document.querySelectorAll(".note-item").forEach(item => {
    const title = item.querySelector("span").innerText;
    notes[title] = item.querySelector("textarea").value;
  });

  const sessionData = { metadata, events: logData, pitchData, extraNotes: notes };
  
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sessionData, null, 2));
  const dlAnchor = document.createElement('a');
  dlAnchor.setAttribute("href", dataStr);
  dlAnchor.setAttribute("download", `${metadata.matchName || "session"}.json`);
  dlAnchor.click();
  
  alert("Session + Strategy Saved!");
      }
