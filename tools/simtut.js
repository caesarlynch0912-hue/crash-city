// Tutorial test: first run starts the tutorial with no police, each step completes from real input,
// the run then turns into a normal chase, the tutorial is saved as seen, and Enter skips it.
// Usage: node tools/simtut.js index.html   (exits 1 on any failure)
const fs=require('fs');const h=fs.readFileSync(process.argv[2],'utf8');
let s=h.split('<script>')[1].split('</script>')[0];s=s.slice(0,s.indexOf('/* ================= 3D'));s=s.replace("if(typeof THREE==='undefined')","if(false)");
const el=()=>({textContent:'',innerHTML:'',hidden:true,style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},appendChild(){},append(){},prepend(){},remove(){},addEventListener(){},setPointerCapture(){},querySelector:()=>el(),getBoundingClientRect:()=>({top:0}),children:[],focus(){}});
global.document={getElementById:()=>el(),createElement:()=>el(),documentElement:el()};global.matchMedia=()=>({matches:false});
const listeners=[];global.addEventListener=(t,f)=>{if(t==='keydown')listeners.push(f);};
const store={};global.localStorage={getItem:k=>store[k]===undefined?null:store[k],setItem:(k,v)=>store[k]=String(v)};
let fails=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fails++;};
new Function('ok','store','listeners',s+`function sfx(){} function hideScreens(){} function showBrief(){} var paused=false; var camA=0;
const clear=()=>{for(const k in keys)keys[k]=false;};
const run=(n,f)=>{for(let i=0;i<n;i++){if(f)f(i);tick();for(const k in pressed)delete pressed[k];}};
resetRun();
ok(TUT.on&&TUT.step===0,'first run starts the tutorial');
run(60*20);
ok(wanted===0&&cars.filter(c=>isEnemy(c)).length===0,'no police while the tutorial waits (wanted '+wanted+')');
ok(TUT_STEPS[TUT.step].id==='drive','idle player stays on the first step');
clear();run(60*4,()=>{keys.KeyW=true;});
ok(TUT_STEPS[TUT.step].id==='nitro','driving completes step 1');
run(60*2,()=>{keys.KeyW=true;keys.ShiftLeft=true;});clear();
ok(TUT_STEPS[TUT.step].id==='drift','nitro completes step 2');
run(60*3,(i)=>{keys.KeyW=true;keys.KeyD=true;keys.Space=true;});clear();
ok(TUT_STEPS[TUT.step].id==='shoot','drifting completes step 3 (at '+TUT_STEPS[TUT.step].id+')');
run(60*3,(i)=>{keys.KeyF=i%20<10;});clear();
ok(TUT_STEPS[TUT.step].id==='exit','shooting completes step 4 (at '+TUT_STEPS[TUT.step].id+')');
run(2,(i)=>{if(i===0)pressed.KeyE=true;});run(10);
ok(TUT_STEPS[TUT.step].id==='jack','getting out completes step 5 (at '+TUT_STEPS[TUT.step].id+')');
const tc=TUT.car;ok(!!tc&&cars.includes(tc),'a car to steal is parked next to the player');
ok(tc&&dist(tc.x,tc.y,player.x,player.y)<130,'that car is close ('+(tc?Math.round(dist(tc.x,tc.y,player.x,player.y)):'-')+')');
run(60*2);ok(tc&&dist(tc.x,tc.y,player.x,player.y)<130,'it stays parked while the player looks at it');
// walk up to it and press E
run(60*3,()=>{if(player.jack||player.car)return;const d=dist(tc.x,tc.y,player.x,player.y);clear();
  if(d>40){const a=Math.atan2(tc.y-player.y,tc.x-player.x);player.x+=Math.cos(a)*2;player.y+=Math.sin(a)*2;}else pressed.KeyE=true;});
ok(player.car===tc,'pressing E next to it steals it');
ok(TUT_STEPS[TUT.step].id==='go','stealing completes step 6 (at '+(TUT_STEPS[TUT.step]||{}).id+')');
run(60*4);
ok(!TUT.on,'tutorial ends by itself after the last card');
ok(wanted>=1,'the chase starts (wanted '+wanted+')');
ok(store['hh-tut']==='1','tutorial saved as seen');
run(60*25);ok(cars.filter(c=>isEnemy(c)).length>0,'police arrive after the tutorial');
resetRun();ok(!TUT.on,'second run skips the tutorial');
// replay from How to play, then skip with Enter
TUT.want=true;resetRun();ok(TUT.on,'How to play can replay it');
for(const f of listeners)f({code:'Enter',preventDefault(){}});
ok(!TUT.on&&wanted>=1,'Enter skips it');
// wrecking the car in the first steps jumps to the car-jack step
TUT.want=true;resetRun();exitCar(true);run(5);
ok(TUT.on&&TUT_STEPS[TUT.step].id==='jack'&&!!TUT.car,'losing the car early skips to stealing one');
`)(ok,store,listeners);
process.exit(fails?1:0);
