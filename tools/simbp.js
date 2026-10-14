// Battle Pass test: locked below 10 000, unlocks at 10 000, tiers pay coins/skins, progress survives a reload.
const fs=require('fs');const h=fs.readFileSync(process.argv[2],'utf8');
let s=h.split('<script>')[1].split('</script>')[0];s=s.slice(0,s.indexOf('/* ================= 3D'));s=s.replace("if(typeof THREE==='undefined')","if(false)");
const el=()=>({textContent:'',innerHTML:'',hidden:true,style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},appendChild(){},append(){},prepend(){},remove(){},addEventListener(){},setPointerCapture(){},querySelector:()=>el(),getBoundingClientRect:()=>({top:0}),children:[],focus(){}});
global.document={getElementById:()=>el(),createElement:()=>el(),documentElement:el()};global.matchMedia=()=>({matches:false});global.addEventListener=()=>{};
const store={};global.localStorage={getItem:k=>store[k]===undefined?null:store[k],setItem:(k,v)=>store[k]=String(v)};
const load=()=>new Function(s+`function sfx(){} function hideScreens(){} function showBrief(){} var paused=false; var camA=0;
  return {resetRun,tick,endRun,get bp(){return bp},get wallet(){return wallet},get score(){return score},set score(v){score=v},SKINS,skinOK,BP_TIERS,stats,get state(){return state},player,keys};`)();
let fails=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fails++;};
let G=load();G.resetRun();
// (a tick adds a few points of its own, so stay clear of exact thresholds)
G.score=9000;G.tick();ok(!G.bp.on,'locked at 9 000 points');
G.score=10000;G.tick();ok(G.bp.on&&G.bp.xp<100,'unlocks at 10 000, counting starts there (xp '+G.bp.xp+')');
const w0=G.wallet;G.score=10000+4000;G.tick();ok(G.bp.tier===1,'tier 1 after 4 000 more points');
ok(G.skinOK(G.SKINS.find(k=>k.id==='pork')),'John Pork unlocked at tier 1');ok(!G.skinOK(G.SKINS.find(k=>k.id==='sahur')),'Sahur still locked');
G.score=10000+4000*5;G.tick();ok(G.bp.tier===5,'tier 5');ok(G.skinOK(G.SKINS.find(k=>k.id==='sahur')),'Tung Tung Tung Sahur unlocked at tier 5');
ok(G.wallet-w0===100+150,'coins from tiers 2 and 4 paid ('+(G.wallet-w0)+')');
G.endRun('busted');
// reload the game: pass state comes back from localStorage, new run counts from 0
G=load();ok(G.bp.on&&G.bp.tier===5&&G.bp.xp===20000,'pass survives reload ('+JSON.stringify(G.bp)+')');
// (a tick adds a few points of its own, so stay clear of the 4 000 line)
G.resetRun();G.score=3000;G.tick();ok(G.bp.tier===5,'new run: 3 000 points not enough for tier 6');G.score=4000;G.tick();ok(G.bp.tier===6,'tier 6 after 4 000 in new run');
G.score=4000*20;G.tick();ok(G.bp.tier===G.BP_TIERS.length,'caps at tier '+G.BP_TIERS.length);ok(G.skinOK(G.SKINS.find(k=>k.id==='gsahur')),'Guld-Sahur unlocked at the last tier');
ok(G.BP_TIERS.every(t=>t.skin||t.coins>0),'every tier has a reward');
// controls: in the car Space drifts, Shift is nitro
G.resetRun();G.keys.KeyW=true;for(let i=0;i<90;i++)G.tick();G.keys.Space=true;G.tick();ok(G.player.car.drifting&&!G.player.nitroOn,'Space drifts, no nitro');
G.keys.Space=false;G.keys.ShiftLeft=true;G.tick();ok(G.player.nitroOn&&!G.player.car.drifting,'Shift fires nitro, no drift');
// a fresh player whose saved best is already over 10 000 gets the pass straight away
for(const k in store)delete store[k];store['hh-best']='13934';G=load();ok(G.bp.on&&G.bp.tier===0,'old record >= 10 000 opens the pass');
process.exit(fails?1:0);
