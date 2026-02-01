const table = document.querySelector("#eventTable tbody");
const saveBtn = document.getElementById("saveBtn");
const resetBtn = document.getElementById("resetBtn");

const homeKeys = { '1':0,'2':1,'3':2,'4':3,'5':4,'6':5 };
const awayKeys = { '7':0,'8':1,'9':2,'0':3,'-':4,'=':5 };

function rows() {
  return Array.from(table.querySelectorAll("tr"));
}

document.addEventListener("keydown", e => {
  if (document.activeElement.tagName === "INPUT") return;

  if (homeKeys[e.key] != null) inc("home", homeKeys[e.key]);
  if (awayKeys[e.key] != null) inc("away", awayKeys[e.key]);
});

function inc(side, idx) {
  const r = rows()[idx];
  if (!r) return;
  const cell = r.querySelector("." + side);
  cell.textContent = parseInt(cell.textContent) + 1;
}

resetBtn.onclick = () => {
  if (!confirm("Reset all events?")) return;
  rows().forEach(r => {
    r.querySelector(".home").textContent = "0";
    r.querySelector(".away").textContent = "0";
  });
};

saveBtn.onclick = () => {
  let csv = "Event,Home,Away\n";
  rows().forEach(r => {
    csv += `${r.cells[0].innerText},${r.cells[1].innerText},${r.cells[2].innerText}\n`;
  });

  const blob = new Blob([csv], { type:"text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "noltrax_tools2_events.csv";
  a.click();
};
