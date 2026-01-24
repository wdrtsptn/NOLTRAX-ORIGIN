let player;
let events = [];
let isDrawing = false;
let startX, startY;
let pitchData = { pitch1: { arrows: [], players: [] }, pitch2: { arrows: [], players: [] } };

// --- 1. YOUTUBE API (FIXED LOGIC) ---
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: '360',
    width: '100%',
    videoId: '', // Kosong dulu
    playerVars: {
      'autoplay': 0,
      'rel': 0,
      'modestbranding': 1
    },
    events: {
      'onReady': () => console.log("YouTube Player Ready"),
      'onError': (e) => {
        if (e.data === 101 || e.data === 150) {
          alert("Video ini dilarang diputar di luar YouTube oleh pemiliknya (Embed Restricted).");
        } else {
          alert("Gagal memuat video. Pastikan URL benar.");
        }
      }
    }
  });
}

// Fungsi Ekstrak ID Video yang lebih sakti
function extractVideoID(url) {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length == 11) ? match[7] : null;
}

function loadVideo() {
  const url = document.getElementById('videoUrl').value.trim();
  if (!url) {
    alert("Paste URL dulu, Bro!");
    return;
  }
  
  const videoId = extractVideoID(url);
  
  if (videoId && player && player.loadVideoById) {
    player.loadVideoById(videoId);
    console.log("Loading Video ID:", videoId);
  } else {
    alert("URL YouTube tidak valid atau sistem belum siap.");
  }
}

// --- 2. EVENT LOGGING ---
function tagEvent(tagName) {
  if (!player || typeof player.getCurrentTime !== "function") return;
  const currentTime = Math.floor(player.getCurrentTime());
  const li = document.createElement('li');
  li.innerHTML = `<strong contenteditable="true">${tagName}</strong> <span>${formatTime(currentTime)}</span><br>
                  <input class="noteInput" placeholder="Add note...">`;
  document.getElementById('log').insertBefore(li, document.getElementById('log').firstChild);
  events.unshift({ tag: tagName, time: currentTime });
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// --- 3. DRAG & DROP LOGIC ---
function allowDrop(ev) { ev.preventDefault(); }

function drag(ev) {
  const noInput = ev.target.querySelector('.player-no');
  const val = noInput ? noInput.value : "?";
  ev.dataTransfer.setData("text", val);
}

function drop(ev) {
  ev.preventDefault();
  const val = ev.dataTransfer.getData("text");
  const pitchContainer = ev.currentTarget;
  const rect = pitchContainer.getBoundingClientRect();

  const x = ((ev.clientX - rect.left) / rect.width) * 100;
  const y = ((ev.clientY - rect.top) / rect.height) * 100;

  createPlayerToken(pitchContainer.id, val, x, y);
}

function createPlayerToken(pitchId, number, x, y) {
  const container = document.querySelector(`#${pitchId} .player-layer`);
  const token = document.createElement('div');
  token.className = 'player-token';
  token.innerText = number;
  token.style.left = x + "%";
  token.style.top = y + "%";
  token.oncontextmenu = (e) => { e.preventDefault(); token.remove(); };
  container.appendChild(token);
}

// --- 4. DRAWING PANAH ---
document.querySelectorAll('.pitch-canvas').forEach(canvas => {
  const ctx = canvas.getContext('2d');
  const resize = () => { 
    canvas.width = canvas.offsetWidth; 
    canvas.height = canvas.offsetHeight; 
    redrawCanvas(canvas.parentElement.id); 
  };
  window.addEventListener('resize', resize);
  setTimeout(resize, 200);

  canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    startX = e.clientX - rect.left; startY = e.clientY - rect.top;
  });
  canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;
    const rect = canvas.getBoundingClientRect();
    redrawCanvas(canvas.parentElement.id);
    drawArrow(ctx, startX, startY, e.clientX - rect.left, e.clientY - rect.top);
  });
  canvas.addEventListener('mouseup', (e) => {
    if (!isDrawing) return;
    isDrawing = false;
    const rect = canvas.getBoundingClientRect();
    pitchData[canvas.parentElement.id].arrows.push({ startX, startY, endX: e.clientX - rect.left, endY: e.clientY - rect.top });
  });
});

function drawArrow(ctx, fromX, fromY, toX, toY) {
  const headlen = 10;
  const angle = Math.atan2(toY - fromY, toX - fromX);
  ctx.strokeStyle = "#1e90ff"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(fromX, fromY); ctx.lineTo(toX, toY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(toX, toY);
  ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI/6), toY - headlen * Math.sin(angle - Math.PI/6));
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI/6), toY - headlen * Math.sin(angle + Math.PI/6));
  ctx.stroke();
}

function redrawCanvas(pitchId) {
  const canvas = document.querySelector(`#${pitchId} .pitch-canvas`);
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  pitchData[pitchId].arrows.forEach(a => drawArrow(ctx, a.startX, a.startY, a.endX, a.endY));
}

// --- 5. SAVE SESSION ---
function saveSession() {
  const metadata = {
    matchName: document.getElementById("matchName").value,
    matchDate: document.getElementById("matchDate").value,
    homeTeam: document.getElementById("homeTeam").value,
    awayTeam: document.getElementById("awayTeam").value,
    analyst: document.getElementById("analyst").value,
    analyzedTeam: document.getElementById("analyzedTeam").value
  };

  const logData = Array.from(document.querySelectorAll("#log li")).map(li => ({
    tag: li.querySelector("strong").innerText,
    time: li.querySelector("span").innerText,
    note: li.querySelector(".noteInput").value
  }));

  const notes = {};
  document.querySelectorAll(".note-item").forEach(item => {
    notes[item.querySelector("span").innerText] = item.querySelector("textarea").value;
  });

  ['pitch1', 'pitch2'].forEach(id => {
    pitchData[id].players = Array.from(document.querySelectorAll(`#${id} .player-token`)).map(t => ({
      no: t.innerText, x: t.style.left, y: t.style.top
    }));
  });

  const session = { metadata, events: logData, notes, pitchData };
  const blob = new Blob([JSON.stringify(session, null, 2)], {type: "application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${metadata.matchName || 'match'}.json`;
  a.click();
    }
