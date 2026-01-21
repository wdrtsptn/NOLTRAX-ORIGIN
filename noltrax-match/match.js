let player;
let events = [];

// ------------------ YOUTUBE API ------------------
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: '360',
    width: '100%',
    videoId: '', // kosong dulu
    events: {
      'onReady': onPlayerReady
    }
  });
}

function onPlayerReady(event) {
  // player siap
}

// ------------------ LOAD VIDEO ------------------
function loadVideo() {
  const url = document.getElementById('videoUrl').value;
  const videoId = extractVideoID(url);
  if(videoId && player) {
    player.loadVideoById(videoId);
  }
}

function extractVideoID(url) {
  const regex = /(?:youtube\.com\/.*v=|youtu\.be\/)([^&]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// ------------------ TAG EVENT ------------------
function tagEvent(tagName) {
  if(!player) return;
  const currentTime = Math.floor(player.getCurrentTime());
  const li = document.createElement('li');

  li.innerHTML = `<strong>${tagName}</strong> <span>${formatTime(currentTime)}</span><br>
                  <input class="noteInput" placeholder="Add note...">`;
  document.getElementById('log').appendChild(li);

  events.push({tag: tagName, time: currentTime, note: ''});
}

function formatTime(sec) {
  const m = Math.floor(sec/60);
  const s = sec%60;
  return `${m}:${s.toString().padStart(2,'0')}`;
}

// ------------------ SAVE SESSION ------------------
function saveSession() {
  const metadata = {
    matchName: document.getElementById("matchName").value,
    matchDate: document.getElementById("matchDate").value,
    homeTeam: document.getElementById("homeTeam").value,
    awayTeam: document.getElementById("awayTeam").value,
    analyst: document.getElementById("analyst").value
  };

  const logElements = document.querySelectorAll("#log li");
  const logData = [];
  logElements.forEach((li, index) => {
    const noteInput = li.querySelector(".noteInput");
    events[index].note = noteInput ? noteInput.value : "";
    logData.push(events[index]);
  });

  const sessionData = { metadata, events: logData };
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sessionData, null, 2));
  const dlAnchor = document.createElement('a');
  dlAnchor.setAttribute("href", dataStr);
  dlAnchor.setAttribute("download", `${metadata.matchName || "session"}.json`);
  document.body.appendChild(dlAnchor);
  dlAnchor.click();
  dlAnchor.remove();

  alert("Session saved!");
  console.log(sessionData);
}
