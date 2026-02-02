const startingXI = document.getElementById("starting-xi");
const subs = document.getElementById("subs");
const log = document.getElementById("eventLog");
const posValue = document.getElementById("posValue");

let selectedPlayer = null;
let selectedEvent = null;
let selectedZone = null;
let possession = 50;

// INIT PLAYERS
for (let i = 1; i <= 11; i++) {
  startingXI.innerHTML += `
    <div class="row">
      <span>${i}</span><span></span><span></span>
    </div>
  `;
}
for (let i = 12; i <= 18; i++) {
  subs.innerHTML += `
    <div class="row">
      <span>${i}</span><span></span><span></span>
    </div>
  `;
}

// ZONE CLICK
document.querySelectorAll(".zone").forEach(z => {
  z.addEventListener("click", () => {
    document.querySelectorAll(".zone").forEach(x => x.classList.remove("active"));
    z.classList.add("active");
    selectedZone = z.dataset.zone;
    tryLog();
  });
});

// KEYBOARD INPUT
document.addEventListener("keydown", e => {
  if (!isNaN(e.key)) {
    selectedPlayer = e.key;
  }

  if (e.key === "p") selectedEvent = "Pass";
  if (e.key === "s") selectedEvent = "Shot";

  if (e.key === "+") {
    possession = Math.min(100, possession + 1);
    posValue.textContent = possession + "%";
  }

  if (e.key === "-") {
    possession = Math.max(0, possession - 1);
    posValue.textContent = possession + "%";
  }

  tryLog();
});

function tryLog() {
  if (selectedPlayer && selectedEvent && selectedZone) {
    const li = document.createElement("li");
    li.textContent = `#${selectedPlayer} ${selectedEvent} – Zone ${selectedZone}`;
    log.prepend(li);

    selectedPlayer = null;
    selectedEvent = null;
    selectedZone = null;
    document.querySelectorAll(".zone").forEach(x => x.classList.remove("active"));
  }
}
