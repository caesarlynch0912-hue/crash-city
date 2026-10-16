// Game modes test: survival stays as before, heist / time trial / demolition run, pay out, time out and keep their own records.
const fs=require('fs');const h=fs.readFileSync(process.argv[2],'utf8');
let s=h.split('<script>')[1].split('</script>')[0];s=s.slice(0,s.indexOf('/* ================= 3D'));s=s.replace("if(typeof THREE==='undefined')","if(false)");
const el=()=>({textContent:'',innerHTML:'',hidden:true,style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},appendChild(){},append(){},prepend(){},remove(){},addEventListener(){},setPointerCapture(){},querySelector:()=>el(),getBoundingClientRect:()=>({top:0}),children:[],focus(){}});
global.document={getElementById:()=>el(),createElement:()=>el(),documentElement:el()};global.matchMedia=()=>({matches:false});global.addEventListener=()=>{};
const store={'hh-tut':'1'};/* tutorial already seen, so runs start with police */global.localStorage={getItem:k=>store[k]===undefined?null:store[k],setItem:(k,v)=>store[k]=String(v)};
const load=()=>new Function(s+`function sfx(){} function hideScreens(){} function showBrief(){} var paused=false; var camA=0;
  return {resetRun,tick,endRun,showOver,get GM(){return GM},get MODE(){return MODE},set MODE(v){MODE=v},modeBest,get wanted(){return wanted},set wanted(v){wanted=v},get state(){return state},
  get wallet(){return wallet},get score(){return score},get military(){return military},player,keys,fx,cars,isEnemy,onWreck,makeCar,MODE_RAD};`)();
let fails=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fails++;};
const run=(G,n)=>{for(let i=0;i<n&&G.state==='play';i++)G.tick();};
const park=(G,t)=>{G.player.x=t.x;G.player.y=t.y;if(G.player.car){G.player.car.x=t.x;G.player.car.y=t.y;G.player.car.v=0;}};
let G=load();
// --- survival: unchanged (wanted rises with time, military after 140 s, no target)
ok(G.MODE==='survival','default mode is survival');
G.resetRun();ok(G.GM.tgt===null&&G.wanted===1,'survival: no target, 1 star');
G.keys.KeyW=true;for(let i=0;i<60*40;i++){G.fx.ghost=9;G.fx.shield=9;G.tick();}ok(G.wanted>=2,'survival: stars still rise with time ('+G.wanted+')');G.keys.KeyW=false;
G.endRun('busted');ok(G.modeBest.heist===0&&G.modeBest.trial===0&&G.modeBest.demo===0,'survival run leaves mode records alone');
// --- heist
G=load();G.MODE='heist';G.resetRun();
ok(G.GM.tgt&&G.GM.phase===0&&G.wanted===1,'heist: bank marked, 1 star');
const bank=G.GM.tgt;park(G,bank);run(G,30);ok(G.GM.phase===0,'heist: loot not taken instantly');
park(G,bank);run(G,100);ok(G.GM.phase===1&&G.wanted>=4,'heist: loot taken, stars spike to '+G.wanted);
const safe=G.GM.tgt;ok(safe&&(safe.x!==bank.x||safe.y!==bank.y),'heist: safehouse marked');
const w0=G.wallet,s0=G.score;park(G,safe);run(G,3);
ok(G.GM.n===1&&G.GM.phase===0&&G.GM.pay>=2800,'heist: delivery pays '+G.GM.pay);
ok(G.wanted===1&&G.wallet>w0&&G.score>s0,'heist: heat drops, coins and score paid');
// more stars pay more
G.GM.phase=1;G.GM.carry=0;G.wanted=5;const pay1=G.GM.pay;park(G,G.GM.tgt);run(G,3);ok(G.GM.pay-pay1>=3500,'heist: 5 stars pay more ('+(G.GM.pay-pay1)+')');
const hp=G.GM.pay;G.endRun('busted');ok(G.modeBest.heist===hp&&G.GM.newBest,'heist: record saved ('+hp+')');
// survival stars do not creep up in heist: 60 s with no loot stays at 1 star
G.MODE='heist';G.resetRun();run(G,60*60);ok(G.wanted===1&&!G.military,'heist: no time-based escalation');
// --- time trial
G.MODE='trial';G.resetRun();ok(G.wanted===0&&G.GM.left===30&&G.GM.tgt,'trial: no cops, 30 s on the clock');
let c0=G.GM.tgt;park(G,c0);run(G,2);ok(G.GM.n===1&&G.GM.left>30-1&&G.GM.tgt!==c0,'trial: checkpoint adds time, next one placed ('+G.GM.left.toFixed(1)+' s)');
for(let i=0;i<5;i++){park(G,G.GM.tgt);run(G,2);}ok(G.GM.n===6,'trial: chain of checkpoints');
G.GM.left=.05;run(G,10);ok(G.state!=='play'&&G.GM.fin==='time'&&G.modeBest.trial===6,'trial: time out ends the run, record 6');
for(let i=0;i<400&&G.state!=='over';i++)G.tick();ok(G.state==='over','trial: reaches game-over screen');
// --- demolition
G.MODE='demo';G.resetRun();ok(G.wanted===3&&G.GM.left===180&&G.GM.tgt===null,'demo: 3 stars, 3 minutes');
G.onWreck({kind:'cop'});
ok(G.GM.wr===1,'demo: wreck counted');
for(let i=0;i<10;i++)G.onWreck({kind:'cop'});ok(G.GM.wr===11&&G.wanted===4,'demo: more wrecks, more heat ('+G.wanted+' stars)');
G.GM.left=.05;run(G,10);ok(G.state!=='play'&&G.modeBest.demo===11,'demo: timer ends run, record 11');
// busted before time also saves
G.MODE='demo';G.resetRun();for(let i=0;i<3;i++)G.onWreck({kind:'army'});G.endRun('wasted');ok(G.modeBest.demo===11,'demo: lower score keeps old record');
// --- persistence
const sel=JSON.parse(store['hh-modes']);ok(sel.best.heist===hp&&sel.best.trial===6&&sel.best.demo===11,'records stored in hh-modes');
G=load();ok(G.MODE==='demo'&&G.modeBest.trial===6,'selected mode and records survive a reload');
store['hh-modes']='garbage{';G=load();ok(G.MODE==='survival','broken save falls back to survival');
// --- long soak in every mode: no exceptions
for(const m of ['heist','trial','demo']){G=load();G.MODE=m;G.resetRun();G.keys.KeyW=true;
  for(let i=0;i<60*120&&G.state==='play';i++){G.tick();if(i%200===0&&G.GM.tgt&&i%400===0)park(G,G.GM.tgt);}ok(true,'soak '+m+' ok ('+G.state+')');}
process.exit(fails?1:0);
