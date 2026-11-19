import {SUBJECTS as PRIMARY_SUBJECTS,aggregate,segments,comparison,groupComparisons,aggregateComponents,componentDefinitions} from './model.mjs';
const $=id=>document.getElementById(id),num=new Intl.NumberFormat('ca-ES',{maximumFractionDigits:1,minimumFractionDigits:1}),integer=new Intl.NumberFormat('ca-ES');
const f=x=>num.format(x),count=x=>integer.format(x),signed=x=>(x>=0?'+':'−')+f(Math.abs(x)),escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let data,mode='annual',cache=new Map(),stage='primary',SUBJECTS=PRIMARY_SUBJECTS;
const datasets=new Map();
const stageModes={primary:'annual',eso:'annual'};
const STAGES={
 primary:{file:'data.json',label:'6è de primària',heading:'resultats de sisè.',eyebrow:'EDUCACIÓ PRIMÀRIA · CATALUNYA',brand:'sisè',icon:'6',source:'https://analisi.transparenciacatalunya.cat/Educaci-/Avaluaci-de-sis-d-educaci-prim-ria/rk5x-gny6/about_data',name:'Avaluació de sisè d’educació primària',coverage:'2009–2025, sense registres de 2020. Anglès té dades a partir de 2010 i medi a partir de 2018. Francès no s’inclou.',missing:'Anglès és disponible des de 2010 i medi des de 2018.',territory:'Penedès i Alt Pirineu i Aran apareixen a partir de 2024; Barcelona Comarques deixa d’aparèixer el 2025 i hi apareix Barcelonès. Una fila de 2024 sense àrea es manté en els totals catalans.',territoryYear:2024,subjects:PRIMARY_SUBJECTS},
 eso:{file:'data-eso.json',label:'4t d’ESO',heading:'resultats de 4t d’ESO.',eyebrow:'EDUCACIÓ SECUNDÀRIA OBLIGATÒRIA · CATALUNYA',brand:'4t ESO',icon:'4',source:'https://analisi.transparenciacatalunya.cat/Educaci-/Avaluaci-de-quart-d-Educaci-Secund-ria-Obligat-ria/59vm-wwq7/about_data',name:'Avaluació de quart d’Educació Secundària Obligatòria',coverage:'2012–2025, amb registres de 2020. Ciència i tecnologia té puntuacions des de 2016. Francès i alemany no s’inclouen.',missing:'Ciència i tecnologia és disponible des de 2016.',territory:'Penedès, Alt Pirineu i Aran i Barcelonès apareixen a partir de 2023; Barcelona Comarques deixa d’aparèixer aquell any. Garraf consta en 19 registres de 2017; es manté sense reassignar-los.',territoryYear:2023,subjects:[...PRIMARY_SUBJECTS.slice(0,4),{key:'PCIEN',name:'Ciència i tecnologia',tag:'CT'}]}
};
const primaryMethod=document.getElementById('methodContent').innerHTML;

const filters=()=>({gender:$('gender').value,area:$('area').value,category:$('category').value});
const selectedLabel=()=>[$('gender').selectedOptions[0].textContent,($('area').value||'Tot Catalunya'),$('category').selectedOptions[0].textContent].join(' · ');
function stats(y,reference=false){const fs=reference?{}:filters(),key=JSON.stringify([y,fs]);if(!cache.has(key))cache.set(key,aggregate(data,y,fs));return cache.get(key)}
const svg=(body,label)=>`<svg class="chart" viewBox="0 0 340 182" role="img" aria-label="${escape(label)}">${body}</svg>`;
function distribution(s,c,name){const left=30,right=330,top=21,bottom=147,w=right-left;
 const max=Math.max(10,...s.bins.map(n=>100*n/s.n),...c.bins.map(n=>100*n/c.n)),limit=Math.ceil(max/10)*10,y=v=>bottom-v/limit*(bottom-top);
 let body='';for(let tick=0;tick<=limit;tick+=10){body+=`<line x1="${left}" x2="${right}" y1="${y(tick)}" y2="${y(tick)}" stroke="var(--line)"/><text x="24" y="${y(tick)+4}" text-anchor="end">${tick}</text>`}
 body+='<text x="30" y="10" class="axislabel">% de puntuacions</text>';
 s.bins.forEach((n,i)=>{const a=100*n/s.n,b=100*c.bins[i]/c.n,x=left+i*w/10;body+=`<rect x="${x+2}" y="${y(b)}" width="${w/10-4}" height="${bottom-y(b)}" fill="#cbd3de"><title>Catalunya · ${i*10}–${(i+1)*10} punts: ${f(b)}% (${count(c.bins[i])})</title></rect><rect x="${x+7}" y="${y(a)}" width="${w/10-14}" height="${bottom-y(a)}" fill="var(--green)" fill-opacity=".9"><title>Grup · ${i*10}–${(i+1)*10} punts: ${f(a)}% (${count(n)})</title></rect>`});
 for(const [stat,color,dash] of [[c,'#718399','4 3'],[s,'var(--green)','']]){const x=left+stat.mean/100*w;body+=`<line x1="${x}" x2="${x}" y1="18" y2="${bottom}" stroke="${color}" stroke-width="2" stroke-dasharray="${dash}"><title>Mitjana ${color==='var(--green)'?'del grup':'de Catalunya'}: ${f(stat.mean)}</title></line>`}
 for(let i=0;i<=100;i+=20)body+=`<text x="${left+i/100*w}" y="164" text-anchor="middle">${i}</text>`;
 body+='<text x="330" y="180" text-anchor="end" class="axislabel">Puntuació</text>';
 return svg(body,`${name}: distribució del grup i de Catalunya en intervals de deu punts. Mitjanes: ${f(s.mean)} i ${f(c.mean)}.`)
}
function trend(index){const first=data.years[0],last=data.years.at(-1),ys=Array.from({length:last-first+1},(_,i)=>first+i),left=30,right=330,top=14,bottom=147,x=y=>left+(y-first)/(last-first)*(right-left),py=v=>bottom-v/100*(bottom-top);let body='';
 for(let v=0;v<=100;v+=25)body+=`<line x1="${left}" x2="${right}" y1="${py(v)}" y2="${py(v)}" stroke="var(--line)"/><text x="23" y="${py(v)+4}" text-anchor="end">${v}</text>`;
 const from=+$('fromYear').value,to=+$('toYear').value;body+=`<rect x="${x(from)}" width="${Math.max(0,x(to)-x(from))}" y="${top}" height="${bottom-top}" fill="var(--green)" opacity=".045"/>`;
 for(const [reference,color] of [[true,'#91a0b4'],[false,'var(--green)']]){const points=ys.map(year=>({year,...stats(year,reference)[index]}));for(const segment of segments(points)){body+=`<path d="${segment.map((p,i)=>`${i?'L':'M'}${x(p.year).toFixed(2)},${py(p.mean).toFixed(2)}`).join(' ')}" fill="none" stroke="${color}" stroke-width="${reference?2:2.5}" stroke-linejoin="round"/>`}
 for(const p of points.filter(p=>p.mean!==null)){const marked=p.year===from||p.year===to;body+=`<circle cx="${x(p.year)}" cy="${py(p.mean)}" r="${marked?4:2.5}" fill="${color}" stroke="white" stroke-width="1"><title>${p.year} · ${reference?'Catalunya':'Grup'}: ${f(p.mean)} punts · n=${count(p.n)}</title></circle>`}}
 for(const yr of [...new Set([first,first+Math.round((last-first)/4),first+Math.round((last-first)/2),first+Math.round(3*(last-first)/4),last])])body+=`<text x="${x(yr)}" y="167" text-anchor="middle">${String(yr).slice(2)}</text>`;
 return svg(body,`${SUBJECTS[index].name}: evolució de la mitjana entre ${first} i ${last}. Escala de 0 a 100. Les dades de cada any es poden consultar a la taula desplegable.`)
}
function accessibleTable(i){return `<details class="data-table"><summary>Consulta les dades per any</summary><table><caption>${SUBJECTS[i].name} · Puntuacions mitjanes</caption><thead><tr><th>Any</th><th>Grup</th><th>Catalunya</th><th>n del grup</th></tr></thead><tbody>${data.years.map(y=>{const s=stats(y)[i],c=stats(y,true)[i];return `<tr><td>${y}</td><td>${s.n?f(s.mean):'—'}</td><td>${c.n?f(c.mean):'—'}</td><td>${count(s.n)}</td></tr>`}).join('')}</tbody></table></details>`}
function chartDataTable(i,s,c,trendMode){return `${trendMode?accessibleTable(i):`<details class="data-table"><summary>Consulta les dades dels intervals</summary><table><caption>Percentatge de puntuacions</caption><thead><tr><th>Interval</th><th>Grup</th><th>Catalunya</th></tr></thead><tbody>${s.bins.map((n,j)=>`<tr><td>${j*10}–${(j+1)*10}${j===9?' (inclòs)':''}</td><td>${s.n?f(100*n/s.n)+'%':'—'}</td><td>${c.n?f(100*c.bins[j]/c.n)+'%':'—'}</td></tr>`).join('')}</tbody></table></details>`}`;}
function componentStats(year,reference=false){const fs=reference?{}:filters(),key='components:'+JSON.stringify([year,fs]);if(!cache.has(key))cache.set(key,aggregateComponents(data,year,fs));return cache.get(key)}
function scoreCell(value){return value?.n?`<strong>${f(value.mean)}</strong><small>n = ${count(value.n)}</small>`:'<span class="no-score">Sense dades</span>'}
function scoreDetails(i,s,c,temporal){
 const definitions=componentDefinitions(data,SUBJECTS[i].key),year=+$('year').value,a=+$('fromYear').value,b=+$('toYear').value;
 const left=componentStats(temporal?a:year),right=componentStats(temporal?b:year,!temporal);
 const rows=definitions.map(d=>{const l=left[d.key],r=right[d.key];return `<tr><th scope="row">${d.label}</th><td>${scoreCell(l)}</td><td>${scoreCell(r)}</td>${temporal?`<td>${l?.n&&r?.n?signed(r.mean-l.mean):'—'}</td>`:''}</tr>`}).join('');
 return `<details class="score-details"><summary>Detall de les puntuacions</summary><div class="component-content"><p class="component-caption">${temporal?'Grup seleccionat · canvi en punts':`Mitjanes · ${year}`} · escala 0–100</p><table class="component-table"><caption class="sr-only">Components de ${SUBJECTS[i].name}</caption><thead><tr><th scope="col">Component</th><th scope="col">${temporal?a:'Grup'}</th><th scope="col">${temporal?b:'Catalunya'}</th>${temporal?'<th scope="col">Canvi</th>':''}</tr></thead><tbody>${rows||'<tr><td colspan="4">Sense components disponibles.</td></tr>'}</tbody></table><p class="component-note">n = puntuacions vàlides. Els components poden tenir pesos diferents en la puntuació global.</p>${chartDataTable(i,s,c,temporal)}</div></details>`;
}
function render(){if(!data)return;const year=+$('year').value,trendMode=mode==='trend';$('annualTab').classList.toggle('active',!trendMode);$('trendTab').classList.toggle('active',trendMode);$('annualTab').setAttribute('aria-pressed',!trendMode);$('trendTab').setAttribute('aria-pressed',trendMode);$('comparison').hidden=!trendMode;$('year').disabled=trendMode;$('viewEyebrow').textContent=trendMode?'EVOLUCIÓ DELS RESULTATS':'RESULTATS DE L’ANY';$('viewTitle').textContent=trendMode?'Com canvien les puntuacions?':`Les cinc competències · ${year}`;$('selectionLabel').textContent=selectedLabel();
 const notes=[];if(trendMode)notes.push('Comparació descriptiva de cohorts diferents. Les proves poden canviar entre edicions; les diferències no impliquen una millora o un empitjorament equivalent de l’aprenentatge. '+(data.years.includes(2020)?'':' No hi ha registres de 2020.'));
 const ar=$('area').value;if(ar&&(trendMode||year>=STAGES[stage].territoryYear))notes.push('Les categories territorials canvien entre edicions. No s’han equiparat les àrees; les comparacions territorials requereixen cautela.');
 const ss=stats(year),cc=stats(year,true);if(!trendMode&&ss.some(s=>!s.n))notes.push('Algunes competències no tenen puntuacions per a aquesta selecció. '+STAGES[stage].missing);
 $('notice').hidden=!notes.length;$('notice').textContent=notes.join(' ');
 $('charts').innerHTML=SUBJECTS.map((sub,i)=>{const displayYear=trendMode?+$('toYear').value:year,s=stats(displayYear)[i],c=stats(displayYear,true)[i],delta=s.n&&c.n?s.mean-c.mean:null;return `<article class="card"><div class="card-top"><h3>${sub.name}</h3></div><div class="metrics"><span class="score">${s.n?f(s.mean):'—'}</span><span class="outof">/ 100</span>${delta!==null&&Object.values(filters()).some(Boolean)?`<span class="delta" title="Diferència respecte del conjunt de Catalunya">${signed(delta)} punts</span>`:''}</div><p class="card-caption">${trendMode?`Mitjana del grup · ${displayYear}`:'Puntuació mitjana del grup'}</p>${trendMode?trend(i):s.n?distribution(s,c,sub.name):`<div class="empty"><strong>Sense dades disponibles</strong><span>No hi ha puntuacions per a aquesta selecció.</span></div>`}<div class="card-bottom"><span>Grup: <strong>n = ${count(s.n)}</strong></span><span>Catalunya: <strong>${c.n?f(c.mean):'—'}</strong></span></div>${scoreDetails(i,s,c,trendMode)}</article>`}).join('');
 $('readingText').textContent=trendMode?'Les línies mostren les mitjanes de cada edició. El fons ressaltat assenyala els dos anys comparats. Els salts sense dades no s’uneixen. La referència de Catalunya no canvia amb els filtres. Les taules desplegables permeten consultar tots els valors.':'Les barres mostren el percentatge de puntuacions en cada interval de 10 punts. Les marques verticals indiquen les mitjanes. La referència de Catalunya inclou tot l’alumnat amb puntuació disponible i no canvia amb els filtres.';
 $('charts').insertAdjacentElement(trendMode?'beforebegin':'afterend',$('summary'));$('summary').classList.toggle('annual-summary',!trendMode);$('summary').hidden=!(trendMode||filters().gender||filters().category);if(!$('summary').hidden)renderSummary();
}
function peerComparisonText(d,i){
 const context=d.key==='gender'
  ? `Àmbit: ${escape(filters().area||'tot Catalunya')} · ${escape($('category').selectedOptions[0].textContent)}.`
  : `Àmbit: ${escape(filters().area||'tot Catalunya')} · ${escape($('gender').selectedOptions[0].textContent)}.`;
 const rows=d.years.map(({year,left,right})=>{const l=left[i],r=right[i];
  if(!l.n||!r.n)return `<p>${year}: no hi ha puntuacions dels dos grups per fer la comparació.</p>`;
  return `<p><strong>${year}:</strong> ${d.leftLabel}, <strong>${f(l.mean)}</strong> punts; ${d.rightLabel.toLowerCase()}, <strong>${f(r.mean)}</strong> punts. Diferència (${d.differenceLabel}): <strong>${signed(l.mean-r.mean)} punts</strong>.</p><small>Puntuacions vàlides: ${d.leftLabel.toLowerCase()}, n=${count(l.n)}; ${d.rightLabel.toLowerCase()}, n=${count(r.n)}.</small>`;
 }).join('');
 let evolution='';if(d.years.length===2){const [a,b]=d.years;const vals=[a.left[i],a.right[i],b.left[i],b.right[i]];if(vals.every(v=>v.n)){const first=Math.abs(vals[0].mean-vals[1].mean),last=Math.abs(vals[2].mean-vals[3].mean),change=Math.round(last*10)-Math.round(first*10);evolution=`<p>La distància entre els dos grups ${change===0?'s’ha mantingut pràcticament igual':change<0?'s’ha reduït':'s’ha ampliat'}: de ${f(first)} a ${f(last)} punts.</p>`;}}
 return `<div class="peer-comparison"><h4>${d.title}</h4><p class="peer-context">${context}</p>${rows}${evolution}</div>`;
}
function renderSummary(){
 const temporal=mode==='trend',a=+$('fromYear').value,b=+$('toYear').value,years=temporal?[a,b]:[+$('year').value];
 const peers=groupComparisons(data,years,filters());
 const sa=stats(a),sb=stats(b),ca=stats(a,true),cb=stats(b,true);
 const title=temporal?`Què ha canviat entre ${a} i ${b}?`:`Com es comparen els grups el ${years[0]}?`;
 $('summary').innerHTML=`<p class="eyebrow">LA COMPARACIÓ, EN PARAULES</p><h2>${title}</h2><p class="summary-intro">${escape(selectedLabel())}. Diferències calculades a partir de les puntuacions disponibles; no són una explicació de les causes. Les comparacions entre grups mantenen la resta de filtres seleccionats.</p><div class="summary-grid">${SUBJECTS.map((s,i)=>{
  let temporalText='';if(temporal){const d=comparison(sa[i],sb[i],ca[i],cb[i]);if(!d)temporalText='<p>No hi ha dades del grup per als dos anys. No es pot calcular la diferència.</p>';else{const roundedGapChange=Math.round(Math.abs(d.endGap)*10)-Math.round(Math.abs(d.startGap)*10);const gap=roundedGapChange===0?'s’ha mantingut pràcticament igual':d.gapChange<0?'s’ha reduït':'s’ha ampliat';temporalText=`<p>La mitjana ha passat de <strong>${f(sa[i].mean)} a ${f(sb[i].mean)}</strong> punts (${signed(d.delta)}). A Catalunya, el canvi ha estat de <strong>${signed(d.referenceDelta)} punts</strong>.</p><p>La distància respecte de la mitjana catalana ${gap}: de ${f(Math.abs(d.startGap))} a ${f(Math.abs(d.endGap))} punts.</p><small>Puntuacions vàlides: ${a}, n=${count(sa[i].n)} · ${b}, n=${count(sb[i].n)}.</small>`;}}
  return `<article><h3>${s.name}</h3>${temporalText}${peers.map(d=>peerComparisonText(d,i)).join('')}</article>`;
 }).join('')}</div>`;
}
function updateAreas(){const prior=$('area').value;const ys=mode==='annual'?[+$('year').value]:data.years;const available=new Set(data.cells.filter(c=>ys.includes(c[0])&&c[2]).map(c=>c[2]));const areas=data.areas.filter(Boolean).sort((a,b)=>a.localeCompare(b,'ca'));$('area').innerHTML='<option value="">Tot Catalunya</option>'+areas.map(a=>`<option value="${escape(a)}">${escape(a)}${available.has(a)?'':' · sense dades aquest any'}</option>`).join('');if(areas.includes(prior))$('area').value=prior}
function exportCSV(){const ys=mode==='annual'?[+$('year').value]:data.years;const rows=[['etapa','any','competencia','genere','area_territorial','titularitat','mitjana_grup','n_grup','mitjana_catalunya','n_catalunya']];for(const y of ys)SUBJECTS.forEach((s,i)=>{const a=stats(y)[i],c=stats(y,true)[i],fl=filters();rows.push([STAGES[stage].label,y,s.name,fl.gender||'Tot',fl.area||'Tot Catalunya',fl.category||'Tots',a.n?a.mean.toFixed(4):'',a.n,c.n?c.mean.toFixed(4):'',c.n])});const csv='\ufeff'+rows.map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(';')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=`${stage==='primary'?'sise':'quart-eso'}-${mode==='annual'?$('year').value:'evolucio'}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function updateStageCopy(){
 const config=STAGES[stage];document.body.dataset.stage=stage;document.title=`${config.label} · Explorador de resultats`;
 $('stageTitle').innerHTML=`Una mirada als<br>${config.heading}`;$('stageEyebrow').textContent=config.eyebrow;$('brandName').textContent=config.brand;$('brandIcon').textContent=config.icon;
 $('yearRange').textContent=`${data.years[0]}—${data.years.at(-1)}`;$('editionCount').textContent=`${data.years.length} edicions disponibles`;$('totalRows').textContent=`${count(data.sourceRows)} registres a l’exportació`;
 document.querySelector('.source-link').href=config.source;document.querySelector('.footer-brand').textContent=config.brand;
 for(const [id,value] of [['primaryStage','primary'],['esoStage','eso']]){$(id).classList.toggle('active',stage===value);$(id).setAttribute('aria-pressed',stage===value)}
 if(stage==='primary')$('methodContent').innerHTML=primaryMethod;
 else $('methodContent').innerHTML=`<p><strong>Font:</strong> exportació del 19 de novembre de 2026 del conjunt «${config.name}», de Dades obertes de Catalunya. És una fotografia del fitxer aportat; no s’actualitza automàticament.</p><p><strong>Càlcul:</strong> mitjana aritmètica de les puntuacions globals vàlides (0–100), amb el mateix pes per registre. Els buits s’exclouen, no són zeros. Les mitjanes poden diferir dels informes oficials. «n» és el nombre de puntuacions vàlides.</p><p><strong>Cobertura:</strong> ${config.coverage}</p><p><strong>Territori:</strong> són àrees administratives educatives, no municipis. ${config.territory} No se suposa equivalència entre noms territorials.</p><p><strong>Interpretació:</strong> cada any correspon a una cohort diferent. No s’acredita una escala equiparada entre edicions ni entre etapes. Les diferències són descriptives, sense atribució de causes ni significació estadística. Les notes de 6è i 4t d’ESO no mesuren el progrés dels mateixos alumnes. Les distribucions són intervals de puntuació, no nivells oficials d’assoliment.</p><p><strong>Competències:</strong> Ciència i tecnologia correspon a PCIEN. La denominació o el contingut poden variar entre edicions. La categoria privada no permet separar centres concertats. Les etiquetes de gènere i titularitat s’han harmonitzat.</p><p>Només es distribueixen agregats; no s’inclouen codis d’alumne ni dates de naixement.</p><a href="${config.source}" target="_blank" rel="noreferrer">Consulta el conjunt de dades original</a>`;
}
async function loadStage(next){
 $('primaryStage').disabled=true;$('esoStage').disabled=true;$('loading').hidden=false;$('loading').textContent='Carregant els resultats…';
 try{
  if(!datasets.has(next)){const response=await fetch('./'+STAGES[next].file);if(!response.ok)throw Error('data');datasets.set(next,await response.json())}
  const prior={};for(const id of ['year','fromYear','toYear'])prior[id]=$(id).value;
  stageModes[stage]=mode;mode=stageModes[next];stage=next;data=datasets.get(next);SUBJECTS=STAGES[next].subjects;cache.clear();
  const opts=data.years.map(y=>`<option value="${y}">${y}</option>`).join('');
  for(const id of ['year','fromYear','toYear'])$(id).innerHTML=opts;
  $('year').value=data.years.includes(+prior.year)?prior.year:data.years.at(-1);
  $('fromYear').value=data.years.includes(+prior.fromYear)?prior.fromYear:data.years.at(-2);
  $('toYear').value=data.years.includes(+prior.toYear)?prior.toYear:data.years.at(-1);
  if(+$('fromYear').value>=+$('toYear').value){$('fromYear').value=data.years.at(-2);$('toYear').value=data.years.at(-1)}
  updateStageCopy();updateAreas();render();$('loading').hidden=true;
 }catch(error){$('loading').textContent='No s’han pogut carregar les dades d’aquesta etapa. Torna-ho a provar.';console.error(error)}
 finally{$('primaryStage').disabled=false;$('esoStage').disabled=false}
}
async function init(){await loadStage('primary');
 $('primaryStage').onclick=()=>loadStage('primary');$('esoStage').onclick=()=>loadStage('eso');
 $('annualTab').onclick=()=>{mode='annual';updateAreas();render()};$('trendTab').onclick=()=>{mode='trend';updateAreas();render()};
 for(const id of ['year','gender','area','category'])$(id).onchange=()=>{if(id==='year')updateAreas();render()};
 for(const id of ['fromYear','toYear'])$(id).onchange=()=>{if(+$('fromYear').value>=+$('toYear').value){if(id==='fromYear'){const later=data.years.find(y=>y>+$('fromYear').value);if(later)$('toYear').value=later;else{$('fromYear').value=data.years.at(-2);$('toYear').value=data.years.at(-1)}}else{const earlier=data.years.filter(y=>y<+$('toYear').value).at(-1);if(earlier)$('fromYear').value=earlier;else{$('fromYear').value=data.years[0];$('toYear').value=data.years[1]}}}render()};
 $('reset').onclick=()=>{for(const id of ['gender','area','category'])$(id).value='';render()};$('download').onclick=exportCSV;render();

}init();
