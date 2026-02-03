let currentPlayer = "";
let currentAction = "pass_success";
let events = [];

const playerDisplay = document.getElementById("playerDisplay");
const actionDisplay = document.getElementById("actionDisplay");
const feed = document.getElementById("feed");

/* KEYBOARD INPUT */
document.addEventListener("keydown", (e) => {
  if (!isNaN(e.key)) {
    currentPlayer += e.key;
    playerDisplay.textContent = currentPlayer;
  }

  if (e.key === "p") setAction("pass_success");
  if (e.key === "f") setAction("pass_failed");
  if (e.key === "x") setAction("turnover");

  if (e.key === "Backspace") {
    currentPlayer = "";
    playerDisplay.textContent = "--";
  }
});

function setAction(action) {
  currentAction = action;
  actionDisplay.textContent = action;
}

/* ZONE CLICK */
document.querySelectorAll(".zone").forEach(zone => {
  zone.addEventListener("click", () => {
    if (!currentPlayer) return;

    const event = {
      time: new Date().toISOString(),
      player: currentPlayer,
      action: currentAction,
      zone: zone.dataset.zone
    };

    events.push(event);
    addFeed(event);

    currentPlayer = "";
    playerDisplay.textContent = "--";
  });
});

/* FEED */
function addFeed(e) {
  const div = document.createElement("div");
  div.textContent = `#${e.player} | ${e.action} | Z${e.zone}`;
  feed.prepend(div);
}

/* EXPORT */
document.getElementById("exportBtn").onclick = () => {
  const blob = new Blob([JSON.stringify(events, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "noltrax-track.json";
  a.click();
};
