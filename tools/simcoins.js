// Coin test: trails sit on the road's centre line, never on a ramp at ground level, never on the highway,
// jump trails follow the real jump (driving through one at the design speed collects it), and the coin count stays capped.
// Usage: node tools/simcoins.js index.html   (exits 1 on any failure)
const fs=require('fs');const h=fs.readFileSync(process.argv[2],'utf8');
let s=h.split('<script>')[1].split('</script>')[0];s=s.slice(0,s.indexOf('/* ================= 3D'));s=s.replace("if(typeof THREE==='undefined')","if(false)");
const el=()=>({textContent:'',innerHTML:'',hidden:true,style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},appendChild(){},append(){},prepend(){},remove(){},addEventListener(){},setPointerCapture(){},querySelector:()=>el(),getBoundingClientRect:()=>({top:0}),children:[],focus(){}});
global.document={getElementById:()=>el(),createElement:()=>el(),documentElement:el()};global.matchMedia=()=>({matches:false});global.addEventListener=()=>{};
const store={'hh-tut':'1'};global.localStorage={getItem:k=>store[k]===undefined?null:store[k],setItem:(k,v)=>store[k]=String(v)};
let fails=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fails++;};
new Function('ok',s+`function sfx(){} function hideScreens(){} function showBrief(){} var paused=false; var camA=0;
const onCentre=c=>{const cx=((c.x-60)%CELL+CELL)%CELL,cy=((c.y-60)%CELL+CELL)%CELL;return cx<.01||cx>CELL-.01||cy<.01||cy>CELL-.01;};
const check=(tag)=>{const ground=coins.filter(c=>(c.h||0)<3);
  ok(ground.filter(c=>!c.ramp).every(onCentre),tag+': trail coins sit on the road centre line');
  ok(ground.every(c=>!nearRamp(c.x,c.y,0)||c.ramp),tag+': no coin sits on a ramp at ground level');
  ok(coins.every(c=>!inHwyBand(c.x,c.y)),tag+': no coins on the highway');
  ok(coins.length<=300,tag+': coin count capped ('+coins.length+')');};
check('start');
const jumps=new Set(coins.filter(c=>c.ramp).map(c=>c.trail));
ok(jumps.size>=3,'jump trails exist ('+jumps.size+' of '+new Set(coins.map(c=>c.trail)).size+')');
ok(coins.some(c=>c.h>30),'jump coins reach the top of the arc ('+Math.max(...coins.map(c=>c.h||0)).toFixed(1)+')');
ok(RAMPS.every(r=>!inHwyBand(r.x,r.y)),'no ramps on the highway');
ok(barrels.every(b=>!inHwyBand(b.x,b.y)),'no barrels on the highway');
// drive through jump trails at a few speeds and count what gets picked up
resetRun();for(let i=cars.length-1;i>=0;i--)if(cars[i]!==player.car)cars.splice(i,1);wanted=0;
const ids=[...jumps].slice(0,6),res={};
for(const v0 of [COIN_JUMP_V,5.6,7.6]){let got=0,tot=0;
  for(const id of ids){const tr=coins.filter(c=>c.trail===id);if(!tr.length)continue;const r=tr[0].ramp,dir=r.horiz?Math.sign(tr[tr.length-1].x-tr[0].x):Math.sign(tr[tr.length-1].y-tr[0].y);
    // restore the trail if an earlier pass took it
    const save=tr.map(c=>Object.assign({},c));
    const pc=player.car;pc.a=r.horiz?(dir>0?0:PI):(dir>0?PI/2:-PI/2);pc.x=tr[0].x-Math.cos(pc.a)*60;pc.y=tr[0].y-Math.sin(pc.a)*60;pc.z=0;pc.vz=0;pc.air=false;pc.hp=pc.maxHp;player.x=pc.x;player.y=pc.y;
    const before=coins.filter(c=>c.trail===id).length;tot+=before;
    for(const k in keys)keys[k]=false;let air=false;
    for(let i=0;i<120;i++){if(!pc.air&&!air)pc.v=v0;if(pc.air)air=true;tick();for(const k in pressed)delete pressed[k];
      for(let j=cars.length-1;j>=0;j--)if(cars[j]!==pc&&isEnemy(cars[j]))cars.splice(j,1);wanted=0;if(air&&!pc.air&&i>40)break;}
    got+=before-coins.filter(c=>c.trail===id).length;
    for(let j=coins.length-1;j>=0;j--)if(coins[j].trail===id)coins.splice(j,1);for(const c of save)coins.push(c);}
  res[v0]=got+'/'+tot;}
const [g,t]=res[COIN_JUMP_V].split('/').map(Number);
ok(g>=t*.85,'driving through at the design speed collects the jump trails ('+res[COIN_JUMP_V]+')');
console.log('     collected at other speeds: '+Object.entries(res).map(([k,v])=>(k*21.6).toFixed(0)+' km/h '+v).join(', '));
// respawn churn keeps the rules
const n0=new Set(coins.map(c=>c.trail)).size;
for(let n=0;n<400;n++){if(!coins.length)break;const id=coins[Math.floor(R()*coins.length)].trail;for(let j=coins.length-1;j>=0;j--)if(coins[j].trail===id)coins.splice(j,1);
  player.x=200+R()*(WORLD-400);player.y=200+R()*(WORLD-400);spawnCoinTrail(R()<.7);}
check('after 400 respawns');
// a long run: the trail count is topped back up once a second
for(let n=0;n<3000;n++){const id=coins[Math.floor(R()*coins.length)].trail;for(let j=coins.length-1;j>=0;j--)if(coins[j].trail===id)coins.splice(j,1);spawnCoinTrail(true);}
resetRun();for(let i=0;i<60*60;i++){tick();for(let j=cars.length-1;j>=0;j--)if(isEnemy(cars[j]))cars.splice(j,1);}
const nL=new Set(coins.map(c=>c.trail)).size;ok(nL>=COIN_TRAILS-1,'after 3000 replacements and a minute of play the trails are back to '+COIN_TRAILS+' ('+nL+')');
const n1=new Set(coins.map(c=>c.trail)).size;// the trail count drifts a little with the jump/plain mix under COIN_CAP; what matters is that coins do not run out
ok(n1>=n0-5&&coins.length>=200,'trails are replaced, not lost ('+n0+' -> '+n1+' trails, '+coins.length+' coins)');
`)(ok);
process.exit(fails?1:0);
