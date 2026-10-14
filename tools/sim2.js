const fs=require('fs');const h=fs.readFileSync(process.argv[2],'utf8');
let s=h.split('<script>')[1].split('</script>')[0];
s=s.slice(0,s.indexOf('/* ================= 3D'));
s=s.replace("if(typeof THREE==='undefined')","if(false)");
const el=()=>({textContent:'',innerHTML:'',hidden:true,style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},appendChild(){},append(){},prepend(){},remove(){},addEventListener(){},setPointerCapture(){},querySelector:()=>el(),getBoundingClientRect:()=>({top:0}),children:[],focus(){}});
global.document={getElementById:()=>el(),createElement:()=>el(),documentElement:el()};
global.matchMedia=()=>({matches:false});global.addEventListener=()=>{};const store={};global.localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v};
const harness=`
function sfx(){} function hideScreens(){} function showBrief(){} var paused=false; var camA=0;
// 1) wall test: every car spec, full speed into walls with random steering
let inside=0,checks=0;
for(const spec of CAR_SPECS){garage.owned=CAR_SPECS.map(s=>s.id);garage.sel=spec.id;resetRun();fx.nitro=9999;fx.shield=9999;
  for(let i=0;i<60*40;i++){keys.KeyW=true;keys.KeyA=(i%240)<50;keys.KeyD=(i%410)>350;keys.Space=(i%700)<20;
    if(!player.car&&!player.jack){const c=nearestCar();if(c)enterCar(c);}
    tick();for(const k in pressed)delete pressed[k];
    for(const c of cars){if(c.ai)continue;checks++;if(carHits(c,c.x,c.y,c.a))inside++;}
    if(state!=='play')resetRun();}}
console.log('wall checks',checks,'overlaps after tick',inside);
// 2) direct ram: aim straight at a building at max speed from many angles
let bad=0;
for(let k=0;k<200;k++){resetRun();fx.nitro=9999;fx.shield=9999;const c=player.car;applySpec(c,CAR_SPECS[7]);
  const b=blocks[1+(k%6)][1+((k*3)%6)];const t=b.bld[0];if(!t)continue;c.x=t.x+t.w/2+Math.cos(k)*260;c.y=t.y+t.h/2+Math.sin(k)*260;
  unstick(c);c.a=Math.atan2(t.y+t.h/2-c.y,t.x+t.w/2-c.x);c.v=16;
  for(let i=0;i<120;i++){keys.KeyW=true;keys.KeyA=false;keys.KeyD=false;tick();if(carHits(c,c.x,c.y,c.a))bad++;}}
console.log('ram test overlaps',bad);
// 3) garage unlocks by score + key
garage={owned:['bruno'],sel:'bruno'};resetRun();score=7000;checkUnlocks();checkUnlocks();checkUnlocks();checkUnlocks();checkUnlocks();
console.log('owned after 7000p',garage.owned.join(','));applyPower(KEYDEF);console.log('after key',garage.owned.join(','),'saved',!!1);
`;
new Function(s+harness)();
