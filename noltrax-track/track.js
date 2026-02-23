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

// POSSESSION STOPWATCH VARIABLES
let homeElapsed = 0;
let awayElapsed = 0;
let possessionActive = null; // 'home', 'away', or null
let possessionStartTime = null;
let lastQPress = 0;
let possessionTimer = null;

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

const homeTimeEl = document.getElementById("homeTime");
const awayTimeEl = document.getElementById("awayTime");
const livePossessionEl = document.getElementById("livePossession");
const finalPossessionEl = document.getElementById("finalPossession");

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
  
  statusDiv.textContent = "🟢 Active";
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
  
  statusDiv.textContent = "⏸ Paused";
  statusDiv.classList.remove("tracking");
}

function endMatch() {
  if (!confirm("End match and finalize stats?")) return;
  
  tracking = false;
  clearInterval(timerInterval);
  stopAllPossession();
  
  startBtn.disabled = true;
  endBtn.disabled = true;
  exportBtn.disabled = false;
  
  statusDiv.textContent = "✅ Match Ended";
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
// POSSESSION STOPWATCH LOGIC
// ================================

function handleQPress() {
  const now = Date.now();
  
  // Double tap detection (< 400ms)
  if (now - lastQPress < 400) {
    stopAllPossession();
    lastQPress = 0;
    return;
  }
  
  lastQPress = now;
  
  // Toggle possession
  if (possessionActive === null) {
    startHomePossession();
  } else if (possessionActive === 'home') {
    switchToAwayPossession();
  } else if (possessionActive === 'away') {
    switchToHomePossession();
  }
}

function startHomePossession() {
  possessionActive = 'home';
  possessionStartTime = Date.now();
  runPossessionTimer();
}

function switchToAwayPossession() {
  stopPossessionTimer();
  const diff = Date.now() - possessionStartTime;
  if (possessionActive === 'home') homeElapsed += diff;
  
  possessionActive = 'away';
  possessionStartTime = Date.now();
  runPossessionTimer();
}

function switchToHomePossession() {
  stopPossessionTimer();
  const diff = Date.now() - possessionStartTime;
  if (possessionActive === 'away') awayElapsed += diff;
  
  possessionActive = 'home';
  possessionStartTime = Date.now();
  runPossessionTimer();
}

function stopAllPossession() {
  if (!possessionActive) return;
  
  stopPossessionTimer();
  const diff = Date.now() - possessionStartTime;
  
  if (possessionActive === 'home') homeElapsed += diff;
  else awayElapsed += diff;
  
  possessionActive = null;
  updatePossessionDisplay();
  showFinalPossession();
}

function runPossessionTimer() {
  stopPossessionTimer();
  possessionTimer = setInterval(() => {
    const diff = Date.now() - possessionStartTime;
    if (possessionActive === 'home') {
      homeTimeEl.textContent = formatTime(homeElapsed + diff);
    } else if (possessionActive === 'away') {
      awayTimeEl.textContent = formatTime(awayElapsed + diff);
    }
    updateLivePossession(diff);
  }, 200);
}

function stopPossessionTimer() {
  if (possessionTimer) {
    clearInterval(possessionTimer);
    possessionTimer = null;
  }
}

function updatePossessionDisplay() {
  homeTimeEl.textContent = formatTime(homeElapsed);
  awayTimeEl.textContent = formatTime(awayElapsed);
  updateLivePossession();
}

function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

function updateLivePossession(diff = 0) {
  const h = possessionActive === 'home' ? homeElapsed + diff : homeElapsed;
  const a = possessionActive === 'away' ? awayElapsed + diff : awayElapsed;
  const total = h + a;
  
  if (total <= 0) {
    livePossessionEl.textContent = '0% - 0%';
    return;
  }
  
  const homePct = ((h / total) * 100).toFixed(1);
  const awayPct = ((a / total) * 100).toFixed(1);
  livePossessionEl.textContent = `${homePct}% - ${awayPct}%`;
}

function showFinalPossession() {
  const total = homeElapsed + awayElapsed;
  if (total <= 0) {
    finalPossessionEl.textContent = '';
    return;
  }
  
  const homePct = ((homeElapsed / total) * 100).toFixed(1);
  const awayPct = ((awayElapsed / total) * 100).toFixed(1);
  finalPossessionEl.textContent = `Final: Home ${homePct}% — Away ${awayPct}%`;
}

function resetPossessionStopwatch() {
  stopPossessionTimer();
  possessionActive = null;
  homeElapsed = 0;
  awayElapsed = 0;
  updatePossessionDisplay();
  finalPossessionEl.textContent = '';
}

// ================================
// KEYBOARD HANDLER
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
    handleQPress();
    return;
  }
  
  if (key === 'z') {
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
// EVENT LOGGING
// ================================

function logEvent(team, eventType) {
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
  
  // Update UI
  updateStats();
  updateLog();
}

function updateStats() {
  // Home team
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
  logList.innerHTML = "";
  
  // Show last 15 events (reverse chronological)
  const recentEvents = eventLog.slice(-15).reverse();
  
  recentEvents.forEach(event => {
    const li = document.createElement("li");
    li.className = event.team;
    
    const eventName = formatEventName(event.type);
    const teamName = event.team === 'home' ? homeTeamInput.value : awayTeamInput.value;
    
    li.innerHTML = `
      <strong>${eventName}</strong>
      <span>${teamName} - ${event.timestamp}</span>
    `;
    
    logList.appendChild(li);
  });
}

function formatEventName(type) {
  const names = {
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
      passes: 0, shots: 0, goals: 0, tackles: 0, interceptions: 0,
      corners: 0, fouls: 0, dribbles: 0, keyPasses: 0, longBalls: 0,
      crosses: 0, offsides: 0
    },
    away: {
      passes: 0, shots: 0, goals: 0, tackles: 0, interceptions: 0,
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
  
  statusDiv.textContent = "Press SPACE to start";
  statusDiv.classList.remove("tracking");
  
  updateStats();
  resetPossessionStopwatch();
}

// ================================
// EXPORT FUNCTION
// ================================

function exportJSON() {
  const totalHome = Math.floor(homeElapsed / 1000);
  const totalAway = Math.floor(awayElapsed / 1000);
  const total = totalHome + totalAway;
  const homePct = total ? ((totalHome / total) * 100).toFixed(1) : 0;
  const awayPct = total ? ((totalAway / total) * 100).toFixed(1) : 0;
  
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
      homeSeconds: totalHome,
      awaySeconds: totalAway,
      homePercent: homePct + '%',
      awayPercent: awayPct + '%'
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
