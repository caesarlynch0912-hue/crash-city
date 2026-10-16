const fs=require('fs');const h=fs.readFileSync(process.argv[2],'utf8');
let s=h.split('<script>')[1].split('</script>')[0];s=s.slice(0,s.indexOf('/* ================= 3D'));s=s.replace("if(typeof THREE==='undefined')","if(false)");
const el=()=>({textContent:'',innerHTML:'',hidden:true,style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},appendChild(){},append(){},prepend(){},remove(){},addEventListener(){},setPointerCapture(){},querySelector:()=>el(),getBoundingClientRect:()=>({top:0}),children:[],focus(){}});
global.document={getElementById:()=>el(),createElement:()=>el(),documentElement:el()};global.matchMedia=()=>({matches:false});global.addEventListener=()=>{};const store={'hh-tut':'1'};/* tutorial already seen, so runs start with police */global.localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v};
new Function(s+`function sfx(){} function hideScreens(){} function showBrief(){} var paused=false; var camA=0;
resetRun();console.log('chals:',chals.map(chalText).join(' | '));
// carjack: walk out, find a civ car with a driver, jack it
exitCar(false);const civ=cars.filter(c=>c.kind==='civ'&&c.ai).sort((a,b)=>dist(a.x,a.y,player.x,player.y)-dist(b.x,b.y,player.x,player.y))[0];
player.x=civ.x+20;player.y=civ.y+20;const pedsBefore=peds.length;enterCar(civ);const phases=[];let t=0;
while(player.jack&&t<300){if(!phases.includes(player.jack.phase))phases.push(player.jack.phase);tick();t++;}
console.log('jack phases',phases.join('>'),'ticks',t,'inCar',player.car===civ,'driver spawned',peds.length-pedsBefore,'door',civ.doorOpen);
const drv=peds[peds.length-1];console.log('driver stumble',drv.stumble!==undefined, 'dist from car', Math.round(dist(drv.x,drv.y,civ.x,civ.y)));
// challenge completion
for(const c of chals){c.prog=c.def.biome?0:c.n-0.001;}const before=stats.chal;for(const c of chals){if(c.def.biome)chal('visit',c.biome);else chal(c.def.ev,c.def.max?c.n:1);}
console.log('completed',stats.chal-before,'score',Math.floor(score));for(let i=0;i<200;i++)tick();console.log('new chals:',chals.map(c=>c.done+':'+chalText(c)).join(' | '));
`)();
