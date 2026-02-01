const table = document.getElementById('statsTable');
const saveBtn = document.getElementById('saveBtn');
const resetBtn = document.getElementById('resetBtn');

const homeTimeEl = document.getElementById('homeTime');
const awayTimeEl = document.getElementById('awayTime');
const livePossessionEl = document.getElementById('livePossession');
const finalPossessionEl = document.getElementById('finalPossession');

const homeKeys = {'1':0,'2':1,'3':2,'4':3,'5':4};
const awayKeys = {'6':0,'7':1,'8':2,'9':3,'0':4};

function rows(){ return [...table.querySelectorAll('tbody tr')]; }

document.addEventListener('keydown', e=>{
  if (document.activeElement.isContentEditable) return;
  if (homeKeys[e.key]!=null) inc('home',homeKeys[e.key]);
  if (awayKeys[e.key]!=null) inc('away',awayKeys[e.key]);
  if (e.key==='q'||e.key==='Q') toggle();
});

function inc(side,i){
  const cell = rows()[i].querySelector('.'+side);
  cell.textContent = (+cell.textContent||0)+1;
}

/* possession */
let h=0,a=0,active=null,start=null,timer=null;

function toggle(){
  if(!active){ active='home'; start=Date.now(); run(); }
  else if(active==='home'){ swap('away'); }
  else swap('home');
}

function swap(to){
  stop();
  const d=Date.now()-start;
  active==='home'?h+=d:a+=d;
  active=to;
  start=Date.now();
  run();
}

function run(){
  timer=setInterval(()=>{
    const d=Date.now()-start;
    const ht=active==='home'?h+d:h;
    const at=active==='away'?a+d:a;
    homeTimeEl.textContent=time(ht);
    awayTimeEl.textContent=time(at);
    const t=ht+at||1;
    livePossessionEl.textContent=
      `${((ht/t)*100).toFixed(1)}% - ${((at/t)*100).toFixed(1)}%`;
  },200);
}

function stop(){ clearInterval(timer); }

function time(ms){
  const s=Math.floor(ms/1000);
  return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
}
