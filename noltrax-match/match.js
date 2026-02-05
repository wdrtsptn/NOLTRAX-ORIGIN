let player = null;
let playerReady = false;
let isDrawing = false;
let startX, startY;

let pitchData = {
  pitch1: { arrows: [], players: [] },
  pitch2: { arrows: [], players: [] }
};

// ================================
// YOUTUBE – OPSI 1 (USER ACTION)
// ================================

function onYouTubeIframeAPIReady() {
  console.log("YouTube API ready");
}

function extractVideoID(url) {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]{11}).*/;
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

  // BUAT PLAYER HANYA SAAT USER KLIK
  if (!player) {
    player = new YT.Player("player", {
      height: "360",
      width: "100%",
      videoId: videoId,
      playerVars: {
        autoplay: 0,
        rel: 0,
        modestbranding: 1
      },
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
  const logList = document.getElementById("log");

  const li = document.createElement("li");
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
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ================================
// DRAG & DROP
// ================================

function allowDrop(ev) { ev.preventDefault(); }

function drag(ev) {
  const noInput = ev.target.querySelector(".player-no");
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
  const token = document.createElement("div");
  token.className = "player-token";
  token.innerText = number;
  token.style.left = x + "%";
  token.style.top = y + "%";
  token.oncontextmenu = e => { e.preventDefault(); token.remove(); };
  container.appendChild(token);
}

// ================================
// DRAWING
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
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  pitchData[pitchId].arrows.forEach(a =>
    drawArrow(ctx, a.startX, a.startY, a.endX, a.endY)
  );
}

// ================================
// SAVE SESSION
// ================================

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
  a.download = `match-${metadata.matchName || "export"}.json`;
  a.click();
                                                   }


// ================================
// EDIT ACTION BUTTONS
// ================================

// Tombol "Edit Actions" di atas video
const editActionsBtn = document.createElement("button");
editActionsBtn.innerText = "Edit Actions";
editActionsBtn.style.cssText = `
  position: absolute;
  top: -65px;
  right: 20px;
  z-index: 50;
  padding: 10px 16px;
  border-radius: 12px;
  border: none;
  background: #1e5eff;
  color: white;
  font-weight: bold;
  cursor: pointer;
`;
document.querySelector("#videoPanel").appendChild(editActionsBtn);

// Nama default tombol action
let actionButtons = ["Build-up", "Pressing", "CO-Press", "Counter", "Progressive", "Mid-OVR", "Back-OVR", "Transition"];

// Load dari localStorage kalau ada
const savedActions = JSON.parse(localStorage.getItem("actionButtons"));
if (savedActions) actionButtons = savedActions;

// Apply nama tombol ke UI + update event
function updateActionButtons() {
  const btnContainer = document.getElementById("tags");
  const btns = btnContainer.querySelectorAll("button");
  btns.forEach((btn, idx) => {
    btn.innerText = actionButtons[idx] || btn.innerText;
    btn.onclick = () => tagEvent(actionButtons[idx] || btn.innerText);
  });
}
updateActionButtons();

// Modal untuk edit semua tombol sekaligus
editActionsBtn.onclick = () => {
  // Modal container
  const modal = document.createElement("div");
  modal.style.cssText = `
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  `;

  // Modal content
  const content = document.createElement("div");
  content.style.cssText = `
    background: rgba(30,30,30,0.95);
    padding: 20px;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 300px;
  `;

  content.innerHTML = `<h3 style="color:white;margin-bottom:10px;">Edit Action Buttons</h3>`;

  const inputs = [];
  actionButtons.forEach((name, idx) => {
    const input = document.createElement("input");
    input.value = name;
    input.style.cssText = `
      padding: 8px;
      border-radius: 8px;
      border: none;
      outline: none;
      font-size: 14px;
    `;
    content.appendChild(input);
    inputs.push(input);
  });

  const saveBtn = document.createElement("button");
  saveBtn.innerText = "Save";
  saveBtn.style.cssText = `
    margin-top: 12px;
    padding: 10px;
    border-radius: 12px;
    border: none;
    background: #1e5eff;
    color: white;
    font-weight: bold;
    cursor: pointer;
  `;
  content.appendChild(saveBtn);

  const cancelBtn = document.createElement("button");
  cancelBtn.innerText = "Cancel";
  cancelBtn.style.cssText = `
    margin-top: 8px;
    padding: 10px;
    border-radius: 12px;
    border: none;
    background: #888;
    color: white;
    font-weight: bold;
    cursor: pointer;
  `;
  content.appendChild(cancelBtn);

  modal.appendChild(content);
  document.body.appendChild(modal);

  // Save action
  saveBtn.onclick = () => {
    inputs.forEach((inp, idx) => {
      actionButtons[idx] = inp.value || actionButtons[idx];
    });
    updateActionButtons();
    localStorage.setItem("actionButtons", JSON.stringify(actionButtons));
    modal.remove();
  };

  cancelBtn.onclick = () => modal.remove();
};
