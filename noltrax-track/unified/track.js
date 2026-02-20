// ================================
// GLOBAL STATE
// ================================

let tracking = false;
let startTime = null;
let pausedTime = 0;
let timerInterval = null;
let eventLog = [];
let stats = {
  home: {
    possession: 0,
    passes: 0,
    shots: 0,
    goals: 0,
    tackles: 0,
    interceptions: 0,
    corners: 0,
    fouls: 0,
    dribbles: 0,
    keyPasses: 0,
    longBalls: 0,
    crosses: 0,
    offsides: 0
  },
  away: {
    possession: 0,
    passes: 0,
    shots: 0,
    goals: 0,
    tackles: 0,
    interceptions: 0,
    corners: 0,
    fouls: 0,
    dribbles: 0,
    keyPasses: 0,
    longBalls: 0,
    crosses: 0,
    offsides: 0
  }
};

// ================================
// DOM ELEMENTS
// ================================

const matchNameInput = document.getElementById("matchName");
const matchDateInput = document.getElementById("matchDate");
const homeTeamInput = document.getElementById("homeTeam");
const awayTeamInput = document.getElementById("awayTeam");

const startBtn = document.getElementById("startBtn");
const endBtn = document.getElementById("endBtn");
const exportBtn = document.getElementById("exportBtn");

const statusDiv = document.getElementById("status");
const timerDiv = document.getElementById("timer");
const logList = document.getElementById("log");

const homeTeamNameSpan = document.getElementById("homeTeamName");
const awayTeamNameSpan = document.getElementById("awayTeamName");

const toggleKeyboardBtn = document.getElementById("toggleKeyboard");
const keyboardGuide = document.getElementById("keyboardGuide");

// Set default date
matchDateInput.valueAsDate = new Date();

// ================================
// EVENT LISTENERS
// ================================

startBtn.addEventListener("click", startTracking);
endBtn.addEventListener("click", endMatch);
exportBtn.addEventListener("click", exportJSON);

// Keyboard toggle
toggleKeyboardBtn.addEventListener("click", () => {
  if (keyboardGuide.style.display === "none") {
    keyboardGuide.style.display = "block";
    toggleKeyboardBtn.textContent = "⌨️ Hide Keyboard Shortcuts";
  } else {
    keyboardGuide.style.display = "none";
    toggleKeyboardBtn.textContent = "⌨️ Show Keyboard Shortcuts";
  }
});

// Team name sync
homeTeamInput.addEventListener("input", () => {
  homeTeamNameSpan.textContent = homeTeamInput.value || "Home";
});

awayTeamInput.addEventListener("input", () => {
  awayTeamNameSpan.textContent = awayTeamInput.value || "Away";
});

// Keyboard shortcuts
document.addEventListener("keydown", handleKeyPress);

// ================================
// TRACKING FUNCTIONS
// ================================

function startTracking() {
  if (tracking) {
    pauseTracking();
    return;
  }

  if (!homeTeamInput.value || !awayTeamInput.value) {
    alert("❌ Please enter both team names before starting!");
    return;
  }

  tracking = true;
  if (!startTime) {
    startTime = Date.now() - pausedTime;
  } else {
    startTime = Date.now() - pausedTime;
  }
  
  startBtn.textContent = "⏸ Pause";
  startBtn.style.background = "#f59e0b";
  endBtn.disabled = false;
  
  statusDiv.textContent = "🟢 Tracking Active - Press keys to log events";
  statusDiv.classList.add("tracking");

  // Start timer
  timerInterval = setInterval(updateTimer, 1000);
  updateTimer();
}

function pauseTracking() {
  tracking = false;
  clearInterval(timerInterval);
  pausedTime = Date.now() - startTime;
  
  startBtn.textContent = "▶ Resume";
  startBtn.style.background = "#10b981";
  
  statusDiv.textContent = "⏸ Paused - Press SPACE to resume";
  statusDiv.classList.remove("tracking");
}

function endMatch() {
  if (!confirm("End match and finalize stats?")) return;
  
  tracking = false;
  clearInterval(timerInterval);
  
  startBtn.disabled = true;
  endBtn.disabled = true;
  exportBtn.disabled = false;
  
  statusDiv.textContent = "✅ Match Ended - Ready to export";
  statusDiv.classList.remove("tracking");
}

function updateTimer() {
  if (!startTime) return;
  
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  
  timerDiv.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// ================================
// KEYBOARD HANDLER (FIXED)
// ================================

function handleKeyPress(e) {
  // Ignore if typing in input
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  
  const key = e.key.toLowerCase();
  const shift = e.shiftKey;
  
  // Controls
  if (key === ' ') {
    e.preventDefault();
    if (!startTime) {
      startTracking();
    } else if (tracking) {
      pauseTracking();
    } else {
      startTracking();
    }
    return;
  }
  
  if (key === 'q') {
    e.preventDefault();
    undoLast();
    return;
  }
  
  if (key === 'w') {
    e.preventDefault();
    endMatch();
    return;
  }
  
  if (key === 'e') {
    e.preventDefault();
    if (!exportBtn.disabled) {
      exportJSON();
    }
    return;
  }
  
  if (key === 'r') {
    e.preventDefault();
    if (confirm("Reset all stats? This cannot be undone!")) {
      resetAll();
    }
    return;
  }
  
  // Only log events if tracking is active
  if (!tracking) return;
  
  const team = shift ? 'away' : 'home';
  let eventType = null;
  
  // Map keys to event types
  switch(key) {
    case 'b': eventType = 'possession'; break;
    case 'p': eventType = 'passes'; break;
    case 's': eventType = 'shots'; break;
    case 'g': eventType = 'goals'; break;
    case 't': eventType = 'tackles'; break;
    case 'i': eventType = 'interceptions'; break;
    case 'c': eventType = 'corners'; break;
    case 'f': eventType = 'fouls'; break;
    case 'd': eventType = 'dribbles'; break;
    case 'k': eventType = 'keyPasses'; break;
    case 'l': eventType = 'longBalls'; break;
    case 'x': eventType = 'crosses'; break;
    case 'o': eventType = 'offsides'; break;
    default: return;
  }
  
  if (eventType) {
    e.preventDefault();
    logEvent(team, eventType);
  }
}

// ================================
// EVENT LOGGING (FIXED)
// ================================

function logEvent(team, eventType) {
  console.log(`Logging event: ${team} - ${eventType}`);
  
  // Increment stat
  stats[team][eventType]++;
  
  // Get current time
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timestamp = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  
  // Create event object
  const event = {
    team,
    type: eventType,
    timestamp,
    time: elapsed
  };
  
  eventLog.push(event);
  console.log("Event logged:", event);
  
  // Update UI
  updateStats();
  updateLog();
  updatePossession();
}

function updateStats() {
  // Home team
  document.getElementById("homePossessionCount").textContent = stats.home.possession;
  document.getElementById("homePasses").textContent = stats.home.passes;
  document.getElementById("homeShots").textContent = stats.home.shots;
  document.getElementById("homeGoals").textContent = stats.home.goals;
  document.getElementById("homeTackles").textContent = stats.home.tackles;
  document.getElementById("homeInterceptions").textContent = stats.home.interceptions;
  document.getElementById("homeCorners").textContent = stats.home.corners;
  document.getElementById("homeFouls").textContent = stats.home.fouls;
  document.getElementById("homeDribbles").textContent = stats.home.dribbles;
  document.getElementById("homeKeyPasses").textContent = stats.home.keyPasses;
  document.getElementById("homeLongBalls").textContent = stats.home.longBalls;
  document.getElementById("homeCrosses").textContent = stats.home.crosses;
  document.getElementById("homeOffsides").textContent = stats.home.offsides;
  
  // Away team
  document.getElementById("awayPossessionCount").textContent = stats.away.possession;
  document.getElementById("awayPasses").textContent = stats.away.passes;
  document.getElementById("awayShots").textContent = stats.away.shots;
  document.getElementById("awayGoals").textContent = stats.away.goals;
  document.getElementById("awayTackles").textContent = stats.away.tackles;
  document.getElementById("awayInterceptions").textContent = stats.away.interceptions;
  document.getElementById("awayCorners").textContent = stats.away.corners;
  document.getElementById("awayFouls").textContent = stats.away.fouls;
  document.getElementById("awayDribbles").textContent = stats.away.dribbles;
  document.getElementById("awayKeyPasses").textContent = stats.away.keyPasses;
  document.getElementById("awayLongBalls").textContent = stats.away.longBalls;
  document.getElementById("awayCrosses").textContent = stats.away.crosses;
  document.getElementById("awayOffsides").textContent = stats.away.offsides;
}

function updateLog() {
  console.log("Updating log. Total events:", eventLog.length);
  logList.innerHTML = "";
  
  // Show last 20 events (reverse chronological)
  const recentEvents = eventLog.slice(-20).reverse();
  
  recentEvents.forEach(event => {
    const li = document.createElement("li");
    li.className = event.team;
    
    const eventName = formatEventName(event.type);
    const teamName = event.team === 'home' ? homeTeamInput.value : awayTeamInput.value;
    
    li.innerHTML = `
      <strong>${eventName} (${teamName})</strong>
      <span>${event.timestamp}</span>
    `;
    
    logList.appendChild(li);
  });
}

function updatePossession() {
  const homePoss = stats.home.possession;
  const awayPoss = stats.away.possession;
  const total = homePoss + awayPoss;
  
  if (total === 0) {
    document.getElementById("homePossession").textContent = "50%";
    document.getElementById("awayPossession").textContent = "50%";
    document.getElementById("homePossessionBar").style.width = "50%";
    return;
  }
  
  const homePercent = Math.round((homePoss / total) * 100);
  const awayPercent = 100 - homePercent;
  
  document.getElementById("homePossession").textContent = homePercent + "%";
  document.getElementById("awayPossession").textContent = awayPercent + "%";
  document.getElementById("homePossessionBar").style.width = homePercent + "%";
}

function formatEventName(type) {
  const names = {
    possession: "Possession",
    passes: "Pass",
    shots: "Shot",
    goals: "Goal",
    tackles: "Tackle",
    interceptions: "Interception",
    corners: "Corner",
    fouls: "Foul",
    dribbles: "Dribble",
    keyPasses: "Key Pass",
    longBalls: "Long Ball",
    crosses: "Cross",
    offsides: "Offside"
  };
  
  return names[type] || type;
}

// ================================
// UTILITY FUNCTIONS
// ================================

function undoLast() {
  if (eventLog.length === 0) {
    alert("No events to undo!");
    return;
  }
  
  const lastEvent = eventLog.pop();
  stats[lastEvent.team][lastEvent.type]--;
  
  updateStats();
  updateLog();
  updatePossession();
  
  console.log("Undone:", lastEvent);
}

function resetAll() {
  tracking = false;
  startTime = null;
  pausedTime = 0;
  clearInterval(timerInterval);
  eventLog = [];
  
  stats = {
    home: {
      possession: 0, passes: 0, shots: 0, goals: 0, tackles: 0, interceptions: 0,
      corners: 0, fouls: 0, dribbles: 0, keyPasses: 0, longBalls: 0,
      crosses: 0, offsides: 0
    },
    away: {
      possession: 0, passes: 0, shots: 0, goals: 0, tackles: 0, interceptions: 0,
      corners: 0, fouls: 0, dribbles: 0, keyPasses: 0, longBalls: 0,
      crosses: 0, offsides: 0
    }
  };
  
  timerDiv.textContent = "00:00";
  logList.innerHTML = "";
  
  startBtn.textContent = "🎬 Start Tracking";
  startBtn.style.background = "#10b981";
  startBtn.disabled = false;
  endBtn.disabled = true;
  exportBtn.disabled = true;
  
  statusDiv.textContent = "Press SPACE to start tracking";
  statusDiv.classList.remove("tracking");
  
  updateStats();
  updatePossession();
}

// ================================
// EXPORT FUNCTION
// ================================

function exportJSON() {
  const data = {
    meta: {
      matchName: matchNameInput.value,
      matchDate: matchDateInput.value,
      homeTeam: homeTeamInput.value,
      awayTeam: awayTeamInput.value,
      duration: timerDiv.textContent,
      exportedAt: new Date().toISOString()
    },
    stats: {
      home: stats.home,
      away: stats.away
    },
    possession: {
      home: document.getElementById("homePossession").textContent,
      away: document.getElementById("awayPossession").textContent
    },
    eventLog: eventLog,
    source: "noltrax-track"
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${matchNameInput.value.replace(/\s/g, "_")}_${matchDateInput.value}_stats.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  alert("✅ Stats exported successfully!");
}

// ================================
// INIT
// ================================

console.log("Noltrax Track loaded! Press SPACE to start tracking.");
console.log("Event log array:", eventLog);
