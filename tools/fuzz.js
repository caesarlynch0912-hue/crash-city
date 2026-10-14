// Parallel fuzz test for Crash City game logic. node fuzz.js <html> <scenariosPerWorker> <workers>
const {Worker,isMainThread,parentPort,workerData}=require('worker_threads');const fs=require('fs');
if(isMainThread){
  const file=process.argv[2],per=+process.argv[3]||2000,W=+process.argv[4]||7,t0=Date.now();let done=0,res=[];
  for(let w=0;w<W;w++){const wk=new Worker(__filename,{workerData:{file,per,wid:w}});
    wk.on('message',m=>{res.push(m);done++;if(done===W){const tot=res.reduce((a,b)=>a+b.n,0),ticks=res.reduce((a,b)=>a+b.ticks,0),fails=res.flatMap(r=>r.fails);
      const kinds={};for(const f of fails){const k=f.msg.replace(/[-\d.]+/g,'#').slice(0,90);kinds[k]=kinds[k]||{n:0,ex:f};kinds[k].n++;}
      const agg={};for(const r of res)for(const k in r.stats)agg[k]=(agg[k]||0)+r.stats[k];
      console.log(JSON.stringify({scenarios:tot,ticks,seconds:Math.round((Date.now()-t0)/1000),failures:fails.length,stats:agg},null,0));
      for(const k in kinds)console.log(kinds[k].n+'x  '+k+'\n     e.g. seed '+kinds[k].ex.seed+' tick '+kinds[k].ex.tick+(kinds[k].ex.stack?'\n     '+kinds[k].ex.stack:''));}});
    wk.on('error',e=>{console.error('worker error',e);});}
}else{
  const h=fs.readFileSync(workerData.file,'utf8');let s=h.split('<script>')[1].split('</script>')[0];s=s.slice(0,s.indexOf('/* ================= 3D'));s=s.replace("if(typeof THREE==='undefined')","if(false)");
  const el=()=>({textContent:'',innerHTML:'',hidden:true,style:{setProperty(){}},classList:{add(){},remove(){},toggle(){},contains(){return false}},appendChild(){},append(){},prepend(){},remove(){},addEventListener(){},setPointerCapture(){},querySelector:()=>el(),getBoundingClientRect:()=>({top:0}),children:[],focus(){}});
  global.document={getElementById:()=>el(),createElement:()=>el(),documentElement:el()};global.matchMedia=()=>({matches:false});global.addEventListener=()=>{};global.setTimeout=()=>0;
  const store={};global.localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=String(v);}};
  let seed=1;Math.random=()=>{seed=(Math.imul(seed^(seed>>>15),2246822519)+0x6D2B79F5)>>>0;seed^=seed>>>13;return(seed>>>0)/4294967296;};
  const G=new Function(s+`;function sfx(){} function hideScreens(){} function showBrief(){} var paused=false; var camA=0;
    return {reset:resetRun,tick,get state(){return state},player,cars,peds,parts,shots,coins,powerups,crates,mines,fx,POWER,WEAPONS,CAR_SPECS,garage,
      setWanted(w,m){wanted=w;military=m;runT=m?150:w*25;},get score(){return score},set score(v){score=v},keys,pressed,applyPower,giveWeapon,spawnEnemy,enterCar,exitCar,nearestCar,
      endRun,carHits,solid,roadPoint,unstick,isEnemy,get heli(){return heli},set heliCD(v){heliCD=v},selectW,switchW,get runCoins(){return runCoins},get wallet(){return wallet},
      get chals(){return chals},showOver,KEYDEF,setLang(l){LANG=l;},blocks,WORLD};`)();
  const fin=v=>typeof v==='number'&&isFinite(v);
  const fails=[],stats={jacks:0,powers:0,deaths:0,heli:0,coins:0,airborne:0,shotsFired:0};let ticks=0;
  for(let n=0;n<workerData.per;n++){const sd=(workerData.wid*1000003+n*7919+1)>>>0;seed=sd||1;let tick=0;
    try{G.garage.owned=G.CAR_SPECS.map(c=>c.id);G.garage.sel=G.CAR_SPECS[Math.floor(Math.random()*G.CAR_SPECS.length)].id;G.reset();
      const p=G.roadPoint(0,99999)||{x:G.player.x,y:G.player.y};const c0=G.player.car;c0.x=p.x;c0.y=p.y;c0.a=Math.random()*6.28;G.unstick(c0);G.player.x=c0.x;G.player.y=c0.y;
      if(Math.random()<.5)G.setWanted(1+Math.floor(Math.random()*5),Math.random()<.3);if(Math.random()<.3)G.heliCD=0;
      const coins0=G.wallet;
      for(tick=0;tick<240;tick++){const r=Math.random;
        if(tick%20===0){G.keys.KeyW=r()<.7;G.keys.KeyS=r()<.15;G.keys.KeyA=r()<.3;G.keys.KeyD=r()<.3;G.keys.Space=r()<.2;G.keys.KeyF=r()<.4;G.keys.ShiftLeft=r()<.3;if(r()<.2){const l=['en','sv','de','fr','es','da','no'];G.setLang(l[Math.floor(r()*7)]);}}
        if(r()<.01){G.pressed.KeyE=true;}
        if(r()<.006){G.pressed.KeyQ=true;}
        if(r()<.004){const d=r()<.06?G.KEYDEF:G.POWER[Math.floor(r()*G.POWER.length)];G.applyPower(d);stats.powers++;}
        if(r()<.003)G.giveWeapon(G.WEAPONS[1+Math.floor(r()*4)].id);
        if(r()<.004)G.spawnEnemy(r()<.7?'cop':'army');
        if(r()<.0015&&G.state==='play'){G.endRun(r()<.5?'busted':'wasted');stats.deaths++;}
        if(G.state==='over'){G.reset();}
        const wasJack=!!G.player.jack;G.tick();ticks++;for(const k in G.pressed)delete G.pressed[k];if(!wasJack&&G.player.jack)stats.jacks++;
        // invariants
        const P=G.player;if(!fin(P.x)||!fin(P.y)||!fin(P.a)||!fin(P.hp))throw new Error('player value not finite');
        if(!fin(G.score)||G.score<0)throw new Error('score invalid '+G.score);
        for(const c of G.cars){if(!fin(c.x)||!fin(c.y)||!fin(c.a)||!fin(c.v)||(c.z!==undefined&&!fin(c.z)))throw new Error('car value not finite kind='+c.kind);
          if(!c.ai&&G.carHits(c,c.x,c.y,c.a))throw new Error('car inside building kind='+c.kind+' v='+c.v.toFixed(2)+' air='+!!c.air);
          if(c.air)stats.airborne++;}
        if(!P.car&&!P.jack&&G.solid(P.x,P.y))throw new Error('player on foot inside building');
        if(G.parts.length>720)throw new Error('particles unbounded '+G.parts.length);
        if(G.shots.length>400)throw new Error('shots unbounded '+G.shots.length);
        if(G.cars.length>130)throw new Error('cars unbounded '+G.cars.length);
        if(G.peds.length>220)throw new Error('peds unbounded '+G.peds.length);
        if(G.coins.length>300)throw new Error('coins unbounded '+G.coins.length);
        if(G.powerups.length>8)throw new Error('powerups over cap '+G.powerups.length);
        if(!['play','dead','over'].includes(G.state))throw new Error('bad state '+G.state);
        if(G.player.car&&G.player.jack)throw new Error('in a car and jacking at once');
        if(G.chals.length!==3)throw new Error('challenge count '+G.chals.length);
        if(G.heli)stats.heli++;}
      stats.coins+=G.wallet-coins0;
    }catch(e){fails.push({seed:sd,tick,msg:String(e&&e.message||e),stack:(e&&e.stack||'').split('\n').slice(1,3).join(' | ').replace(/\s+/g,' ')});}}
  parentPort.postMessage({n:workerData.per,ticks,fails,stats});}
