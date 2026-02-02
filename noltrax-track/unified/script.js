const zones = document.querySelectorAll('.zone');
const logBtn = document.getElementById('logEvent');
const eventLog = document.getElementById('eventLog');

let selectedZone = null;

// ZONE CLICK
zones.forEach(z=>{
  z.addEventListener('click',()=>{
    zones.forEach(x=>x.classList.remove('active'));
    z.classList.add('active');
    selectedZone = z.dataset.zone;
  });
});

// EVENT LOG
logBtn.onclick = () => {
  if(!selectedZone) return alert('Select zone');

  const player = playerInput.value || 'Unknown';
  const eventType = eventType.value;
  const outcome = outcome.value;

  const li = document.createElement('li');
  li.textContent = `${player} • ${eventType} • ${outcome} • Zone ${selectedZone}`;
  eventLog.prepend(li);
};

/* POSSESSION */
let homeTime=0, awayTime=0;
let active=null, start=null;

const homeEl=document.getElementById('homeTime');
const awayEl=document.getElementById('awayTime');
const liveEl=document.getElementById('livePct');

document.addEventListener('keydown',e=>{
  if(e.key==='q') toggle('home');
  if(e.key==='w') toggle('away');
});

function toggle(team){
  const now=Date.now();
  if(active){
    const diff=now-start;
    if(active==='home') homeTime+=diff;
    if(active==='away') awayTime+=diff;
  }
  active=active===team?null:team;
  start=now;
}

setInterval(()=>{
  let h=homeTime, a=awayTime;
  if(active==='home') h+=Date.now()-start;
  if(active==='away') a+=Date.now()-start;

  homeEl.textContent=format(h);
  awayEl.textContent=format(a);

  const total=h+a;
  if(total>0){
    liveEl.textContent=`${((h/total)*100).toFixed(1)}% - ${((a/total)*100).toFixed(1)}%`;
  }
},300);

function format(ms){
  const s=Math.floor(ms/1000);
  return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
}
