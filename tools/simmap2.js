// MAP 2 test: layout, river bridges, the stunt jump, highway traffic, hunters crossing the river, spawn filters.
const fs=require('fs');const h=fs.readFileSync(process.argv[2],'utf8');
let s=h.split('<script>')[1].split('</script>')[0];
s=s.slice(0,s.indexOf('/* ================= 3D'));
s=s.replace("if(typeof THREE==='undefined')","if(false)");
const el=()=>({textContent:'',innerHTML:'',hidden:true,style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},appendChild(){},append(){},prepend(){},remove(){},addEventListener(){},setPointerCapture(){},querySelector:()=>el(),getBoundingClientRect:()=>({top:0}),children:[],focus(){}});
global.document={getElementById:()=>el(),createElement:()=>el(),documentElement:el()};
global.matchMedia=()=>({matches:false});global.addEventListener=()=>{};const store={'hh-tut':'1'};/* tutorial already seen, so runs start with police */global.localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v};
const harness=`
function sfx(){} function hideScreens(){} function showBrief(){} var paused=false; var camA=0;
let fails=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fails++;};
// 1) layout
const kinds={};for(const col of blocks)for(const b of col)kinds[b.kind]=(kinds[b.kind]||0)+1;
console.log('world',WORLD,'N',N,JSON.stringify(kinds));
ok(['highway','river','neon','stadium','construction','desert','airport','industrial','mountain','downtown','harbor','beach'].every(k=>kinds[k]>0),'all districts exist');
ok(blocks.every(col=>col.every(b=>BIOMES[b.kind])),'every block has a biome');
// 2) every bridge line is drivable end to end, every other line is blocked by water
let bridgeOk=true,wallOk=true;
for(let r=0;r<=N;r++){const y=r*CELL+60;let blocked=false;for(let x=RX0-5;x<RX1+5;x+=4)if(solid(x,y))blocked=true;
  if(BR_SET.has(r)&&blocked)bridgeOk=false;if(!BR_SET.has(r)&&!blocked)wallOk=false;}
ok(bridgeOk,'bridge lines are open');ok(wallOk,'other lines are blocked by the river (incl. the stunt gap)');
// 3) the stunt jump: a stock car from the west reaches the east bank and gets the reward
let landed=0,rewarded=0;
for(const id of ['bruno','vega','taxi']){garage.owned=CAR_SPECS.map(s=>s.id);garage.sel=id;resetRun();fx.shield=9999;const c=player.car;c.x=RX0-1700;c.y=JY0+60;c.a=0;c.ma=0;c.v=0;const sc0=score;let maxx=0,wet=0;
  for(let i=0;i<900;i++){keys.KeyW=true;tick();if(!player.car)break;maxx=Math.max(maxx,c.x);if(process.env.DBG&&c.x>RX0-200&&i%3===0)console.log(i,Math.round(c.x),Math.round(c.y),c.v.toFixed(2),(c.z||0).toFixed(1),c.air?'air':'');if(!c.air&&riverHit(c.x,c.y))wet++;}
  console.log(id,'maxx',Math.round(maxx),'east bank at',Math.round(RX1),'wet ticks',wet,'score+',Math.round(score-sc0));
  if(maxx>RX1+10)landed++;if(score-sc0>=600)rewarded++;}
keys.KeyW=false;
ok(landed>=2,'stock cars clear the river gap ('+landed+'/3)');ok(rewarded>=2,'river jump reward paid ('+rewarded+'/3)');
// 4) driving into the river elsewhere never ends up inside the water
{garage.sel='bruno';resetRun();fx.shield=9999;const c=player.car;let inWater=0;for(const row of [9,11,15,20]){c.x=RX0-500;c.y=row*CELL+60;c.a=0;c.ma=0;c.v=0;for(let i=0;i<400;i++){keys.KeyW=true;tick();if(riverHit(c.x,c.y))inWater++;}}
  ok(inWater===0,'car stops at the shore on closed crossings');keys.KeyW=false;}
// 5) traffic: nobody drives into the river, highway cars exist and keep to the ring
{garage.sel='bruno';resetRun();fx.shield=9999;player.car.x=HW0+700;player.car.y=HW0+60;player.x=player.car.x;player.y=player.car.y;let bad=0,off=0,maxHw=0;
  for(let i=0;i<60*120;i++){player.car.v=0;player.car.x=HW0+700;player.car.y=HW0+60;tick();let n=0;for(const c of cars)if(c.ai&&c.kind==='civ'){if(riverHit(c.x,c.y))bad++;if(c.hwy){n++;const onRing=(Math.abs(c.y-HW0)<190||Math.abs(c.y-HW1)<190||Math.abs(c.x-HW0)<190||Math.abs(c.x-HW1)<190);if(!onRing)off++;}}
    maxHw=Math.max(maxHw,n);if(state!=='play')resetRun();}
  ok(bad===0,'no civilian in the water');ok(maxHw>0,'highway traffic present (max '+maxHw+')');ok(off===0,'highway cars stay on the ring');}
// 6) a hunter across the river finds a bridge
{let reached=0;for(let t=0;t<4;t++){garage.sel='bruno';resetRun();fx.shield=9999;const c=player.car;const px=RX1+400,py=(7+t*3)*CELL+60;c.x=px;c.y=py;c.a=0;c.v=0;player.x=px;player.y=py;
  for(let i=cars.length-1;i>=0;i--)if(cars[i]!==c)cars.splice(i,1);
  const cop=makeCar(RX0-900,(7+t*3+(t%2?1:-1))*CELL+60,0,'cop');cop.ai=false;cars.push(cop);wanted=0;
  for(let i=0;i<60*70;i++){c.v=0;c.x=px;c.y=py;tick();if(!cars.includes(cop))break;if(dist(cop.x,cop.y,c.x,c.y)<140||cop.x>RX1+30){reached++;break;}}console.log('hunter',t,'final dist',Math.round(dist(cop.x,cop.y,px,py)),'cop at',Math.round(cop.x),Math.round(cop.y));}
  ok(reached>=3,'hunters cross the river via a bridge ('+reached+'/4)');}
// 7) spawn helpers never return water points
{let bad=0;for(let i=0;i<3000;i++){const p=roadPoint(300,3000);if(p&&solid(p.x,p.y))bad++;const q=curbPoint();if(solid(q.x,q.y))bad++;}ok(bad===0,'roadPoint/curbPoint avoid solids');}
console.log(fails?'FAILED '+fails:'ALL OK');process.exit(fails?1:0);
`;
new Function(s+harness)();
