// Every tr()/trf() key and every visible Swedish text must have all six translations.
const fs=require('fs');const h=fs.readFileSync(process.argv[2],'utf8');const D=require('./dict.js');const miss=new Set(),bad=[];
for(const m of h.matchAll(/(?<![\w$.])trf?\('((?:[^'\\]|\\.)*)'/g))if(!D[m[1]])miss.add('code: '+m[1]);
const body=h.slice(h.indexOf('</style>'),h.indexOf('<script src='));
const sw=/[åäöÅÄÖ]|\b(och|eller|till|för|på|du|en|att|med|Spela|Tillbaka|Klar|Tid|Bil|Mynt|Rekord|Paus|Spring|Skjut|Tuta|Sväng|Fly|Kontroller|Utmaningar|Fortsätt|Ljud)\b/;
for(const m of body.matchAll(/>([^<>]+)</g)){const t=m[1].replace(/&amp;/g,'&').replace(/&shy;/g,'').trim();if(t&&sw.test(t)&&!D[t])miss.add('html: '+t);}
for(const m of body.matchAll(/aria-label="([^"]+)"/g))if(!D[m[1]]&&sw.test(m[1]))miss.add('aria: '+m[1]);
const js=h.slice(h.indexOf('<script>'));for(const m of js.matchAll(/(?:name|desc):'([^']+)'/g))if(!D[m[1]]&&/[a-zåäö]{3}/i.test(m[1])&&sw.test(m[1]+' '))miss.add('data: '+m[1]);
for(const k in D)if(D[k].length!==6||D[k].some(v=>typeof v!=='string'||!v))bad.push(k);
// placeholders must survive translation
for(const k in D){const ph=(k.match(/\{\w\}/g)||[]).sort().join();for(const v of D[k])if((v.match(/\{\w\}/g)||[]).sort().join()!==ph)bad.push('placeholder: '+k+' -> '+v);}
console.log('dict keys',Object.keys(D).length,'missing',miss.size,'bad',bad.length);for(const m of miss)console.log('  MISSING',m);for(const b of bad)console.log('  BAD',b);process.exit(miss.size||bad.length?1:0);
