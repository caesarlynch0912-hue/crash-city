const fs=require('fs');const h=fs.readFileSync(process.argv[2],'utf8');
let s=h.split('<script>')[1].split('</script>')[0];
s=s.slice(0,s.indexOf('/* ================= 3D'));
s=s.replace("if(typeof THREE==='undefined')","if(false)");
const el=()=>({textContent:'',innerHTML:'',hidden:true,style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},appendChild(){},append(){},prepend(){},remove(){},addEventListener(){},setPointerCapture(){},querySelector:()=>el(),getBoundingClientRect:()=>({top:0}),children:[],focus(){}});
global.document={getElementById:()=>el(),createElement:()=>el(),documentElement:el()};
global.matchMedia=()=>({matches:false});global.addEventListener=()=>{};const store={'hh-tut':'1'};/* tutorial already seen, so runs start with police */global.localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v};
const harness=`
function sfx(){} function hideScreens(){} function showBrief(){} var paused=false; var camA=0;
const st={shots:0,maxShots:0,expl:0,airs:0,heliSeen:false,heliDown:0,feed:new Set(),runs:0,inside:0};
const oldExplode=explode;explode=function(...a){st.expl++;return oldExplode(...a);};
resetRun();
for(let i=0;i<60*600;i++){
  if(state==='over'){st.runs++;resetRun();}
  if(state==='play'){
    if(i%900===0){for(const w of WEAPONS)giveWeapon(w.id);fx.shield=10;}
    if(i%120===0)selectW(Math.floor(i/120)%5);
    keys.KeyF=(i%7)<5;keys.KeyW=true;keys.KeyA=(i%300)<40;keys.KeyD=(i%500)>460;keys.Space=(i%400)<15;
    if(i%30===0)keys.KeyH=!keys.KeyH;pressed.KeyH=keys.KeyH;
    if(!player.car&&!player.jack&&i%30===0){const c=nearestCar();if(c)enterCar(c);else{const civ=cars.find(c=>c.kind==='civ'&&c.hp>0&&!c.driven);if(civ){player.x=civ.x+10;player.y=civ.y+10;}}}
    if(i===60*30){const r=RAMPS[0];const c=player.car;if(c){c.x=r.horiz?r.x-120:r.x;c.y=r.horiz?r.y:r.y-120;c.a=r.horiz?0:PI/2;c.v=12;unstick(c);}}
  }
  tick();for(const k in pressed)delete pressed[k];
  st.maxShots=Math.max(st.maxShots,shots.length);if(heli)st.heliSeen=true;
  for(const c of cars){if(c.air)st.airs++;if(!c.ai&&carHits(c,c.x,c.y,c.a))st.inside++;}
  for(const f of feed)st.feed.add(f.text.split(' ')[0]);
}
console.log(JSON.stringify({runs:st.runs,expl:st.expl,maxShots:st.maxShots,airFrames:st.airs,heliSeen:st.heliSeen,wrecks,score:Math.floor(score),runT:Math.floor(runT),insideBuilding:st.inside,feedKinds:[...st.feed]}));
`;
new Function(s+harness)();
