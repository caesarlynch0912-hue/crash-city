// Destructible street props test: placement, knock-over physics, settling, cap, rewards, quality tiers, soak.
const fs=require('fs');const h=fs.readFileSync(process.argv[2],'utf8');
let s=h.split('<script>')[1].split('</script>')[0];s=s.slice(0,s.indexOf('/* ================= 3D'));s=s.replace("if(typeof THREE==='undefined')","if(false)");
const el=()=>({textContent:'',innerHTML:'',hidden:true,style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},appendChild(){},append(){},prepend(){},remove(){},addEventListener(){},setPointerCapture(){},querySelector:()=>el(),getBoundingClientRect:()=>({top:0}),children:[],focus(){}});
global.document={getElementById:()=>el(),createElement:()=>el(),documentElement:el()};global.matchMedia=()=>({matches:false});global.addEventListener=()=>{};
const store={};global.localStorage={getItem:k=>store[k]===undefined?null:store[k],setItem:(k,v)=>store[k]=String(v)};
const load=()=>new Function(s+`function sfx(){} function hideScreens(){} function showBrief(){} var paused=false; var camA=0;
  return {resetRun,tick,N,CELL,ROAD,BS,WORLD,blocks,solid,isRoad,blockAt,cars,player,keys,fx,makeCar,propsBlock,propGrid,pbodies,pjets,PROP_CFG,PROP_DEF,propQuality,updateProps,propsReset,propStat,feed,
  get state(){return state},get score(){return score},get wallet(){return wallet},get T(){return T},set T(v){T=v},get runCoins(){return runCoins},achC,propLampBase};`)();
let fails=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fails++;};
let G=load();G.resetRun();
const {N,CELL,BS}=G;
// --- placement
let total=0;const byType={},lampPools=new Set();let badRoad=0,badSolid=0,badBlock=0,curbBlocks=0,lampCount=0,dupPool=0;
for(let i=0;i<N;i++)for(let j=0;j<N;j++){const b=G.blocks[i][j];if(b.curb)curbBlocks++;
  for(const p of G.propsBlock(i,j)){total++;byType[p.type]=(byType[p.type]||0)+1;
    if(G.isRoad(p.x,p.y))badRoad++;if(G.solid(p.x,p.y))badSolid++;
    if(p.x<b.bx||p.y<b.by||p.x>b.bx+BS||p.y>b.by+BS)badBlock++;
    if(p.type==='lamp'){lampCount++;if(lampPools.has(p.pool))dupPool++;lampPools.add(p.pool);}}}
ok(total>2000,'props generated across '+N+'x'+N+' map: '+total);
ok(['lamp','tlight','sign','palm','hydrant','bench','bin','fence','barrier','mailbox','cone'].every(t=>byType[t]>0),'every prop type is placed: '+JSON.stringify(byType));
ok(badRoad===0,'no prop on a road ('+badRoad+')');ok(badSolid===0,'no prop inside a building/solid ('+badSolid+')');ok(badBlock===0,'every prop inside its own block ('+badBlock+')');
ok(lampCount===curbBlocks*4&&dupPool===0&&lampPools.size===lampCount,'4 lamps per kerb block, unique light-pool index ('+lampCount+')');
const G2=load();let same=true;for(let i=0;i<N&&same;i++)for(let j=0;j<N;j++){const a=G.propsBlock(i,j),b=G2.propsBlock(i,j);if(a.length!==b.length||a.some((p,k)=>p.x!==b[k].x||p.y!==b[k].y||p.type!==b[k].type)){same=false;break;}}
ok(same,'placement is deterministic');
// --- helpers
const find=(type,skip)=>{for(let i=3;i<N-3;i++)for(let j=3;j<N-3;j++)for(const p of G.propsBlock(i,j))if(p.type===type&&p.s===0&&p.rk<1&&!(skip&&skip(p)))return p;return null;};
const mk=(p,v,ang)=>{G.cars.length=0;const c=G.makeCar(p.x-Math.cos(ang)*30,p.y-Math.sin(ang)*30,ang,'civ');c.ai=false;c.v=v;G.cars.push(c);G.player.car=c;G.player.x=p.x;G.player.y=p.y;return c;};
const fly=(c,n)=>{for(let i=0;i<n;i++){c.x+=Math.cos(c.a)*c.v;c.y+=Math.sin(c.a)*c.v;G.player.x=c.x;G.player.y=c.y;G.updateProps();G.T+=1/60;}};
// --- lamp topples
G.resetRun();G.player.hp=100;
const lamp=find('lamp',p=>!G.isRoad(p.x-30,p.y)&&!G.isRoad(p.x+30,p.y));
let c=mk(lamp,5,0);const sc0=G.score,w0=G.wallet,v0=c.v;
fly(c,12);
ok(lamp.s===1,'lamp is knocked over on impact');ok(c.v<v0&&c.v>v0*.8,'car slows slightly ('+v0+' -> '+c.v.toFixed(2)+')');
ok(G.pbodies.length>=1&&G.pbodies[0].mode==='p','lamp becomes a pivoting body');
ok(G.score>sc0&&G.wallet>w0,'score and coin reward ('+(G.score-sc0).toFixed(0)+' pts, +'+(G.wallet-w0)+' coin)');
ok(G.feed.length&&/VANDAL/.test(G.feed[0].text),'VANDAL feed entry: '+(G.feed[0]&&G.feed[0].text));
ok(G.achC('vandal')>=1&&G.propStat.run>=1,'vandal counter ticks for achievements/stats');
c.v=0;let maxTh=0;for(let i=0;i<180;i++){G.updateProps();G.T+=1/60;maxTh=Math.max(maxTh,G.pbodies[0]?G.pbodies[0].th:0);}
const lb=G.pbodies.find(b=>b.type==='lamp');ok(lb&&lb.rest&&lb.th>1.4&&maxTh<=Math.PI/2,'lamp falls flat and settles (th '+(lb&&lb.th.toFixed(2))+')');
for(let i=0;i<60*20&&G.pbodies.length;i++){G.updateProps();G.T+=1/60;}
ok(G.pbodies.length===0&&lamp.s===2,'fallen lamp despawns after a while');
G.propsReset();ok(lamp.s===0&&G.pbodies.length===0,'propsReset restores props');
// --- a faster hit tips it over faster
const lampB=find('lamp',p=>p!==lamp&&!G.isRoad(p.x-30,p.y)&&!G.isRoad(p.x+30,p.y));
const tipTime=v=>{G.propsReset();const c=mk(lampB,v,0);fly(c,12);c.v=0;let t=0;const b=G.pbodies[0];while(b&&b.th<1.5&&t<600){G.updateProps();t++;}return t;};
const tSlow=tipTime(2.2),tFast=tipTime(8);ok(tFast<tSlow,'faster car brings the lamp to the ground quicker ('+tFast+' vs '+tSlow+' ticks)');
// --- slow cars pass through cones
G.propsReset();const cone=find('cone');c=mk(cone,.3,0);fly(c,12);ok(cone.s===0,'a crawling car does not trigger a cone');
c=mk(cone,3,0);fly(c,12);ok(cone.s===1,'a moving car knocks the cone');
// --- hydrant: rigid body + water jet
G.propsReset();const hy=find('hydrant');c=mk(hy,4,0);fly(c,12);
ok(hy.s===1&&G.pjets.length===1,'hydrant bursts into a water jet');
const hb=G.pbodies.find(b=>b.type==='hydrant');ok(hb&&hb.vz!==0,'hydrant flies as a rigid body');
c.v=0;let minZ=1e9;for(let i=0;i<60*4;i++){G.updateProps();G.T+=1/60;if(hb)minZ=Math.min(minZ,hb.z-G.PROP_DEF.hydrant.hc);}
ok(hb.rest>0&&hb.vz===0&&minZ>=-0.01,'hydrant lands, bounces and settles on the ground (rest '+hb.rest.toFixed(2)+')');
for(let i=0;i<60*8;i++){G.updateProps();G.T+=1/60;}ok(G.pjets.length===0,'jet stops after a few seconds');
// --- bin throws lid + trash
G.propsReset();const bin=find('bin');c=mk(bin,4,0);fly(c,12);
ok(G.pbodies.some(b=>b.type==='lid')&&G.pbodies.filter(b=>b.type==='trash').length>=2,'bin spawns lid and trash');
// --- cap
G.propsReset();let maxB=0;for(const cap of [40,16]){G.propQuality(cap===40?1:3);G.propsReset();
  for(let i=3;i<N-3;i++)for(let j=3;j<N-3;j++)for(const p of G.propsBlock(i,j)){if(p.s!==0||p.rk>=G.PROP_CFG.dens)continue;const c=mk(p,5,0);c.x=p.x-4;c.y=p.y;fly(c,2);maxB=Math.max(maxB,G.pbodies.length);if(G.pbodies.length>G.PROP_CFG.cap)break;}
  ok(maxB<=G.PROP_CFG.cap,'body cap respected with cap '+G.PROP_CFG.cap+' (peak '+maxB+')');maxB=0;}
// --- quality tiers
G.propQuality(1);const live1=(()=>{let n=0;for(let i=0;i<N;i++)for(let j=0;j<N;j++)for(const p of G.propsBlock(i,j))if(p.rk<G.PROP_CFG.dens)n++;return n;})();
G.propQuality(3);const live3=(()=>{let n=0;for(let i=0;i<N;i++)for(let j=0;j<N;j++)for(const p of G.propsBlock(i,j))if(p.rk<G.PROP_CFG.dens)n++;return n;})();
ok(live3<live1*.7&&G.PROP_CFG.jets===0&&G.PROP_CFG.cap<40,'low quality: fewer props ('+live3+' vs '+live1+'), no jets, lower cap');
G.propQuality(3);G.propsReset();const hy2=find('hydrant');c=mk(hy2,4,0);fly(c,12);ok(G.pjets.length===0,'no hydrant jet on low quality');
G.propQuality(1);
// --- props never become solid: block obstacle lists unchanged by knocking, cars pass anywhere solid() allows
let bldBefore=0;for(const col of G.blocks)for(const b of col)bldBefore+=b.bld.length;
G.propsReset();let n2=0;for(let i=4;i<8;i++)for(let j=4;j<8;j++)for(const p of G.propsBlock(i,j)){p.s=1;n2++;}
let bldAfter=0;for(const col of G.blocks)for(const b of col)bldAfter+=b.bld.length;ok(bldBefore===bldAfter,'props are not part of solid()/building rects');
// --- soak: real ticks, driving through props with everything on
G.propsReset();G.resetRun();G.keys.KeyW=true;
let thrown=false;try{for(let i=0;i<60*120&&G.state==='play';i++){G.fx.ghost=9;G.fx.shield=9;G.tick();if(G.pbodies.length>G.PROP_CFG.cap)throw new Error('cap');}}catch(e){thrown=e;}
ok(!thrown,'120 s soak with props: no exceptions'+(thrown?' '+thrown.stack:'')+' (hits '+G.propStat.hit+')');
process.exit(fails?1:0);
