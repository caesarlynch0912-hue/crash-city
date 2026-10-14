// Achievements / daily missions / login streak test. Exits 1 on any failure.
const fs=require('fs');const h=fs.readFileSync(process.argv[2],'utf8');
let s=h.split('<script>')[1].split('</script>')[0];s=s.slice(0,s.indexOf('/* ================= 3D'));s=s.replace("if(typeof THREE==='undefined')","if(false)");
const el=()=>({textContent:'',innerHTML:'',hidden:true,style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},appendChild(){},append(){},prepend(){},remove(){},addEventListener(){},setPointerCapture(){},querySelector:()=>el(),getBoundingClientRect:()=>({top:0}),children:[],focus(){}});
global.document={getElementById:()=>el(),createElement:()=>el(),documentElement:el()};global.matchMedia=()=>({matches:false});global.addEventListener=()=>{};
const store={};global.localStorage={getItem:k=>store[k]===undefined?null:store[k],setItem:(k,v)=>store[k]=String(v)};
// controllable clock
const RealDate=Date;let fake=new RealDate(2026,9,14,12,0,0).getTime();
global.Date=class extends RealDate{constructor(...a){super(...(a.length?a:[fake]));}static now(){return fake;}};
const day=n=>{fake=new RealDate(2026,9,14+n,12,0,0).getTime();};
const load=()=>new Function(s+`function sfx(){} function hideScreens(){} function showBrief(){} var paused=false; var camA=0;
  return {resetRun,tick,endRun,get A(){return A},get DL(){return DL},get wallet(){return wallet},set wallet(v){wallet=v},get score(){return score},set score(v){score=v},ACH,DM_POOL,STREAK_RW,
    chal,dailyCheck,dailyReroll,genMissions,dayStr,get state(){return state},set wanted(v){wanted=v},set military(v){military=v},garage,stats,player,keys};`)();
let fails=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fails++;};
const settle=()=>{for(let i=0;i<45;i++)if(G.state==='play')G.tick();};// unlock checks run every 20 ticks
// --- 1. first day: streak 1, three distinct missions, deterministic by date
let G=load();
ok(G.DL.st.n===1&&G.DL.st.last==='2026-10-14','first launch: streak 1 ('+JSON.stringify(G.DL.st)+')');
ok(G.wallet===G.STREAK_RW[0],'day-1 login reward paid ('+G.wallet+')');
ok(G.DL.list.length===3&&new Set(G.DL.list.map(m=>m.k)).size===3,'3 distinct missions: '+G.DL.list.map(m=>m.k+':'+m.n));
const L1=JSON.stringify(G.DL.list);
for(const k in store)delete store[k];G=load();ok(JSON.stringify(G.DL.list)===L1,'same date -> same missions (seeded)');
// --- 2. no double reward on reload, persistence of progress
G.resetRun();const w1=G.wallet;
G.chal('wreck',3);G.chal('coin',3);G.endRun('busted');
G=load();ok(G.wallet===w1,'reload same day: no second login reward');ok(G.A.c.wreck===3&&G.A.c.coin===3,'counters persist ('+JSON.stringify(G.A.c)+')');
// --- 3. achievements unlock + reward + persist, via real chal() events
G.resetRun();let wl=G.wallet;
for(let i=0;i<25;i++)G.chal('wreck',1);settle();
ok(!!G.A.u.wreck25,'wreck25 unlocked after 25 wrecks (3 earlier + 22)');
ok(G.wallet>=wl+150,'achievement coins paid ('+(G.wallet-wl)+')');
G.chal('combo',5);G.chal('speed',131);G.chal('air',3.4);G.chal('drift',3.2);G.chal('jack',1);settle();
ok(G.A.u.combo5&&G.A.u.spd130&&G.A.u.air3&&G.A.u.drift3&&G.A.u.jack1,'max/single-event achievements (combo, speed, air, drift, jack)');
ok(!G.A.u.time120,'time120 still locked');for(let i=0;i<60;i++)G.tick();
ok(G.A.m.time>.9,'tick feeds survival time ('+G.A.m.time.toFixed(2)+' s)');G.chal('time',125);settle();ok(G.A.u.time120&&!G.A.u.time300,'time120 unlocked, time300 not');
for(const z of['downtown','suburb','harbor','beach','forest'])G.chal('visit',z);settle();ok(G.A.u.visit5,'visit5 after 5 areas');
G.endRun('busted');let ul=Object.keys(G.A.u).length;
G=load();ok(Object.keys(G.A.u).length===ul&&G.A.u.wreck25,'unlocked set survives reload ('+ul+')');
// no repeat rewards
G.resetRun();wl=G.wallet;G.chal('wreck',1);ok(G.wallet===wl,'no second reward for an unlocked achievement');
// --- 4. a daily mission completes and pays; counted for the daily achievement
G.resetRun();const m=G.DL.list[0];wl=G.wallet;const d=G.DM_POOL.find(p=>p.k===m.k);
const ev=m.k==='score'?null:m.k;
if(ev){G.chal(ev,m.n);ok(G.DL.list[0].done&&G.wallet-wl>=m.rw,'mission 1 ('+m.k+') done and paid '+m.rw);}
else{G.score=m.n+500;G.endRun('busted');ok(G.DL.list[0].done,'mission 1 (score) done at run end');}
ok(G.A.c.daily>=1,'daily counter increments');
// --- 5. reroll once
const before=G.DL.list.map(x=>x.k+x.done);const ok1=G.dailyReroll();const after=G.DL.list;
ok(ok1&&G.DL.rr,'reroll works once');ok(after[0].done,'finished mission kept on reroll');ok(!G.dailyReroll(),'second reroll refused');
ok(new Set(after.map(x=>x.k)).size===3,'rerolled set has no duplicate types');
// --- 6. next day: new missions, streak 2, reward; skip a day: streak resets
day(1);G=load();ok(G.DL.st.n===2&&G.DL.day==='2026-10-15','next day: streak 2');
ok(G.DL.rr===false&&G.DL.list.every(x=>!x.done&&x.p===0),'new day: fresh missions, reroll available');
const wd=G.wallet;G.dailyCheck();ok(G.wallet===wd,'dailyCheck twice same day pays once');
day(4);G=load();ok(G.DL.st.n===1&&G.DL.st.best===2,'missed days: streak resets, best kept ('+JSON.stringify(G.DL.st)+')');
for(let i=5;i<=11;i++){day(i);G=load();}
ok(G.DL.st.n===8&&G.A.u.streak7,'7-day streak achievement (n='+G.DL.st.n+')');
ok(G.STREAK_RW[(8-1)%7]===G.STREAK_RW[0],'streak reward cycles every 7 days');
// clock going backwards must not pay again
const wb=G.wallet;day(2);G=load();ok(G.wallet===wb,'clock moved back: no reward');day(11);
// --- 7. corrupt storage does not break loading
store['hh-ach']='{{{';store['hh-daily']='nope';G=load();ok(G.DL.list.length===3&&G.A.runs===0,'corrupt saves ignored');
store['hh-ach']=JSON.stringify({u:{x:'a'},c:{wreck:'zz'},m:null});G=load();ok(!('wreck'in G.A.c),'bad numbers dropped');
// every achievement has a reachable, translated definition
ok(G.ACH.every(a=>a.id&&a.name&&a.d&&a.g>0&&a.rw>0&&typeof a.v()==='number'),G.ACH.length+' achievement defs valid');
ok(new Set(G.ACH.map(a=>a.id)).size===G.ACH.length,'unique achievement ids');
process.exit(fails?1:0);
