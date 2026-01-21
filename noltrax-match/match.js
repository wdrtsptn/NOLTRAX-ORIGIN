let player;
let events = [];
const MAX_TAGS = 6;

// ------------------ YOUTUBE API ------------------
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: '360',
    width: '100%',
    videoId: '', // kosong dulu
    events: { 'onReady': onPlayerReady }
  });
}

function onPlayerReady(event) {
  // player siap
}

// ------------------ LOAD VIDEO ------------------
function loadVideo() {
  const url = document.getElementById('videoUrl').value;
  const videoId = extractVideoID(url);
  if(videoId && player) player.loadVideoById(videoId);
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

  // Log terbaru di atas
  const logList = document.getElementById('log');
  logList.insertBefore(li, logList.firstChild);

  events.unshift({tag: tagName, time: currentTime, note: ''});
}

// ------------------ ADD CUSTOM TAG ------------------
function addCustomTag() {
  const currentTags = document.querySelectorAll("#tags button").length;
  if(currentTags >= MAX_TAGS) {
    alert("Maximum 6 tags allowed!");
    return;
  }
  const tagName = prompt("Enter tag name:");
  if(tagName && tagName.trim() !== "") {
    const btn = document.createElement("button");
    btn.textContent = tagName;
    btn.onclick = () => tagEvent(tagName);

    const colors = [
      ['#FF7F50','#FF6347'],
      ['#87CEFA','#4682B4'],
      ['#32CD32','#228B22'],
      ['#DA70D6','#9932CC'],
      ['#FFD700','#FFA500'],
      ['#FF69B4','#FF1493']
    ];
    const color = colors[Math.floor(Math.random()*colors.length)];
    btn.style.background = `linear-gradient(90deg, ${color[0]}, ${color[1]})`;
    document.getElementById("tags").appendChild(btn);
  }
}

// ------------------ FORMAT TIME ------------------
function formatTime(sec) {
  const m = Math.floor(sec/60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2,'0')}`;
}

// ------------------ SAVE SESSION ------------------
function saveSession() {
  const metadata = {
    matchName: document.getElementById("matchName").value,
    matchDate: document.getElementById("matchDate").value,
    homeTeam: document.getElementById("homeTeam").value,
    awayTeam: document.getElementById("awayTeam").value,
    analyst: document.getElementById("analyst").value,
    analyzedTeam: document.getElementById("analyzedTeam").value
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
