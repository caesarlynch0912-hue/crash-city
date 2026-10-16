// 2.3 test: the patrol helicopter is weaker and the attack helicopter (from HELI_STRONG points) stronger, every power-up has
// its own colour and repair is common, and the Legend X car + Legend skin come only from unlocking every achievement.
// Usage: node tools/simreward.js index.html   (exits 1 on any failure)
const fs=require('fs');const h=fs.readFileSync(process.argv[2],'utf8');
let s=h.split('<script>')[1].split('</script>')[0];s=s.slice(0,s.indexOf('/* ================= 3D'));s=s.replace("if(typeof THREE==='undefined')","if(false)");
const el=()=>({textContent:'',innerHTML:'',hidden:true,style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},appendChild(){},append(){},prepend(){},remove(){},addEventListener(){},setPointerCapture(){},querySelector:()=>el(),getBoundingClientRect:()=>({top:0}),children:[],focus(){}});
global.document={getElementById:()=>el(),createElement:()=>el(),documentElement:el()};global.matchMedia=()=>({matches:false});global.addEventListener=()=>{};
const store={'hh-tut':'1'};global.localStorage={getItem:k=>store[k]===undefined?null:store[k],setItem:(k,v)=>store[k]=String(v)};
let fails=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fails++;};
new Function('ok',s+`function sfx(){} function hideScreens(){} function showBrief(){} var paused=false; var camA=0;
// --- helicopter: damage taken in 30 s from the helicopter alone, player sitting in a car
const heliRun=(sc,w)=>{const se=spawnEnemy,sr=spawnRoadblock;spawnEnemy=()=>{};spawnRoadblock=()=>false;/* the helicopter alone */resetRun();const pc=player.car;pc.maxHp=pc.hp=99999;for(let i=cars.length-1;i>=0;i--)if(cars[i]!==pc)cars.splice(i,1);
  wanted=w;score=sc;heliCD=0;let hp0=0,lvl=-1,hp=0;
  for(let i=0;i<60*32;i++){runT=(w-1)*18+1;/* holds the wanted level: updateWorld sets it from runT */wanted=w;bustT=0;for(let j=cars.length-1;j>=0;j--)if(isEnemy(cars[j]))cars.splice(j,1);pc.v=0;tick();
    if(heli&&lvl<0){lvl=heli.lvl;hp=heli.hp;hp0=pc.hp;}}
  spawnEnemy=se;spawnRoadblock=sr;return{lvl,hp,dmg:hp0-pc.hp};};
const w4=heliRun(5000,4),w5=heliRun(5000,5),s4=heliRun(25000,4),s5=heliRun(25000,5);
console.log('     30 s of fire: patrol at 4 stars '+w4.dmg.toFixed(0)+', at 5 stars '+w5.dmg.toFixed(0)+' | attack at 4 stars '+s4.dmg.toFixed(0)+', at 5 stars '+s5.dmg.toFixed(0));
ok(w4.lvl===0&&w4.hp===200,'below 20 000 points a patrol helicopter comes (200 health)');
ok(w4.dmg===0,'the patrol helicopter holds fire at 4 stars');
ok(w5.dmg>0&&w5.dmg<s5.dmg/3,'it fires at 5 stars, far softer than the attack helicopter');
ok(s4.lvl===1&&s4.hp===360,'from 20 000 points it is an attack helicopter (360 health)');
ok(s4.dmg>0,'the attack helicopter already fires at 4 stars');
{resetRun();wanted=5;runT=999;score=5000;heliCD=0;for(let i=0;i<120;i++){wanted=5;tick();}const h1=heli;score=21000;for(let i=0;i<5;i++){wanted=5;tick();}
  ok(h1&&heli===h1&&heli.lvl===1&&heli.hp>200,'a patrol helicopter in the air becomes the attack one at 20 000 points ('+(heli&&heli.hp)+')');}
// --- power-ups
const cols=POWER.concat([KEYDEF]).map(powCol);
ok(POWER.every(d=>POW_COL[d.id])&&POW_COL.key,'every power-up has its own colour entry');
ok(new Set(cols).size===cols.length,'no two power-ups share a colour ('+new Set(cols).size+'/'+cols.length+')');
ok(powCol(POWER.find(d=>d.id==='repair'))==='#2bff5a','repair is green');
for(const [label,sc] of [['start',0],['top tier',9000]]){resetRun();score=sc;for(const c of CAR_SPECS)if(!owns(c.id)&&c.req<=KEY_MAX_REQ)garage.owned.push(c.id);
  powerups.length=0;let rep=0,n=0;for(let i=0;i<3000;i++){spawnPower();const p=powerups.pop();if(!p)continue;n++;if(p.def.id==='repair')rep++;}
  ok(rep/n>.28&&rep/n<.55,'repair is common at '+label+' ('+(rep/n*100).toFixed(0)+' % of power-ups)');}
// --- Legend reward
const legend=CAR_SPECS.find(c=>c.id==='legend'),lskin=SKINS.find(k=>k.id==='legend');
ok(!!legend&&!!lskin,'the Legend X car and the Legend skin exist');
ok(['speed','acc','grip'].every(k=>CAR_SPECS.every(c=>c===legend||c[k]<=legend[k]))&&legend.armor>=400,'Legend X tops speed, acceleration and grip, with heavy armour');
garage.owned=garage.owned.filter(id=>id!=='legend');for(const k in A.u)delete A.u[k];
resetRun();score=1e9;for(let i=0;i<30;i++)tick();ok(!owns('legend'),'no amount of score unlocks it');
ok(legend.ach&&legend.req===Infinity,'it has no score or coin price (req is Infinity, so the garage price is too)');
for(let i=0;i<200;i++)unlockNext();ok(!owns('legend'),'the golden key never gives it');
ok(!skinOK(lskin),'the Legend skin is locked');
const last=ACH[ACH.length-1];for(const a of ACH)if(a!==last)A.u[a.id]=1;achCheck();ok(!owns('legend')&&!skinOK(lskin),'one achievement short: still locked');
A.u[last.id]=1;achCheck();ok(owns('legend')&&skinOK(lskin),'every achievement: car in the garage and skin unlocked');
ok(stats.seen.includes('legend'),'the skin is announced as new');
`)(ok);
process.exit(fails?1:0);
