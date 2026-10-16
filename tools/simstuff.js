// "More stuff" test: new vehicles, power-ups, hidden packages, stunt jumps, rampages. Exits 1 on any failure.
// node tools/simstuff.js index.html
const fs=require('fs');const h=fs.readFileSync(process.argv[2],'utf8');
let s=h.split('<script>')[1].split('</script>')[0];s=s.slice(0,s.indexOf('/* ================= 3D'));s=s.replace("if(typeof THREE==='undefined')","if(false)");
const el=()=>({textContent:'',innerHTML:'',hidden:true,style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},appendChild(){},append(){},prepend(){},remove(){},addEventListener(){},setPointerCapture(){},querySelector:()=>el(),getBoundingClientRect:()=>({top:0}),children:[],focus(){}});
global.document={getElementById:()=>el(),createElement:()=>el(),documentElement:el()};global.matchMedia=()=>({matches:false});global.addEventListener=()=>{};global.setTimeout=()=>0;
const store={'hh-tut':'1'};/* tutorial already seen, so runs start with police */global.localStorage={getItem:k=>store[k]===undefined?null:store[k],setItem:(k,v)=>store[k]=String(v)};
let seed=5;Math.random=()=>{seed=(Math.imul(seed^(seed>>>15),2246822519)+0x6D2B79F5)>>>0;seed^=seed>>>13;return(seed>>>0)/4294967296;};
const load=()=>new Function(s+`;function sfx(){} function hideScreens(){} function showBrief(){} var paused=false; var camA=0;
  return {resetRun,tick,CAR_SPECS,POWER,garage,cars,player,fx,shots,peds,parts,applyPower,makeCar,mxMorph,enterCar,takeCar,spawnEnemy,damage,isEnemy,
    MX,MX_PKGS,MX_STUNTS,MXRG,mxPicks,mxOils,mxRings,RAMPS,freeCircle,prog,progCalc,PROG_MUL,progApplyCar,ACH,A,
    get state(){return state},get score(){return score},set score(v){score=v},get wallet(){return wallet},set wanted(v){wanted=v},get wanted(){return wanted},keys,get slowT(){return slowT},
    get MXCAM(){return MXCAM},get T(){return T},FX_NAME,tr,DT};`)();
let fails=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fails++;};
const fin=v=>typeof v==='number'&&isFinite(v);
let G=load();
// --- 1. vehicles exist with sane specs and work as the start car, with upgrades
const NEW=['sopa','mc','monstert','stridsv'];
for(const id of NEW){const sp=G.CAR_SPECS.find(c=>c.id===id);ok(!!sp&&sp.mx&&fin(sp.speed)&&fin(sp.acc)&&fin(sp.grip)&&fin(sp.armor)&&sp.req>0&&fin(sp.tone),'spec '+id+' ok (req '+(sp&&sp.req)+', armor '+(sp&&sp.armor)+')');}
const byId=id=>G.CAR_SPECS.find(c=>c.id===id);
ok(byId('mc').speed>byId('raket').speed&&byId('mc').armor<byId('bruno').armor,'bike: fastest but fragile');
ok(byId('stridsv').armor>=2*byId('bastion').armor&&byId('stridsv').req>=byId('raket').req,'tank: top unlock, huge armor');
ok(byId('stridsv').speed<byId('bruno').speed,'tank is slow');
ok(new Set(G.CAR_SPECS.map(c=>c.id)).size===G.CAR_SPECS.length,'unique car ids');
ok(byId('glass').jingle===true,'ice-cream van has a jingle');
for(const id of NEW){G=load();G.garage.owned.push(id);G.garage.sel=id;G.prog.up.armor=3;G.prog.up.engine=3;G.progCalc();G.resetRun();const c=G.player.car;
  ok(c.spec.id===id,id+' is the start car');ok(c.maxHp===Math.round(c.spec.armor*G.PROG_MUL.armor)&&G.PROG_MUL.armor>1,id+' gets armor upgrade ('+c.maxHp+')');
  G.keys.KeyW=true;let bad=0,top=0;for(let i=0;i<900;i++){G.tick();top=Math.max(top,c.v);if(!fin(c.x)||!fin(c.y)||!fin(c.v)||!fin(c.a))bad++;if(G.state!=='play')break;}
  G.keys.KeyW=false;ok(bad===0,id+' drives 900 ticks without NaN (top v '+top.toFixed(2)+', hp '+Math.round(c.hp)+')');
  ok(top<=c.spec.speed*G.PROG_MUL.speed+3.01,id+' respects speed spec+upgrade');}
// score unlock (fresh save: earlier checks push cars into owned and later code may persist them)
const snap=Object.assign({},store);for(const k in store)delete store[k];G=load();G.resetRun();G.score=16500;for(let i=0;i<120;i++)G.tick();
ok(['sopa','mc','monstert'].every(id=>G.garage.owned.includes(id)),'cars up to 16 000 unlock by score ('+G.garage.owned.join(',')+')');
ok(!G.garage.owned.includes('stridsv'),'tank not unlocked at 16 500');
for(const k in store)delete store[k];Object.assign(store,snap);
// --- 2. civilians in the new vehicles can be car-jacked and keep their spec + upgrades
G=load();G.prog.up.armor=2;G.progCalc();G.resetRun();
let cv=G.makeCar(G.player.x+200,G.player.y,0,'civ');G.cars.push(cv);cv.spec=undefined;G.mxMorph(cv);
ok(!!cv.spec&&cv.mxCiv,'civ morphs into a special vehicle ('+(cv.spec&&cv.spec.id)+')');
let morphed=0;for(let i=0;i<400;i++){const c=G.makeCar(0,0,0,'civ');if(c.mxCiv)morphed++;}
ok(morphed>5&&morphed<80,'~7% of new civilians are special ('+morphed+'/400)');
G.resetRun();cv=G.makeCar(G.player.x+25,G.player.y+25,0,'civ');G.cars.push(cv);G.mxMorph(cv);cv.hp=cv.maxHp*.5;
G.player.car.driven=false;G.player.car=null;G.enterCar(cv);for(let i=0;i<300&&G.player.jack;i++)G.tick();
ok(G.player.car===cv&&cv.spec,'special civ car jacked');ok(Math.abs(cv.maxHp-Math.round(cv.spec.armor*G.PROG_MUL.armor))<1,'jacked car got armor upgrade ('+cv.maxHp+')');ok(cv.hp>0&&cv.hp<cv.maxHp,'jacked car keeps its damage ratio');
// --- 3. monster truck crush
G=load();G.garage.owned.push('monstert');G.garage.sel='monstert';G.resetRun();
let pc=G.player.car;const victim=G.makeCar(pc.x+5,pc.y+5,0,'civ');victim.ai=false;victim.kind='civ';victim.v=0;victim.w=44;G.cars.push(victim);
pc.air=true;pc.z=14;pc.vz=0;pc.airStart=G.T;pc.v=0;pc.x=victim.x;pc.y=victim.y;
for(let i=0;i<60;i++)G.tick();
ok(victim.hp<=0&&victim.squash===1,'monster truck crushes the small car it lands on');
G=load();G.garage.owned.push('monstert');G.garage.sel='monstert';G.resetRun();pc=G.player.car;
const v2=G.makeCar(pc.x,pc.y+45,0,'civ');v2.ai=false;v2.v=0;v2.w=44;G.cars.push(v2);G.keys.KeyW=true;for(let i=0;i<120&&v2.hp>0;i++)G.tick();G.keys.KeyW=false;
ok(v2.hp<=0,'monster truck drives over a small car');
// --- 4. tank cannon
G=load();G.garage.owned.push('stridsv');G.garage.sel='stridsv';G.resetRun();pc=G.player.car;G.wanted=0;
const cop=G.makeCar(pc.x,pc.y+260,0,'cop');cop.hp=cop.maxHp=95;G.cars.push(cop);cop.stun=99;
G.keys.KeyF=true;let fired=0,tracked=false;for(let i=0;i<200&&cop.hp>0;i++){G.tick();if(G.shots.some(x=>x.kind==='rocket'))fired++;if(pc.turA!==undefined&&Math.abs(pc.turA-Math.PI/2)<.2)tracked=true;}G.keys.KeyF=false;
ok(fired>0,'tank fires a cannon shell');ok(tracked,'turret tracks the target');ok(cop.hp<=0,'cannon wrecks a cop (hp '+Math.round(cop.hp)+')');
// --- 5. power-ups
G=load();G.resetRun();pc=G.player.car;G.wanted=0;
const P=id=>G.POWER.find(p=>p.id===id);
ok(!!P('oil')&&!!P('ram')&&!!P('homing'),'new power-ups registered');ok(G.POWER.every(p=>G.FX_NAME[p.id]||p.dur===0),'every timed power has an fx name');
G.applyPower(P('oil'));ok(G.fx.oil>0,'oil timer set');
G.cars.length=0;G.cars.push(pc);const c1=G.makeCar(pc.x-200,pc.y,0,'cop');c1.v=0;G.cars.push(c1);
G.keys.KeyW=true;for(let i=0;i<60;i++)G.tick();G.keys.KeyW=false;ok(G.mxOils.length>3,'oil patches dropped ('+G.mxOils.length+')');
// put a cop on the last patch
const o=G.mxOils[G.mxOils.length-1];c1.x=o.x;c1.y=o.y;c1.hp=95;c1.stun=0;c1.oilCool=0;const a0=c1.a;let spun=false;for(let i=0;i<4;i++){G.tick();if(c1.oilT>0)spun=true;}
ok(spun&&c1.stun>1,'cop touching oil spins out and is stalled');
G.resetRun();ok(G.mxOils.length===0,'oil cleared on new run');
G=load();G.resetRun();pc=G.player.car;G.wanted=0;G.cars.length=0;G.cars.push(pc);G.applyPower(P('ram'));
const c2=G.makeCar(pc.x+40,pc.y,Math.PI,'cop');c2.hp=c2.maxHp=95;c2.stun=0;G.cars.push(c2);const c3=G.makeCar(pc.x+80,pc.y+30,0,'cop');c3.hp=c3.maxHp=95;G.cars.push(c3);
pc.v=6;let ringSeen=false;G.keys.KeyW=true;for(let i=0;i<30;i++){G.tick();if(G.mxRings.length)ringSeen=true;}G.keys.KeyW=false;
ok(ringSeen,'shock ram sends out a shockwave ring');ok(c2.hp<95&&c3.hp<95,'shockwave hurts nearby cops ('+Math.round(c2.hp)+','+Math.round(c3.hp)+')');
G=load();G.resetRun();pc=G.player.car;G.wanted=0;G.cars.length=0;G.cars.push(pc);
const tgs=[0,1,2].map(i=>{const c=G.makeCar(pc.x,pc.y+250+i*120,0,'cop');c.hp=c.maxHp=95;c.stun=99;G.cars.push(c);return c;});
G.applyPower(P('homing'));ok(G.shots.filter(x=>x.home).length===6,'6 homing missiles launched');
let homed=false;for(let i=0;i<260;i++){G.tick();if(tgs.some(c=>c.hp<=0))homed=true;}
ok(homed,'homing missiles wreck cops ('+tgs.map(c=>Math.round(c.hp)).join(',')+')');
// --- 6. packages (start from no found packages: earlier drives may pick some up)
delete store['hh-more'];
G=load();ok(G.MX_PKGS.length===50,'50 packages placed ('+G.MX_PKGS.length+')');
ok(G.MX_PKGS.every(p=>fin(p.x)&&fin(p.y)&&G.freeCircle(p.x,p.y,9)),'all packages sit on free ground');
ok(new Set(G.MX_PKGS.map(p=>Math.round(p.x)+','+Math.round(p.y))).size===50,'package positions unique');
const G2=load();ok(JSON.stringify(G.MX_PKGS)===JSON.stringify(G2.MX_PKGS),'package positions are deterministic');
G.resetRun();G.player.car.v=0;let w0=G.wallet;
for(let i=0;i<10;i++){const p=G.MX_PKGS[i];G.player.car.x=G.player.x=p.x;G.player.car.y=G.player.y=p.y;G.tick();}
ok(G.MX.pkg.length===10,'10 packages collected ('+G.MX.pkg.length+')');ok(G.wallet>=w0+30,'packages pay coins');
for(let i=0;i<45;i++)G.tick();ok(!!G.A.u.pkg10,'pkg10 achievement unlocked');
const p0=G.MX_PKGS[0];G.player.car.x=G.player.x=p0.x;G.player.car.y=G.player.y=p0.y;G.tick();ok(G.MX.pkg.length===10,'a found package is not collected twice');
G=load();ok(G.MX.pkg.length===10,'found packages persist across reload');
// on foot
G.resetRun();G.player.car.hp=1;G.damage(G.player.car,5);for(let i=0;i<5;i++)G.tick();ok(!G.player.car,'(on foot after the car is wrecked)');const p11=G.MX_PKGS[11];G.player.x=p11.x;G.player.y=p11.y;G.tick();ok(G.MX.pkg.includes(11),'packages can be collected on foot');
// --- 7. stunt jumps
G=load();ok(G.MX_STUNTS.length>=3&&G.MX_STUNTS.length<=12,'stunt jumps defined ('+G.MX_STUNTS.length+')');
G.resetRun();pc=G.player.car;const st=G.MX_STUNTS.find(x=>x.horiz)||G.MX_STUNTS[0];
const fly=(S2)=>{const horiz=S2.horiz;pc.hp=pc.maxHp;pc.air=false;pc.z=0;pc.vz=0;pc.x=horiz?S2.x-140:S2.x;pc.y=horiz?S2.y:S2.y-140;pc.a=horiz?0:Math.PI/2;pc.ma=pc.a;pc.v=7;G.player.x=pc.x;G.player.y=pc.y;
  G.cars.length=0;G.cars.push(pc);let air=0,slow=false,cam=false;G.keys.KeyW=true;for(let i=0;i<140;i++){G.tick();if(pc.air)air++;if(G.slowT>0)slow=true;if(G.MXCAM>0)cam=true;}G.keys.KeyW=false;return{air,slow,cam};};
const r1=fly(st);ok(r1.air>10,'car got airborne on the ramp ('+r1.air+' ticks)');ok(G.MX.jumps.includes(st.id),'clean landing scores the unique jump');ok(r1.slow&&r1.cam,'slow-mo + camera punch-in on a new stunt jump');
const sc1=G.score;const n1=G.MX.jumps.length;fly(st);ok(G.MX.jumps.length===n1,'the same jump does not count twice');
G=load();ok(G.MX.jumps.includes(st.id),'stunt progress persists');
// --- 8. rampage
G=load();G.resetRun();G.wanted=4;G.cars.length=0;G.cars.push(G.player.car);G.mxPicks.push({x:G.player.x,y:G.player.y,t:0});G.tick();
ok(G.MXRG.on&&G.fx.rampage>25,'rampage pickup starts the timer');ok(String(G.FX_NAME.rampage).includes('0/10'),'HUD name shows progress');
const wr0=G.wallet;
for(let i=0;i<10;i++){const c=G.makeCar(G.player.x+100+i*10,G.player.y+60,0,'cop');c.hp=c.maxHp=95;G.cars.push(c);G.damage(c,999);}
G.tick();ok(!G.MXRG.on&&G.MX.rg===1,'10 wrecks complete the rampage');ok(G.wallet>=wr0+150,'rampage pays 150 coins');ok(G.score>=5000,'rampage pays score');
G=load();ok(G.MX.rg===1,'rampage count persists');
G.resetRun();G.wanted=4;G.cars.length=0;G.cars.push(G.player.car);G.mxPicks.push({x:G.player.x,y:G.player.y,t:0});G.tick();
for(let i=0;i<4;i++){const c=G.makeCar(G.player.x+100,G.player.y+60,0,'cop');G.cars.push(c);G.damage(c,999);}
G.fx.rampage=.02;for(let i=0;i<4;i++)G.tick();ok(!G.MXRG.on&&G.MX.rg===1,'rampage fails when time runs out');
// --- 9. soak: every new car x every new power for a while
for(const id of NEW){G=load();G.garage.owned.push(id);G.garage.sel=id;G.resetRun();G.wanted=4;G.keys.KeyW=true;let bad=0;
  for(let i=0;i<1800;i++){if(i%200===0)for(const pid of['oil','ram','homing'])G.applyPower(G.POWER.find(p=>p.id===pid));if(i%97===0)G.spawnEnemy('cop');G.keys.KeyF=i%3===0;G.keys.KeyD=(i>>6)%2===0;G.keys.KeyA=!G.keys.KeyD;G.tick();
    for(const c of G.cars)if(!fin(c.x)||!fin(c.y)||!fin(c.a)||!fin(c.v)||!fin(c.hp)){bad++;break;}
    if(G.state!=='play'){G.resetRun();}}
  ok(bad===0,'soak '+id+' + new powers, no NaN');}
console.log(fails?fails+' FAILED':'all ok');process.exit(fails?1:0);
