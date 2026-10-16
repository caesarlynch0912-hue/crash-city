// Street test (2.2): city traffic never crosses the highway, highway cars drive in the middle of their lanes,
// traffic and parked cars are varied, parked cars stand clear of walls and roads, and touching police keeps most of the speed.
// Usage: node tools/simstreet.js index.html   (exits 1 on any failure)
const fs=require('fs');const h=fs.readFileSync(process.argv[2],'utf8');
let s=h.split('<script>')[1].split('</script>')[0];s=s.slice(0,s.indexOf('/* ================= 3D'));s=s.replace("if(typeof THREE==='undefined')","if(false)");
const el=()=>({textContent:'',innerHTML:'',hidden:true,style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},appendChild(){},append(){},prepend(){},remove(){},addEventListener(){},setPointerCapture(){},querySelector:()=>el(),getBoundingClientRect:()=>({top:0}),children:[],focus(){}});
global.document={getElementById:()=>el(),createElement:()=>el(),documentElement:el()};global.matchMedia=()=>({matches:false});global.addEventListener=()=>{};
const store={'hh-tut':'1'};global.localStorage={getItem:k=>store[k]===undefined?null:store[k],setItem:(k,v)=>store[k]=String(v)};
let fails=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fails++;};
new Function('ok',s+`function sfx(){} function hideScreens(){} function showBrief(){} var paused=false; var camA=0;
resetRun();
// --- traffic and the highway: 90 s of traffic with the player parked out of the way
const pc0=player.car;let crossed=0,hwyOff=0,hwyN=0,seen={};
// just inside the ring, near the north stretch of the highway, on a street parallel to it
pc0.x=WORLD/2;pc0.y=(RING0+1)*CELL+60+LANE;pc0.a=0;player.x=pc0.x;player.y=pc0.y;
for(let i=cars.length-1;i>=0;i--)if(cars[i]!==pc0&&cars[i].kind==='civ')cars.splice(i,1);
for(let i=0;i<60*90;i++){pc0.v=0;wanted=0;for(let j=cars.length-1;j>=0;j--)if(isEnemy(cars[j]))cars.splice(j,1);tick();
  if(i%30)continue;
  for(const c of cars){if(c.kind!=='civ'||!c.ai)continue;seen[c.spec?c.spec.id:c.van?'van':'sedan']=1;
    if(!c.hwy&&inHwyBand(c.x,c.y))crossed++;
    if(c.hwy&&!c.turning){hwyN++;const lat=c.dir%2===0?Math.abs(c.y-(c.y<WORLD/2?HW0:HW1)):Math.abs(c.x-(c.x<WORLD/2?HW0:HW1));if(Math.abs(lat-30)>4&&Math.abs(lat-90)>4)hwyOff++;}}}
ok(crossed===0,'no city car drives onto the highway ('+crossed+' samples)');
ok(hwyN>50&&hwyOff/hwyN<.05,'highway cars keep to the middle of their lanes ('+hwyOff+'/'+hwyN+' off)');
const kinds=Object.keys(seen);ok(kinds.length>=12,'traffic is varied ('+kinds.length+' kinds: '+kinds.join(' ')+')');
ok(['limo','pizza','hotrod','camper','bubble'].filter(k=>seen[k]).length>=4,'the street-only models show up in traffic');
// --- parked cars
const spots=parkSpots();ok(spots.filter(s=>s.y0!==undefined).length>300&&spots.length>2000,'parking spots on driveways and in the countryside ('+spots.length+')');
let parkedSeen=0,bad=[],onRoad=0,kindsP={};
for(let k=0;k<12;k++){player.x=pc0.x=400+R()*(WORLD-800);player.y=pc0.y=400+R()*(WORLD-800);
  for(let i=0;i<300;i++){pc0.v=0;wanted=0;for(let j=cars.length-1;j>=0;j--)if(isEnemy(cars[j]))cars.splice(j,1);tick();}
  for(const c of cars){if(!c.parked||c.driven)continue;parkedSeen++;kindsP[c.spec?c.spec.id:'plain']=1;
    if(carHits(c,c.x,c.y,c.a))bad.push(Math.round(c.x)+','+Math.round(c.y));
    const ca=Math.cos(c.a),sa=Math.sin(c.a);for(const f of[-.5,0,.5])for(const l of[-.5,.5]){const x=c.x+ca*c.w*f-sa*c.h*l,y=c.y+sa*c.w*f+ca*c.h*l;if(isRoad(x,y)){onRoad++;break;}}}}
ok(parkedSeen>60,'parked cars appear around the player ('+parkedSeen+' seen over 12 places)');
ok(bad.length===0,'parked cars stand clear of walls and trees ('+bad.slice(0,3).join(' ')+')');
ok(onRoad===0,'parked cars stay off the road ('+onRoad+' corners on the road)');
ok(Object.keys(kindsP).length>=6,'parked cars are varied ('+Object.keys(kindsP).join(' ')+')');
// a parked car is taken at once (no driver to throw out)
{let c=cars.find(q=>q.parked&&!q.driven);
  if(!c){const sp=parkSpots().find(q=>q.y0!==undefined);player.x=pc0.x=sp.x-700;player.y=pc0.y=sp.y;for(let i=0;i<400&&!c;i++){tick();c=cars.find(q=>q.parked&&!q.driven);}}
  exitCar(false);player.x=c.x+Math.cos(c.a+PI/2)*28;player.y=c.y+Math.sin(c.a+PI/2)*28;unstickPlayer();
  enterCar(c);let t=0;while(player.jack&&t<200){tick();t++;}ok(player.car===c&&t<90,'a parked car is taken straight away ('+t+' ticks)');}
// --- touching police: once per contact
resetRun();const pc=player.car;for(let i=cars.length-1;i>=0;i--)if(cars[i]!==pc)cars.splice(i,1);
for(let k=2;k<N-2;k++){const y=k*CELL+60;let clear=true;for(let x=HW0+600;x<HW0+1400;x+=20)if(solid(x,y)){clear=false;break;}if(clear){pc.x=HW0+600;pc.y=y;break;}}
pc.a=0;player.x=pc.x;player.y=pc.y;const cop=makeCar(pc.x+140,pc.y+20,0,'cop');cop.v=2;cars.push(cop);wanted=1;
for(const k in keys)keys[k]=false;keys.KeyW=true;let vmin=99;
for(let i=0;i<90;i++){if(i<10)pc.v=7;tick();cop.stun=1;if(i>=10)vmin=Math.min(vmin,pc.v);}
ok(vmin>7*.7,'side-swiping a police car keeps most of the speed (lowest '+(vmin*21.6).toFixed(0)+' km/h of 151)');
ok(pc.hp>50&&pc.hp<100,'and still costs some armour ('+Math.round(pc.hp)+')');
`)(ok);
process.exit(fails?1:0);
