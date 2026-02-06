let player = null;
let playerReady = false;
let isDrawing = false;
let startX, startY;

// ================================
// DATA STORE (FINAL – MATCH → DATA READY)
// ================================

let eventTimeline = [];

let pitchData = {
  pitch1: { half: 1, arrows: [], players: [] },
  pitch2: { half: 2, arrows: [], players: [] }
};

let squadData = {
  startingXI: [],
  substitutes: []
};

const actionButtons = [];

// ================================
// YOUTUBE
// ================================

function onYouTubeIframeAPIReady() {
  console.log("YouTube API ready");
}

function extractVideoID(url) {
  const regExp =
    /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]{11}).*/;
  const match = url.match(regExp);
  return match ? match[7] : null;
}

function loadVideo() {
  const url = document.getElementById("videoUrl").value.trim();
  const videoId = extractVideoID(url);

  if (!videoId) {
    alert("URL YouTube tidak valid");
    return;
  }

  if (!player) {
    player = new YT.Player("player", {
      height: "360",
      width: "100%",
      videoId,
      playerVars: { autoplay: 0, rel: 0, modestbranding: 1 },
      events: {
        onReady: () => {
          playerReady = true;
          player.playVideo();
        }
      }
    });
  } else {
    player.loadVideoById(videoId);
  }
}

// ================================
// EVENT LOGGING
// ================================

function tagEvent(tagName) {
  if (!player || !playerReady) return;

  const currentTime = Math.floor(player.getCurrentTime());

  eventTimeline.push({
    actionType: tagName,
    time: currentTime
  });

  const logList = document.getElementById("log");
  const li = document.createElement("li");
  li.innerHTML = `
    <strong>${tagName}</strong>
    <span>${formatTime(currentTime)}</span>
  `;
  logList.prepend(li);
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ================================
// PLAYER TOKENS
// ================================

function allowDrop(ev) {
  ev.preventDefault();
}

function drag(ev) {
  ev.dataTransfer.setData("text", ev.target.value || "?");
}

function drop(ev) {
  ev.preventDefault();
  const number = ev.dataTransfer.getData("text");
  const rect = ev.currentTarget.getBoundingClientRect();

  const x = ((ev.clientX - rect.left) / rect.width) * 100;
  const y = ((ev.clientY - rect.top) / rect.height) * 100;

  createPlayerToken(ev.currentTarget.id, number, x, y);
}

function createPlayerToken(pitchId, number, x, y) {
  const layer = document.querySelector(`#${pitchId} .player-layer`);
  const token = document.createElement("div");
  token.className = "player-token";
  token.innerText = number;
  token.style.left = `${x}%`;
  token.style.top = `${y}%`;

  pitchData[pitchId].players.push({ number, x, y });

  token.oncontextmenu = e => {
    e.preventDefault();
    token.remove();
  };

  layer.appendChild(token);
}

// ================================
// STRATEGY BOARD (ARROWS)
// ================================

document.querySelectorAll(".pitch-canvas").forEach(canvas => {
  const ctx = canvas.getContext("2d");

  const resize = () => {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    redrawCanvas(canvas.parentElement.id);
  };

  window.addEventListener("resize", resize);
  setTimeout(resize, 200);

  canvas.addEventListener("mousedown", e => {
    isDrawing = true;
    const r = canvas.getBoundingClientRect();
    startX = e.clientX - r.left;
    startY = e.clientY - r.top;
  });

  canvas.addEventListener("mouseup", e => {
    if (!isDrawing) return;
    isDrawing = false;

    const r = canvas.getBoundingClientRect();
    const endX = e.clientX - r.left;
    const endY = e.clientY - r.top;

    pitchData[canvas.parentElement.id].arrows.push({
      startX,
      startY,
      endX,
      endY
    });

    redrawCanvas(canvas.parentElement.id);
  });
});

function drawArrow(ctx, a) {
  ctx.strokeStyle = "#1e5eff";
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(a.startX, a.startY);
  ctx.lineTo(a.endX, a.endY);
  ctx.stroke();
}

function redrawCanvas(pitchId) {
  const canvas = document.querySelector(`#${pitchId} .pitch-canvas`);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  pitchData[pitchId].arrows.forEach(a => drawArrow(ctx, a));
}

// ================================
// SAVE SESSION → FINAL JSON
// ================================

function saveSession() {
  const metadata = {
    matchName: document.getElementById("matchName").value || "",
    matchDate: document.getElementById("matchDate").value || "",
    homeTeam: document.getElementById("homeTeam").value || "",
    awayTeam: document.getElementById("awayTeam").value || "",
    analyzedTeam: document.getElementById("homeTeam").value || "",
    analyst: "Noltrax Analyst"
  };

  squadData.startingXI = Array.from(
    document.querySelectorAll(".starting-xi input")
  ).map(inp => ({ number: inp.value, name: inp.dataset.name || "" }));

  squadData.substitutes = Array.from(
    document.querySelectorAll(".subs input")
  ).map(inp => ({ number: inp.value, name: inp.dataset.name || "" }));

  const strategyBoard = {
    players: [
      ...pitchData.pitch1.players.map(p => ({ ...p, half: 1 })),
      ...pitchData.pitch2.players.map(p => ({ ...p, half: 2 }))
    ],
    arrows: [
      ...pitchData.pitch1.arrows.map(a => ({ ...a, half: 1 })),
      ...pitchData.pitch2.arrows.map(a => ({ ...a, half: 2 }))
    ]
  };

  const events = eventTimeline.map(e => ({
    action: e.actionType,
    time: e.time
  }));

  const session = {
    metadata,
    squad: squadData,
    strategyBoard,
    events,
    actionButtons,
    source: "noltrax_match",
    savedAt: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(session, null, 2)], {
    type: "application/json"
  });

  const fileName =
    (metadata.matchName || "noltrax_match").replace(/\s+/g, "_") +
    "_session.json";

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href);

  alert("JSON MATCH SIAP 🔥");
}
