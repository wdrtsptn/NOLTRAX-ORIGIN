let player;
let events = [];

// ------------------- VIDEO LOADING -------------------
function extractVideoId(url) {
  const regExp = /(?:v=|\/)([0-9A-Za-z_-]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

function loadVideo() {
  const url = document.getElementById("videoUrl").value;
  const id = extractVideoId(url);
  if (!id) {
    alert("Link YouTube tidak valid");
    return;
  }

  if (!player) {
    // buat player pertama kali
    player = new YT.Player('player', {
      height: '360',
      width: '100%',
      videoId: id,
      playerVars: {
        controls: 1,
        autoplay: 1
      },
    });
  } else {
    // load video baru
    player.loadVideoById(id);
  }
}

// ------------------- TAGGING -------------------
function tagEvent(tag) {
  if (!player || typeof player.getCurrentTime !== "function") return;

  let seconds = Math.floor(player.getCurrentTime());
  let mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  let ss = String(seconds % 60).padStart(2, "0");
  let timestamp = `${mm}:${ss}`;

  const event = { timestamp, tag, note: "" };
  events.push(event);

  // buat log entry dengan input note editable
  const li = document.createElement("li");
  li.innerHTML = `<strong>${timestamp} - ${tag}</strong><br>
                  <input type="text" class="noteInput" placeholder="Add note...">`;
  document.getElementById("log").appendChild(li);

  console.log(events);
}

// ------------------- YOUTUBE API READY -------------------
function onYouTubeIframeAPIReady() {
  console.log("YouTube API siap");
}

function saveSession() {
  // ambil metadata
  const metadata = {
    matchName: document.getElementById("matchName").value,
    matchDate: document.getElementById("matchDate").value,
    homeTeam: document.getElementById("homeTeam").value,
    awayTeam: document.getElementById("awayTeam").value,
    analyst: document.getElementById("analyst").value
  };

  // ambil note dari input di log
  const logElements = document.querySelectorAll("#log li");
  const logData = [];
  logElements.forEach((li, index) => {
    const noteInput = li.querySelector(".noteInput");
    events[index].note = noteInput ? noteInput.value : "";
    logData.push(events[index]);
  });

  const sessionData = {
    metadata,
    events: logData
  };

  // convert ke JSON
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sessionData, null, 2));
  const dlAnchor = document.createElement('a');
  dlAnchor.setAttribute("href", dataStr);
  dlAnchor.setAttribute("download", `${metadata.matchName || "session"}.json`);
  document.body.appendChild(dlAnchor); // perlu append dulu
  dlAnchor.click();
  dlAnchor.remove();

  alert("Session saved!");
  console.log(sessionData);
}
