// Drift test (2.4): Space + steer gives a steady slide that costs some speed, counter-steering swings it the other way,
// grip comes back smoothly (not in one frame) when Space is let go, plain steering never slides, Space alone never slides,
// drift points only come from a real slide, and a car taken over carries no old slide.
// Usage: node tools/simdrift.js index.html   (exits 1 on any failure)
const fs=require('fs');const h=fs.readFileSync(process.argv[2],'utf8');
let s=h.split('<script>')[1].split('</script>')[0];s=s.slice(0,s.indexOf('/* ================= 3D'));s=s.replace("if(typeof THREE==='undefined')","if(false)");
const el=()=>({textContent:'',innerHTML:'',hidden:true,style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},appendChild(){},append(){},prepend(){},remove(){},addEventListener(){},setPointerCapture(){},querySelector:()=>el(),getBoundingClientRect:()=>({top:0}),children:[],focus(){}});
global.document={getElementById:()=>el(),createElement:()=>el(),documentElement:el()};global.matchMedia=()=>({matches:false});global.addEventListener=()=>{};
const store={'hh-tut':'1'};global.localStorage={getItem:k=>store[k]===undefined?null:store[k],setItem:(k,v)=>store[k]=String(v)};
let fails=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fails++;};
new Function('ok',s+`function sfx(){} function hideScreens(){} function showBrief(){} var paused=false; var camA=0;
const deg=r=>r*180/PI,kmh=v=>v*21.6;
// an open spot with nothing solid within 1000 units, so a test run never touches a wall
function openSpot(){for(let k=0;k<6000;k++){const x=300+R()*(WORLD-600),y=300+R()*(WORLD-600);let free=true;
  for(let a=0;a<TAU&&free;a+=.25)for(let r=0;r<=1000&&free;r+=25)if(solid(x+Math.cos(a)*r,y+Math.sin(a)*r))free=false;if(free)return{x,y};}return null;}
const spot=openSpot();ok(!!spot,'found an open test area');
// run: get up to speed (about 80 km/h), then follow the plan [{n,space,steer,gas}], logging every tick
function run(plan,carId){resetRun();const pc=player.car;if(carId){applySpec(pc,CAR_SPECS.find(q=>q.id===carId));}
  const clean=()=>{wanted=0;pc.hp=pc.maxHp;for(let j=cars.length-1;j>=0;j--)if(cars[j]!==pc)cars.splice(j,1);for(const p of peds)p.alive=false;};
  pc.x=spot.x;pc.y=spot.y;pc.a=0;pc.v=0;player.x=pc.x;player.y=pc.y;clean();
  for(const k in keys)keys[k]=false;keys.KeyW=true;
  for(let i=0;i<300&&pc.v<3.7;i++){clean();tick();}
  const log=[];let hits=0;
  for(const p of plan)for(let i=0;i<p.n;i++){keys.Space=!!p.space;keys.KeyD=p.steer>0;keys.KeyA=p.steer<0;keys.KeyW=p.gas!==0;clean();const v0=pc.v;tick();
    if(v0-pc.v>.5)hits++;log.push({v:pc.v,slip:carSlip(pc),a:pc.a,dr:pc.drifting,sl:isSliding(pc),pts:score});}
  for(const k in keys)keys[k]=false;return{log,hits,pc};}
// 1) a held drift settles into a steady slide angle and costs some speed (it used to speed up)
{const r=run([{n:90,space:1,steer:1}]);const L=r.log,v0=L[0].v,mid=L.slice(40,90).map(o=>Math.abs(deg(o.slip)));
  ok(r.hits===0,'drift run hit nothing ('+r.hits+')');
  ok(Math.min(...mid)>22&&Math.max(...mid)<52,'a held drift settles at a steady angle ('+Math.min(...mid).toFixed(0)+'-'+Math.max(...mid).toFixed(0)+' deg)');
  ok(Math.abs(deg(L[8].slip))>15,'the car kicks into the slide quickly ('+Math.abs(deg(L[8].slip)).toFixed(0)+' deg after 8 ticks)');
  const drop=1-L[89].v/v0;ok(drop>.06&&drop<.35,'a 1.5 s drift costs some speed ('+kmh(v0).toFixed(0)+' -> '+kmh(L[89].v).toFixed(0)+' km/h)');
  {const mx=Math.max(...L.slice(15).map(o=>o.v));ok(mx<=v0+.02,'once sliding the car never gains speed (max '+kmh(mx).toFixed(1)+' of '+kmh(v0).toFixed(1)+' km/h)');}
  ok(L.slice(10).every(o=>o.sl&&o.dr),'it counts as a slide the whole time');}
// 2) letting go of Space: grip comes back smoothly, not in one frame, and the car runs straight again
{const r=run([{n:60,space:1,steer:1},{n:60,space:0,steer:0}]);const L=r.log,at=i=>Math.abs(deg(L[60+i].slip));
  ok(at(5)>12,'just after letting go the car is still sliding ('+at(5).toFixed(0)+' deg after 5 ticks)');
  const back=L.slice(60).findIndex(o=>Math.abs(deg(o.slip))<5);ok(back>10&&back<40,'grip is back in 0.2-0.65 s ('+(back/60).toFixed(2)+' s)');
  ok(at(59)<1,'and the car runs straight after 1 s ('+at(59).toFixed(1)+' deg)');
  let jump=0;for(let i=60;i<120;i++)jump=Math.max(jump,Math.abs(deg(L[i].slip-L[i-1].slip)));ok(jump<8,'no snap: the angle changes at most '+jump.toFixed(1)+' deg per tick');}
// 3) counter-steering swings the slide to the other side (a flick)
{const r=run([{n:40,space:1,steer:1},{n:50,space:1,steer:-1}]);const L=r.log;
  ok(Math.sign(L[39].slip)!==Math.sign(L[89].slip)&&Math.abs(deg(L[89].slip))>15,'counter-steer flicks the car into a slide the other way ('+deg(L[39].slip).toFixed(0)+' -> '+deg(L[89].slip).toFixed(0)+' deg)');
  const n=run([{n:40,space:1,steer:1},{n:20,space:1,steer:0}]).log;
  ok(Math.abs(L[55].slip)<Math.abs(n[55].slip),'counter-steering straightens the slide faster than letting the wheel go');}
// 4) ordinary steering without Space keeps grip; Space alone without steering does nothing
{const r=run([{n:90,space:0,steer:1}]);const mx=Math.max(...r.log.map(o=>Math.abs(deg(o.slip))));
  ok(mx<8,'normal cornering keeps grip (max '+mx.toFixed(1)+' deg)');ok(r.log.every(o=>!o.sl),'and is never counted as a drift');
  const turn=deg(r.log[89].a-r.log[0].a);ok(turn>120&&turn<200,'normal turning rate is unchanged ('+turn.toFixed(0)+' deg in 1.5 s)');
  const q=run([{n:60,space:1,steer:0}]);ok(q.log.every(o=>Math.abs(deg(o.slip))<1&&!o.sl),'Space without steering does not slide');}
// 5) grippy cars slide less, heavy low-grip ones more
{const angle=id=>{const L=run([{n:80,space:1,steer:1}],id).log;return L.slice(50).reduce((a,o)=>a+Math.abs(deg(o.slip)),0)/30;};
  const lo=CAR_SPECS.reduce((a,b)=>b.grip<a.grip?b:a),hi=CAR_SPECS.filter(c=>!c.ach).reduce((a,b)=>b.grip>a.grip?b:a);
  const aLo=angle(lo.id),aHi=angle(hi.id);ok(aLo>aHi,'low grip '+lo.id+' ('+lo.grip+') slides wider than grippy '+hi.id+' ('+hi.grip+'): '+aLo.toFixed(0)+' vs '+aHi.toFixed(0)+' deg');
  ok(aHi>15&&aLo<60,'every car can still drift and none spins out');}
// 6) drift points come from a real slide only (counted from the "DRIFT n s +pts" feed line, so coins or props do not count)
{const msgs=[];const _pf=pushFeed;pushFeed=function(t,c){if(String(t).startsWith(tr('DRIFT')+' '))msgs.push(t);_pf(t,c);};
  run([{n:90,space:1,steer:1},{n:60,space:0,steer:0}]);ok(msgs.length===1&&msgs[0].includes(' +'),'a 1.5 s drift scores drift points ('+msgs.join(' | ')+')');
  msgs.length=0;run([{n:90,space:1,steer:0},{n:20,space:0,steer:0}]);ok(msgs.length===0,'holding Space on a straight scores no drift points ('+(msgs.join(' | ')||'none')+')');
  pushFeed=_pf;}
// 7) starts above about 54 km/h, keeps going down to about 35 km/h, none in the air
{resetRun();const pc=player.car;pc.x=spot.x;pc.y=spot.y;pc.a=0;player.x=pc.x;player.y=pc.y;for(const k in keys)keys[k]=false;
  pc.v=DRIFT_MIN_V-.3;keys.Space=true;keys.KeyD=true;tick();ok(!pc.drifting,'too slow to start a drift at '+kmh(pc.v).toFixed(0)+' km/h');
  pc.v=DRIFT_MIN_V+.5;tick();ok(pc.drifting,'a drift starts at '+kmh(pc.v).toFixed(0)+' km/h');
  pc.v=DRIFT_KEEP_V+.2;tick();ok(pc.drifting,'a started drift keeps going at '+kmh(pc.v).toFixed(0)+' km/h');
  pc.v=DRIFT_KEEP_V-.3;tick();ok(!pc.drifting,'and ends below '+kmh(DRIFT_KEEP_V).toFixed(0)+' km/h');
  pc.v=4;pc.air=true;pc.z=10;pc.vz=2;tick();ok(!pc.drifting&&!isSliding(pc),'no drift in the air');for(const k in keys)keys[k]=false;}
// 8) a car that was left mid-slide and taken back later carries no old slide
{resetRun();const pc=player.car;pc.x=spot.x;pc.y=spot.y;pc.a=0;player.x=pc.x;player.y=pc.y;tick();
  const other=makeCar(spot.x+80,spot.y,0,'civ');other.ai=false;other.ma=2.5;cars.push(other);exitCar(false);player.car=other;tick();
  ok(Math.abs(carSlip(other))<.01,'a newly taken car starts without a slide (slip '+deg(carSlip(other)).toFixed(1)+' deg)');}
`)(ok);
process.exit(fails?1:0);
