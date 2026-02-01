const pitch = document.getElementById("pitch");
const saveBtn = document.getElementById("saveBtn");
const resetBtn = document.getElementById("resetBtn");
const eventType = document.getElementById("eventType");

let logs = [];

// 15 zones (5x3)
const zones = [
  "L-Def","LC-Def","C-Def","RC-Def","R-Def",
  "L-Mid","LC-Mid","C-Mid","RC-Mid","R-Mid",
  "L-Att","LC-Att","C-Att","RC-Att","R-Att"
];

zones.forEach(z => {
  const d = document.createElement("div");
  d.className = "zone";
  d.innerHTML = `<span>${z}</span>`;
  d.onclick = () => logEvent(z);
  pitch.appendChild(d);
});

function logEvent(zone) {
  logs.push({
    time: new Date().toISOString(),
    event: eventType.value,
    zone: zone
  });
}

saveBtn.onclick = () => {
  if (!logs.length) return alert("No data recorded");

  let csv = "Time,Event,Zone\n";
  logs.forEach(l => {
    csv += `${l.time},${l.event},${l.zone}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "noltrax_tools3_zones.csv";
  a.click();
};

resetBtn.onclick = () => {
  if (!confirm("Reset all zone data?")) return;
  logs = [];
};
