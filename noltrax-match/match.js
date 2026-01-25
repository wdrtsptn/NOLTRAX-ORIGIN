let player;
let isDrawing = false;
let startX, startY;
let pitchData = { pitch1: { arrows: [], players: [] }, pitch2: { arrows: [], players: [] } };

// ================= YOUTUBE API FIX =================

// Pastikan API keload dulu (DESKTOP FIX)
(function loadYouTubeAPI() {
  if (window.YT && window.YT.Player) return;
  const tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
})();

function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    width: '100%',
    height: '100%',
    videoId: '',
    playerVars: {
      autoplay: 0,
      rel: 0,
      modestbranding: 1,
      playsinline: 1
      // ❌ origin DIHAPUS (ini biang kerok desktop)
    },
    events: {
      onReady: () => console.log("YouTube Player READY"),
      onError: (e) => {
        console.error("YT Error:", e.data);
        alert("YouTube Error (Desktop): " + e.data);
      }
    }
  });
}

function extractVideoID(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v");
  } catch (e) {}
  return null;
}

function loadVideo() {
  const url = document.getElementById('videoUrl').value.trim();
  const videoId = extractVideoID(url);

  if (!videoId) {
    alert("URL YouTube gak valid");
    return;
  }

  if (!player || typeof player.loadVideoById !== "function") {
    alert("YouTube Player belum siap. Refresh halaman.");
    return;
  }

  player.loadVideoById(videoId);
}

// ================= EVENT LOG =================
function tagEvent(tagName) {
  if (!player || typeof player.getCurrentTime !== "function") return;

  const currentTime = Math.floor(player.getCurrentTime());
  const logList = document.getElementById('log');

  const li = document.createElement('li');
  li.innerHTML = `
    <div class="log-header">
      <strong contenteditable="true">${tagName}</strong>
      <span>${formatTime(currentTime)}</span>
    </div>
    <input class="log-note" placeholder="Add note...">
  `;
  logList.insertBefore(li, logList.firstChild);
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ================= DRAG & DROP (TETEP) =================
function allowDrop(ev) { ev.preventDefault(); }

function drag(ev) {
  const noInput = ev.target.querySelector('.player-no');
  ev.dataTransfer.setData("text", noInput ? noInput.value : "?");
}

function drop(ev) {
  ev.preventDefault();
  const val = ev.dataTransfer.getData("text");
  const rect = ev.currentTarget.getBoundingClientRect();
  const x = ((ev.clientX - rect.left) / rect.width) * 100;
  const y = ((ev.clientY - rect.top) / rect.height) * 100;
  createPlayerToken(ev.currentTarget.id, val, x, y);
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

// ================= DRAWING (TETEP) =================
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
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;
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
    pitchData[canvas.parentElement.id].arrows.push({
      startX, startY,
      endX: e.clientX - rect.left,
      endY: e.clientY - rect.top
    });
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
  ctx.lineTo(
    toX - headlen * Math.cos(angle - Math.PI / 6),
    toY - headlen * Math.sin(angle - Math.PI / 6)
  );
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headlen * Math.cos(angle + Math.PI / 6),
    toY - headlen * Math.sin(angle + Math.PI / 6)
  );
  ctx.stroke();
}

function redrawCanvas(pitchId) {
  const canvas = document.querySelector(`#${pitchId} .pitch-canvas`);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  pitchData[pitchId].arrows.forEach(a =>
    drawArrow(ctx, a.startX, a.startY, a.endX, a.endY)
  );
}

// ================= SAVE =================
function saveSession() {
  const metadata = {
    matchName: document.getElementById("matchName").value,
    matchDate: document.getElementById("matchDate").value,
    homeTeam: document.getElementById("homeTeam").value,
    awayTeam: document.getElementById("awayTeam").value
  };

  const session = { metadata, pitchData };
  const blob = new Blob([JSON.stringify(session, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `match-${metadata.matchName || "session"}.json`;
  a.click();
    }
