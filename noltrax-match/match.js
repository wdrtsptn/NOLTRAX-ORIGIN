let player = null;
let playerReady = false;
let isDrawing = false;
let startX, startY;

// ================================
// CORE DATA STORE (FINAL)
// ================================

let eventTimeline = []; // raw event log

let squadData = {
starters: [],
substitutes: []
};

let pitchData = {
pitch1: { half: 1, arrows: [], players: [] },
pitch2: { half: 2, arrows: [], players: [] }
};

// ================================
// YOUTUBE
// ================================

function onYouTubeIframeAPIReady() {
console.log("YouTube API ready");
}

function extractVideoID(url) {
const regExp =
/^.((youtu.be/)|(v/)|(/u/\w/)|(embed/)|(watch?))??v?=?([^#&?]{11})./;
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
if (!player || !playerReady) {
alert("Video belum siap");
return;
}

const currentTime = Math.floor(player.getCurrentTime());

eventTimeline.push({
action: tagName,
time: currentTime
});

const logList = document.getElementById("log");
const li = document.createElement("li");
li.innerHTML =   <div class="log-header">   <strong>${tagName}</strong>   <span>${formatTime(currentTime)}</span>   </div>   <input class="log-note" placeholder="Add note...">  ;
logList.insertBefore(li, logList.firstChild);
}

function formatTime(sec) {
const m = Math.floor(sec / 60);
const s = sec % 60;
return ${m}:${s.toString().padStart(2, "0")};
}

// ================================
// PLAYER TOKENS
// ================================

function allowDrop(ev) {
ev.preventDefault();
}

function drag(ev) {
ev.dataTransfer.setData("text", ev.target.value);
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
const container = document.querySelector(#${pitchId} .player-layer);
const token = document.createElement("div");
token.className = "player-token";
token.innerText = number;
token.style.left = x + "%";
token.style.top = y + "%";

pitchData[pitchId].players.push({ number, x, y });

token.oncontextmenu = e => {
e.preventDefault();
token.remove();
};

container.appendChild(token);
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
const rect = canvas.getBoundingClientRect();
startX = e.clientX - rect.left;
startY = e.clientY - rect.top;
});

canvas.addEventListener("mousemove", e => {
if (!isDrawing) return;
const rect = canvas.getBoundingClientRect();
redrawCanvas(canvas.parentElement.id);
drawArrow(ctx, startX, startY, e.clientX - rect.left, e.clientY - rect.top);
});

canvas.addEventListener("mouseup", e => {
if (!isDrawing) return;
isDrawing = false;
const rect = canvas.getBoundingClientRect();

pitchData[canvas.parentElement.id].arrows.push({  
  startX,  
  startY,  
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
const canvas = document.querySelector(#${pitchId} .pitch-canvas);
if (!canvas) return;
const ctx = canvas.getContext("2d");
ctx.clearRect(0, 0, canvas.width, canvas.height);
pitchData[pitchId].arrows.forEach(a =>
drawArrow(ctx, a.startX, a.startY, a.endX, a.endY)
);
}

// ================================
// SAVE SESSION → FINAL JSON
// ================================

function saveSession() {
const meta = {
matchName: document.getElementById("matchName").value || "",
matchDate: document.getElementById("matchDate").value || "",
homeTeam: document.getElementById("homeTeam").value || "",
awayTeam: document.getElementById("awayTeam").value || "",
analyzedTeam: document.getElementById("homeTeam").value || "",
analyst: "Noltrax Analyst"
};

const session = {
meta,
squad: squadData,
strategyBoard: pitchData,
summary: {},
actionDistribution: {},
timelineDensity: {},
actionRhythm: {},
events: eventTimeline,
source: "noltrax_match",
savedAt: new Date().toISOString()
};

const blob = new Blob(
[JSON.stringify(session, null, 2)],
{ type: "application/json" }
);

const fileName =
(meta.matchName || "noltrax_match").replace(/\s+/g, "_") + ".json";

const a = document.createElement("a");
a.href = URL.createObjectURL(blob);
a.download = fileName;
a.click();
URL.revokeObjectURL(a.href);

alert("JSON locked & exported ✔");
}
