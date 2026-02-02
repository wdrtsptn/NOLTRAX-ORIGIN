// ========================================
// NOLTRAX TRACK - MAIN JAVASCRIPT
// ========================================

// Global State
const state = {
    matchInfo: {},
    players: new Map(),
    events: [],
    currentInput: {
        player: null,
        action: null,
        outcome: null,
        zone: null
    },
    timer: {
        running: false,
        startTime: null,
        elapsed: 0,
        interval: null
    },
    possession: {
        tracking: false,
        startTime: null,
        total: 0
    }
};

// ========================================
// SECTION 1: MATCH INFO FORM
// ========================================

document.getElementById('match-info-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form values
    state.matchInfo = {
        matchName: document.getElementById('match-name').value,
        date: document.getElementById('match-date').value,
        homeTeam: document.getElementById('home-team').value,
        awayTeam: document.getElementById('away-team').value,
        teamAnalyzed: document.getElementById('team-analyzed').value,
        analystName: document.getElementById('analyst-name').value
    };
    
    // Move to player registration
    hideAllSections();
    document.getElementById('player-registration-section').classList.add('active');
});

// ========================================
// SECTION 2: PLAYER REGISTRATION
// ========================================

document.getElementById('start-tracking-btn').addEventListener('click', function() {
    // Validate and save players
    if (!validateAndSavePlayers()) {
        alert('❌ Error: Player numbers must be unique and filled correctly!');
        return;
    }
    
    // Move to tracking section
    hideAllSections();
    document.getElementById('tracking-section').classList.add('active');
    
    // Focus on player input
    document.getElementById('player-input').focus();
});

function validateAndSavePlayers() {
    state.players.clear();
    const usedNumbers = new Set();
    
    // Get starting XI
    const startingRows = document.querySelectorAll('#starting-xi-table tbody tr');
    for (let row of startingRows) {
        const number = row.querySelector('.player-number').value;
        const position = row.querySelector('.player-position').value;
        const name = row.querySelector('.player-name').value;
        
        if (number && name) {
            if (usedNumbers.has(number)) {
                return false; // Duplicate number
            }
            usedNumbers.add(number);
            state.players.set(number, { name, position, isStarting: true });
        }
    }
    
    // Get substitutes
    const subRows = document.querySelectorAll('#substitutes-table tbody tr');
    for (let row of subRows) {
        const number = row.querySelector('.player-number').value;
        const name = row.querySelector('.player-name').value;
        
        if (number && name) {
            if (usedNumbers.has(number)) {
                return false; // Duplicate number
            }
            usedNumbers.add(number);
            state.players.set(number, { name, position: 'SUB', isStarting: false });
        }
    }
    
    return state.players.size > 0;
}

// ========================================
// SECTION 3: LIVE TRACKING
// ========================================

// Player Input
const playerInput = document.getElementById('player-input');
playerInput.addEventListener('input', function() {
    const playerNumber = this.value;
    
    if (playerNumber && state.players.has(playerNumber)) {
        state.currentInput.player = playerNumber;
        updateMonitor();
    } else if (playerNumber) {
        state.currentInput.player = null;
        document.getElementById('monitor-player').textContent = '❌ Invalid';
    } else {
        state.currentInput.player = null;
        updateMonitor();
    }
});

// Action Buttons
document.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const action = this.getAttribute('data-action');
        const needsOutcome = !this.classList.contains('no-outcome');
        
        // Set active state
        document.querySelectorAll('.action-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        state.currentInput.action = action;
        state.currentInput.outcome = needsOutcome ? null : 'N/A';
        
        updateMonitor();
        
        // Show outcome selector if needed
        if (needsOutcome) {
            showOutcomeSelector(action);
        } else {
            hideOutcomeSelector();
        }
    });
});

// Outcome Selector
function showOutcomeSelector(action) {
    const outcomeCard = document.getElementById('outcome-selector');
    const outcomeButtons = document.getElementById('outcome-buttons');
    
    // Clear previous buttons
    outcomeButtons.innerHTML = '';
    
    // Define outcomes based on action
    let outcomes = [];
    if (action === 'Shot' || action === 'Shot on Target') {
        outcomes = ['On Target', 'Off Target', 'Blocked'];
    } else if (action === 'Goal') {
        outcomes = ['Success']; // Goal always success
        state.currentInput.outcome = 'Success';
        updateMonitor();
        outcomeCard.style.display = 'none';
        return;
    } else if (['Tackle', 'Interception', 'Block', 'Clearance', 'Duel'].includes(action)) {
        outcomes = ['Won', 'Lost'];
    } else {
        outcomes = ['Success', 'Failed'];
    }
    
    // Create outcome buttons
    outcomes.forEach(outcome => {
        const btn = document.createElement('button');
        btn.className = 'outcome-btn';
        btn.textContent = outcome;
        btn.addEventListener('click', function() {
            state.currentInput.outcome = outcome;
            document.querySelectorAll('.outcome-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            updateMonitor();
        });
        outcomeButtons.appendChild(btn);
    });
    
    outcomeCard.style.display = 'block';
}

function hideOutcomeSelector() {
    document.getElementById('outcome-selector').style.display = 'none';
}

// Zone Selection
document.querySelectorAll('.zone').forEach(zone => {
    zone.addEventListener('click', function() {
        const zoneId = this.getAttribute('data-zone');
        
        // Validate complete input
        if (!validateCurrentInput()) {
            alert('❌ Complete all fields before selecting zone!');
            return;
        }
        
        // Save event
        saveEvent(zoneId);
        
        // Clear input
        clearCurrentInput();
    });
});

function validateCurrentInput() {
    const { player, action, outcome } = state.currentInput;
    
    if (!player) return false;
    if (!action) return false;
    if (outcome === null && action !== 'Goal') return false;
    if (!state.players.has(player)) return false;
    
    return true;
}

function saveEvent(zoneId) {
    const playerInfo = state.players.get(state.currentInput.player);
    
    const event = {
        timestamp: new Date().toISOString(),
        minute: formatTime(state.timer.elapsed),
        player_number: state.currentInput.player,
        player_name: playerInfo.name,
        player_position: playerInfo.position,
        action_type: state.currentInput.action,
        outcome: state.currentInput.outcome,
        zone_id: zoneId,
        x_coordinate: null, // Can be calculated from zone
        y_coordinate: null  // Can be calculated from zone
    };
    
    state.events.push(event);
    addToActivityFeed(event);
    
    console.log('Event saved:', event);
}

function clearCurrentInput() {
    state.currentInput = {
        player: null,
        action: null,
        outcome: null,
        zone: null
    };
    
    playerInput.value = '';
    document.querySelectorAll('.action-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.outcome-btn').forEach(b => b.classList.remove('active'));
    hideOutcomeSelector();
    
    updateMonitor();
    playerInput.focus();
}

document.getElementById('clear-input-btn').addEventListener('click', clearCurrentInput);

// Update Monitor Display
function updateMonitor() {
    document.getElementById('monitor-player').textContent = state.currentInput.player || '-';
    document.getElementById('monitor-action').textContent = state.currentInput.action || '-';
    document.getElementById('monitor-outcome').textContent = state.currentInput.outcome || '-';
    document.getElementById('monitor-zone').textContent = 'Waiting...';
}

// Activity Feed
function addToActivityFeed(event) {
    const feed = document.getElementById('activity-feed');
    
    // Remove empty message
    const emptyMsg = feed.querySelector('.feed-empty');
    if (emptyMsg) emptyMsg.remove();
    
    // Create feed item
    const item = document.createElement('div');
    item.className = 'feed-item';
    item.textContent = `${event.player_number} | ${event.action_type} | ${event.outcome} | Zone ${event.zone_id} | ${event.minute}`;
    
    // Add to top
    feed.insertBefore(item, feed.firstChild);
    
    // Keep only last 5
    while (feed.children.length > 5) {
        feed.removeChild(feed.lastChild);
    }
}

// ========================================
// TIMER
// ========================================

const timerDisplay = document.getElementById('timer');
const timerToggle = document.getElementById('timer-toggle');

timerToggle.addEventListener('click', toggleTimer);

function toggleTimer() {
    if (state.timer.running) {
        pauseTimer();
    } else {
        startTimer();
    }
}

function startTimer() {
    state.timer.running = true;
    state.timer.startTime = Date.now() - state.timer.elapsed;
    
    state.timer.interval = setInterval(() => {
        state.timer.elapsed = Date.now() - state.timer.startTime;
        timerDisplay.textContent = formatTime(state.timer.elapsed);
    }, 100);
    
    timerToggle.textContent = '⏸ Pause (Space)';
    timerToggle.classList.add('paused');
}

function pauseTimer() {
    state.timer.running = false;
    clearInterval(state.timer.interval);
    
    timerToggle.textContent = '▶ Resume (Space)';
    timerToggle.classList.remove('paused');
}

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// ========================================
// POSSESSION TRACKER
// ========================================

const possessionToggle = document.getElementById('possession-toggle');
const possessionTime = document.getElementById('possession-time');
const possessionPercent = document.getElementById('possession-percent');

possessionToggle.addEventListener('click', togglePossession);

function togglePossession() {
    if (state.possession.tracking) {
        stopPossession();
    } else {
        startPossession();
    }
}

function startPossession() {
    state.possession.tracking = true;
    state.possession.startTime = Date.now();
    
    possessionToggle.textContent = 'Stop (Q)';
    possessionToggle.classList.add('active');
    
    state.possession.interval = setInterval(updatePossessionDisplay, 100);
}

function stopPossession() {
    state.possession.tracking = false;
    state.possession.total += Date.now() - state.possession.startTime;
    clearInterval(state.possession.interval);
    
    possessionToggle.textContent = 'Track (Q)';
    possessionToggle.classList.remove('active');
    
    updatePossessionDisplay();
}

function updatePossessionDisplay() {
    let totalPossession = state.possession.total;
    if (state.possession.tracking) {
        totalPossession += Date.now() - state.possession.startTime;
    }
    
    possessionTime.textContent = formatTime(totalPossession);
    
    // Calculate percentage
    const matchTime = state.timer.elapsed || 1;
    const percentage = ((totalPossession / matchTime) * 100).toFixed(1);
    possessionPercent.textContent = `${percentage}%`;
}

// ========================================
// KEYBOARD SHORTCUTS
// ========================================

document.addEventListener('keydown', function(e) {
    // Ignore if typing in input fields
    if (e.target.tagName === 'INPUT' && e.target.id !== 'player-input') return;
    
    const key = e.key.toLowerCase();
    
    // Timer control - Space
    if (key === ' ' && e.target.id !== 'player-input') {
        e.preventDefault();
        toggleTimer();
        return;
    }
    
    // Possession control - Q
    if (key === 'q') {
        e.preventDefault();
        togglePossession();
        return;
    }
    
    // Clear input - Escape
    if (key === 'escape') {
        e.preventDefault();
        clearCurrentInput();
        return;
    }
    
    // Action shortcuts
    const actionShortcuts = {
        'p': 'Pass',
        'g': 'Progressive Pass',
        'k': 'Key Pass',
        't': 'Through Ball',
        'c': 'Cross',
        's': 'Shot',
        'o': 'Shot on Target',
        'l': 'Goal',
        'a': 'Tackle',
        'i': 'Interception',
        'b': 'Block',
        'r': 'Clearance',
        'd': 'Duel',
        'x': 'Ball Lost',
        'f': 'Foul',
        'y': 'Yellow Card',
        'z': 'Red Card'
    };
    
    if (actionShortcuts[key]) {
        e.preventDefault();
        const targetBtn = Array.from(document.querySelectorAll('.action-btn'))
            .find(btn => btn.getAttribute('data-action') === actionShortcuts[key]);
        if (targetBtn) targetBtn.click();
    }
});

// ========================================
// EXPORT FUNCTIONS
// ========================================

document.getElementById('export-json').addEventListener('click', exportJSON);
document.getElementById('export-csv').addEventListener('click', exportCSV);

function exportJSON() {
    const data = {
        match_info: state.matchInfo,
        players: Array.from(state.players.entries()).map(([number, info]) => ({
            number,
            ...info
        })),
        events: state.events,
        possession: {
            total_time: formatTime(state.possession.total),
            percentage: document.getElementById('possession-percent').textContent
        }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadFile(blob, `noltrax_${state.matchInfo.matchName || 'match'}_${Date.now()}.json`);
}

function exportCSV() {
    let csv = 'Timestamp,Minute,Player Number,Player Name,Position,Action,Outcome,Zone\n';
    
    state.events.forEach(event => {
        csv += `${event.timestamp},${event.minute},${event.player_number},${event.player_name},${event.player_position},${event.action_type},${event.outcome},${event.zone_id}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    downloadFile(blob, `noltrax_${state.matchInfo.matchName || 'match'}_${Date.now()}.csv`);
}

function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function hideAllSections() {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
}

// ========================================
// INITIALIZATION
// ========================================

// Set default date to today
document.getElementById('match-date').valueAsDate = new Date();

// Initialize
console.log('🟢 Noltrax Track initialized');
console.log('📋 Blueprint: Live event tracking system');
console.log('🎯 Mission: Raw data collection only');
              
