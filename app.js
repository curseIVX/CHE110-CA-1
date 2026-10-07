const fallback = window.SOLAR_DATA;
let DATA = fallback;
let backendOnline = false;

const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];

function toast(message){
  const t=$('#toast'); t.textContent=message; t.classList.add('show'); clearTimeout(t._timer); t._timer=setTimeout(()=>t.classList.remove('show'),2500);
}

async function api(path, options){
  try{const r=await fetch(path,options); if(!r.ok) throw new Error(); backendOnline=true; return await r.json();}catch(e){backendOnline=false; return null;}
}
async function hydrate(){
  const [overview,regions,states,capacity,sources] = await Promise.all([
    api('/api/overview'),api('/api/regions'),api('/api/states'),api('/api/capacity'),api('/api/sources')
  ]);
  if(overview&&regions&&states&&capacity&&sources){DATA={...fallback,overview,regions,states,capacity:capacity.capacity,timeline:capacity.timeline,sources};}
  const badge=$('#apiBadge'); const calc=$('.apiCalc');
  if(backendOnline){badge.classList.add('online'); badge.querySelector('span').textContent='Backend API live'; calc?.classList.add('online'); $('#calcStatus').textContent='Backend calculation enabled';}
  else{badge.classList.remove('online'); badge.querySelector('span').textContent='Offline-ready'; $('#calcStatus').textContent='Instant local estimate';}
  renderAll();
}

function renderAll(){renderTicker();renderMetrics();renderRegions();renderStates();renderCapacity();renderSources();calculate();initObservers();initDonut();}
function renderTicker(){
  const facts=[`<b>${DATA.overview.legacyPotential.value} GWp</b> legacy state-wise potential`,`<b>${DATA.overview.newPotential.value.toLocaleString()} GWp</b> newer ground-mounted assessment`,`<b>${DATA.overview.installed.value} GW</b> installed solar by Aug 2026`,`<b>Rajasthan</b> leads the legacy potential dataset`];
  $('#tickerInner').innerHTML=[...facts,...facts,...facts].map((x,i)=>`<span>${x}</span><i>✦</i>`).join('');
}
function renderMetrics(){
  const items=[
    {cls:'mSun',icon:'☀',tag:'SOLAR RESOURCE',value:`${DATA.overview.radiation.min}–${DATA.overview.radiation.max}`,unit:DATA.overview.radiation.unit,desc:DATA.overview.radiation.label,src:DATA.overview.radiation.source},
    {cls:'mBlue',icon:'◫',tag:'LEGACY POTENTIAL',value:DATA.overview.legacyPotential.value.toFixed(2),unit:DATA.overview.legacyPotential.unit,desc:DATA.overview.legacyPotential.label,src:DATA.overview.legacyPotential.source},
    {cls:'mGreen',icon:'⌁',tag:'NEWER ASSESSMENT',value:DATA.overview.newPotential.value.toLocaleString(),unit:DATA.overview.newPotential.unit,desc:DATA.overview.newPotential.label,src:DATA.overview.newPotential.source},
    {cls:'mOrange',icon:'⚡',tag:'INSTALLED',value:DATA.overview.installed.value.toFixed(2),unit:DATA.overview.installed.unit,desc:DATA.overview.installed.label,src:DATA.overview.installed.source}
  ];
  $('#metricGrid').innerHTML=items.map((m,i)=>`<article class="metricCard ${m.cls} reveal delay${Math.min(i,3)}" data-tilt><div class="metricTop"><span class="metricIcon">${m.icon}</span><small>${m.tag}</small></div><strong>${m.value}</strong><h3>${m.unit}</h3><p>${m.desc}</p><footer>${m.src}</footer></article>`).join('');
  initTilt();
}
let currentRegion='West';
function renderRegions(){
  $('#regionButtons').innerHTML=Object.entries(DATA.regions).map(([name,d])=>`<button class="regionBtn ${name===currentRegion?'active':''}" data-region="${name}"><b>${name}</b><small>${d.score}</small></button>`).join('');
  $$('.regionBtn').forEach(b=>b.addEventListener('click',()=>selectRegion(b.dataset.region)));
  selectRegion(currentRegion,false);
}
function selectRegion(name,animate=true){
  currentRegion=name; const d=DATA.regions[name];
  $$('.regionBtn').forEach(b=>b.classList.toggle('active',b.dataset.region===name));
  $('#regionTitle').textContent=name; $('#regionScore').textContent=d.score; $('#regionText').textContent=d.text; $('#regionStrategy').textContent=d.strategy;
  $('#regionFacts').innerHTML=d.facts.map(([n,v])=>`<span><b>${n}</b>${v.toFixed(2)} GWp</span>`).join('');
  if(animate){$('#regionMeter').style.width='0%';requestAnimationFrame(()=>requestAnimationFrame(()=>$('#regionMeter').style.width=d.scoreValue+'%'));} else $('#regionMeter').style.width=d.scoreValue+'%';
}
let stateOrder='desc'; let selectedState='Rajasthan';
function sortedStates(){return [...DATA.states].sort((a,b)=>stateOrder==='desc'?b.value-a.value:a.value-b.value)}
function renderStates(){
  const states=sortedStates();
  $('#stateSelect').innerHTML=states.map(s=>`<option ${s.name===selectedState?'selected':''}>${s.name}</option>`).join('');
  $('#stateSelect').onchange=e=>{selectedState=e.target.value;updateState();};
  $('#sortBtn').onclick=()=>{stateOrder=stateOrder==='desc'?'asc':'desc';$('#sortBtn').textContent=`↕ Sort: ${stateOrder==='desc'?'highest':'lowest'}`;renderStates();};
  $('#downloadCsv').onclick=downloadCsv; updateState(); renderBarChart();
}
function updateState(){
  const ranked=[...DATA.states].sort((a,b)=>b.value-a.value), s=DATA.states.find(x=>x.name===selectedState)||ranked[0], rank=ranked.findIndex(x=>x.name===s.name)+1;
  $('#stateName').textContent=s.name; $('#statePotential').textContent=s.value.toFixed(2); $('#stateInsight').textContent=s.insight; $('#stateRank').textContent='#'+rank;
}
function renderBarChart(){
  const states=sortedStates().slice(0,12), max=Math.max(...states.map(s=>s.value));
  $('#barChart').innerHTML=states.map(s=>`<div class="barItem"><div class="barLabel" title="${s.name}">${s.name}</div><div class="barTrack"><div class="barFill" data-width="${(s.value/max*100).toFixed(1)}%"></div></div><div class="barValue">${s.value.toFixed(1)}</div></div>`).join('');
  setTimeout(()=>$$('.barFill').forEach(b=>b.style.width=b.dataset.width),120);
}
function downloadCsv(){const rows=['State,Potential_GWp',...DATA.states.map(s=>`${s.name},${s.value}`)].join('\n'); const blob=new Blob([rows],{type:'text/csv'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob);a.download='SolarScope_India_State_Potential.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);toast('State dataset downloaded as CSV');}
function renderCapacity(){
  const colors=['#2c7da0','#ffd166','#58b27c','#ff8d3a'];
  $('#capacityList').innerHTML=DATA.capacity.map((c,i)=>`<div class="capacityRow"><i class="capacityDot" style="background:${colors[i]}"></i><div><b>${c.value.toFixed(2)} GW</b><small>${c.name}</small></div><strong>${c.share.toFixed(1)}%</strong></div>`).join('');
}
function initDonut(){
  const r=92,c=2*Math.PI*r; const shares=DATA.capacity.map(x=>x.share/100); let offset=0;
  $$('.donutSeg').forEach((el,i)=>{const len=c*shares[i]; el.style.strokeDasharray=`${len} ${c-len}`; el.style.strokeDashoffset=-offset; offset+=len;});
}
function renderSources(){
  $('#sourcesGrid').innerHTML=DATA.sources.map((s,i)=>`<a class="sourceCard reveal" href="${s.url}" target="_blank" rel="noopener"><span class="sourceNum">${String(i+1).padStart(2,'0')}</span><div><b>${s.title}</b><small>${s.use}</small></div><span>↗</span></a>`).join('');
}
async function calculate(){
  const size=+$('#sizeRange').value,sunHours=+$('#sunRange').value,performanceRatio=+$('#prRange').value/100;
  $('#sizeVal').textContent=size;$('#sunVal').textContent=sunHours.toFixed(1);$('#prVal').textContent=Math.round(performanceRatio*100);
  let result=null;
  if(backendOnline) result=await api('/api/calculate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({size,sunHours,performanceRatio})});
  const annual=result?.annualKWh ?? Math.round(size*sunHours*365*performanceRatio); const daily=result?.dailyKWh ?? +(annual/365).toFixed(1);
  animateNumber($('#annualEnergy'),annual); $('#dailyEnergy').textContent=daily.toFixed(1);
}
function animateNumber(el,target){const start=parseInt(el.textContent.replace(/,/g,''))||0,delta=target-start,t0=performance.now(),dur=420;function tick(t){const p=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-p,3);el.textContent=Math.round(start+delta*e).toLocaleString();if(p<1)requestAnimationFrame(tick)}requestAnimationFrame(tick)}
['sizeRange','sunRange','prRange'].forEach(id=>$('#'+id).addEventListener('input',()=>calculate()));

function initObservers(){
  const obs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');if(e.target.id==='capacity')initDonut();}}),{threshold:.12}); $$('.reveal').forEach(el=>{if(!el.classList.contains('visible'))obs.observe(el)});
  const sections=$$('main section[id]'); const navObs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)$$('#navLinks a').forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+e.target.id));}),{rootMargin:'-35% 0px -55% 0px'}); sections.forEach(s=>navObs.observe(s));
}
function initTilt(){
  $$('[data-tilt]').forEach(el=>{if(el._tilt)return;el._tilt=true;el.addEventListener('mousemove',e=>{if(innerWidth<900)return;const r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;el.style.transform=`perspective(900px) rotateX(${(-y*3).toFixed(2)}deg) rotateY(${(x*4).toFixed(2)}deg) translateY(-2px)`});el.addEventListener('mouseleave',()=>el.style.transform='');});
}

// ambient canvas particles
const canvas=$('#ambientCanvas'),ctx=canvas.getContext('2d');let particles=[];
function resizeCanvas(){canvas.width=innerWidth*devicePixelRatio;canvas.height=innerHeight*devicePixelRatio;ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);particles=Array.from({length:Math.min(65,Math.floor(innerWidth/20))},()=>({x:Math.random()*innerWidth,y:Math.random()*innerHeight,r:Math.random()*1.6+.3,v:Math.random()*.16+.04,a:Math.random()*.28+.05}));}
function drawParticles(){ctx.clearRect(0,0,innerWidth,innerHeight);for(const p of particles){p.y-=p.v;if(p.y<-5){p.y=innerHeight+5;p.x=Math.random()*innerWidth}ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=`rgba(122,226,218,${p.a})`;ctx.fill()}requestAnimationFrame(drawParticles)}resizeCanvas();drawParticles();addEventListener('resize',resizeCanvas);

// global interactions
addEventListener('scroll',()=>{const d=document.documentElement;$('#scrollProgress').style.width=(d.scrollTop/(d.scrollHeight-d.clientHeight)*100)+'%';$('#navShell').classList.toggle('scrolled',scrollY>50)});
addEventListener('mousemove',e=>{const g=$('#cursorGlow');g.style.left=e.clientX+'px';g.style.top=e.clientY+'px'});
$('#menuBtn').onclick=()=>$('#navLinks').classList.toggle('open');$$('#navLinks a').forEach(a=>a.onclick=()=>$('#navLinks').classList.remove('open'));

// guided tour / presentation mode
const presentSections=[...document.querySelectorAll('[data-present-title]')];let presentIndex=0;
function goPresent(i){presentIndex=(i+presentSections.length)%presentSections.length;const s=presentSections[presentIndex];s.scrollIntoView({behavior:'smooth',block:'start'});$('#presentIndex').textContent=String(presentIndex+1).padStart(2,'0');$('#presentTitle').textContent=s.dataset.presentTitle;}
function enterPresentation(){document.body.classList.add('presenting');if(document.documentElement.requestFullscreen)document.documentElement.requestFullscreen().catch(()=>{});goPresent(0);}
function exitPresentation(){document.body.classList.remove('presenting');if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});}
$('#presentBtn').onclick=enterPresentation;$('#tourBtn').onclick=enterPresentation;$('#nextSlide').onclick=()=>goPresent(presentIndex+1);$('#prevSlide').onclick=()=>goPresent(presentIndex-1);$('#exitPresent').onclick=exitPresentation;addEventListener('keydown',e=>{if(!document.body.classList.contains('presenting'))return;if(e.key==='ArrowRight'||e.key==='PageDown')goPresent(presentIndex+1);if(e.key==='ArrowLeft'||e.key==='PageUp')goPresent(presentIndex-1);if(e.key==='Escape')exitPresentation()});

hydrate();
