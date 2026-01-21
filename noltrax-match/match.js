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
      width: '640',
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

  const note = ""; // nanti bisa di-edit per event

  const event = { timestamp, tag, note };
  events.push(event);

  const li = document.createElement("li");
  li.textContent = `${timestamp} - ${tag}`;
  document.getElementById("log").appendChild(li);

  console.log(events);
}

// ------------------- YOUTUBE API READY -------------------
function onYouTubeIframeAPIReady() {
  console.log("YouTube API siap");
}
