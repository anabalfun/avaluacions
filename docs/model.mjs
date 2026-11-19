export const SUBJECTS=[{key:'PCAT',name:'Llengua catalana',tag:'CA'},{key:'PCAST',name:'Llengua castellana',tag:'ES'},{key:'PMAT',name:'Matemàtiques',tag:'M'},{key:'PANG',name:'Llengua anglesa',tag:'EN'},{key:'PMED',name:'Medi',tag:'ME'}];
export function aggregate(data,year,filters={}){
 const stats=(data.subjects||SUBJECTS).map(()=>({n:0,sum:0,bins:Array(10).fill(0),mean:null}));
 for(const [y,g,a,c,values] of data.cells){if(y!==+year||(filters.gender&&g!==filters.gender)||(filters.area&&a!==filters.area)||(filters.category&&c!==filters.category))continue;
  values.forEach(([n,sum,bins],i)=>{stats[i].n+=n;stats[i].sum+=sum;bins.forEach((v,j)=>stats[i].bins[j]+=v)});
 }
 stats.forEach(s=>s.mean=s.n?s.sum/s.n:null);return stats;
}
export function segments(points){let parts=[],part=[];for(const p of points){if(p.mean===null){if(part.length)parts.push(part);part=[]}else part.push(p)}if(part.length)parts.push(part);return parts}
export function comparison(a,b,ca,cb){if(!a.n||!b.n||!ca.n||!cb.n)return null;return {delta:b.mean-a.mean,referenceDelta:cb.mean-ca.mean,startGap:a.mean-ca.mean,endGap:b.mean-cb.mean,gapChange:Math.abs(b.mean-cb.mean)-Math.abs(a.mean-ca.mean)}}
// Change only the dimension being compared; preserve every other selected filter.
export function groupComparisons(data,years,filters){
 const dimensions=[];
 if(filters.gender)dimensions.push({key:'gender',title:'Noies i nois',left:'D',right:'H',leftLabel:'Noies',rightLabel:'Nois',differenceLabel:'noies − nois'});
 if(filters.category)dimensions.push({key:'category',title:'Centres públics i privats',left:'Públic',right:'Privat',leftLabel:'Pública',rightLabel:'Privada',differenceLabel:'pública − privada'});
 return dimensions.map(d=>({...d,years:years.map(year=>({year,left:aggregate(data,year,{...filters,[d.key]:d.left}),right:aggregate(data,year,{...filters,[d.key]:d.right})}))}));
}
export function aggregateComponents(data,year,filters={}){
 const totals=Object.fromEntries((data.componentKeys||[]).map(k=>[k,{n:0,sum:0,mean:null}]));
 for(const [y,g,a,c,values] of data.componentCells||[]){
  if(y!==+year||(filters.gender&&g!==filters.gender)||(filters.area&&a!==filters.area)||(filters.category&&c!==filters.category))continue;
  values.forEach(([n,sum],i)=>{const t=totals[data.componentKeys[i]];t.n+=n;t.sum+=sum});
 }
 for(const t of Object.values(totals))t.mean=t.n?t.sum/t.n:null;
 return totals;
}
export function componentDefinitions(data,subject){
 const names={CO:'Comprensió oral',CL:'Comprensió lectora',CE:'Comprensió escrita',EE:'Expressió escrita',NC:'Numeració i càlcul',EFM:'Espai, forma i mesura',CR:'Canvi i relacions',EST:'Estadística',COMP1:'Explicar fenòmens i aplicacions',COMP2:'Investigació científica',COMP3:'Interpretar dades i proves',COMP4:'Analitzar explicacions tecnològiques'};
 const order=['CO','CL','CE','EE','NC','EFM','CR','EST','COMP1','COMP2','COMP3','COMP4'];
 return (data.componentKeys||[]).filter(k=>k.startsWith(subject+'_')).sort((a,b)=>order.indexOf(a.slice(subject.length+1))-order.indexOf(b.slice(subject.length+1))).map(key=>({key,label:names[key.slice(subject.length+1)]||key}));
}
