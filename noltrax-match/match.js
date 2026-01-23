let player;
let events = [];

// DRAWING DATA
let isDrawing = false;
let startX, startY;

let pitchData = {
  pitch1: { arrows: [], players: [] },
  pitch2: { arrows: [], players: [] }
};

/* ---------------- YOUTUBE API ---------------- */
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: '360',
    width: '100%',
    videoId: '',
    events: { onReady: () => {}, onError: () => alert("Video error") }
  });
}

function extractVideoID(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v");
  } catch {}
  return null;
}

function loadVideo() {
  const id = extractVideoID(document.getElementById("videoUrl").value);
  if (id && player) player.loadVideoById(id);
}

/* ---------------- DRAG NUMBER → PITCH ---------------- */
function allowDrop(ev) {
  ev.preventDefault();
}

function drag(ev) {
  ev.dataTransfer.setData("text/plain", ev.target.value || "?");
}

function drop(ev) {
  ev.preventDefault();

  const pitch = ev.currentTarget;
  const pitchId = pitch.id;
  const rect = pitch.getBoundingClientRect();

  const x = ((ev.clientX - rect.left) / rect.width) * 100;
  const y = ((ev.clientY - rect.top) / rect.height) * 100;

  const number = ev.dataTransfer.getData("text/plain");
  createPlayerToken(pitchId, number, x, y);
}

function createPlayerToken(pitchId, number, x, y) {
  const layer = document.querySelector(`#${pitchId} .player-layer`);

  const token = document.createElement("div");
  token.className = "player-token";
  token.innerText = number;
  token.style.left = `${x}%`;
  token.style.top = `${y}%`;

  enableTokenDrag(token, pitchId);

  token.oncontextmenu = e => {
    e.preventDefault();
    token.remove();
    updatePitchData();
  };

  layer.appendChild(token);
  updatePitchData();
}

/* ---------------- DRAG TOKEN DI DALAM PITCH ---------------- */
function enableTokenDrag(token, pitchId) {
  token.addEventListener("mousedown", e => {
    e.stopPropagation();

    const pitch = token.parentElement;
    const rect = pitch.getBoundingClientRect();

    const move = ev => {
      const x = ((ev.clientX - rect.left) / rect.width) * 100;
      const y = ((ev.clientY - rect.top) / rect.height) * 100;
      token.style.left = `${x}%`;
      token.style.top = `${y}%`;
    };

    const up = () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      updatePitchData();
    };

    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  });
}

/* ---------------- CANVAS PANAH (TIDAK DIUBAH) ---------------- */
document.querySelectorAll(".pitch-canvas").forEach(canvas => {
  const ctx = canvas.getContext("2d");

  const resize = () => {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    redrawCanvas(canvas.parentElement.id);
  };
  window.addEventListener("resize", resize);
  setTimeout(resize, 100);

  canvas.addEventListener("mousedown", e => {
    isDrawing = true;
    const r = canvas.getBoundingClientRect();
    startX = e.clientX - r.left;
    startY = e.clientY - r.top;
  });

  canvas.addEventListener("mousemove", e => {
    if (!isDrawing) return;
    const r = canvas.getBoundingClientRect();
    redrawCanvas(canvas.parentElement.id);
    drawArrow(ctx, startX, startY, e.clientX - r.left, e.clientY - r.top);
  });

  canvas.addEventListener("mouseup", e => {
    if (!isDrawing) return;
    isDrawing = false;
    const r = canvas.getBoundingClientRect();
    pitchData[canvas.parentElement.id].arrows.push({
      startX,
      startY,
      endX: e.clientX - r.left,
      endY: e.clientY - r.top
    });
  });
});

function drawArrow(ctx, x1, y1, x2, y2) {
  const h = 10;
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.strokeStyle = "#1e90ff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - h * Math.cos(a - Math.PI / 6), y2 - h * Math.sin(a - Math.PI / 6));
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - h * Math.cos(a + Math.PI / 6), y2 - h * Math.sin(a + Math.PI / 6));
  ctx.stroke();
}

function redrawCanvas(id) {
  const canvas = document.querySelector(`#${id} .pitch-canvas`);
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  pitchData[id].arrows.forEach(a => drawArrow(ctx, a.startX, a.startY, a.endX, a.endY));
}

/* ---------------- SYNC DATA ---------------- */
function updatePitchData() {
  ["pitch1", "pitch2"].forEach(id => {
    pitchData[id].players = [...document.querySelectorAll(`#${id} .player-token`)].map(t => ({
      no: t.innerText,
      x: t.style.left,
      y: t.style.top
    }));
  });
}
