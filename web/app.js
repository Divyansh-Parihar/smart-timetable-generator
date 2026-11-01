// Smart Timetable Generator — GitHub Theme Frontend
'use strict';

// ── State ──────────────────────────────────────────────────
const state = { subjects:[], rooms:[], subId:1, roomId:1, lastResult:null };

const COLORS = ["#58a6ff","#3fb950","#f78166","#d29922","#a371f7",
                 "#79c0ff","#56d364","#ffa198","#e3b341","#bc8cff",
                 "#388bfd","#2ea043","#da3633","#bb8009","#8957e5"];

// ── Test Cases ──────────────────────────────────────────────
const TEST_CASES = [
  {
    name:"🎓 CS Semester IV (Default)",
    desc:"6 core subjects, 3 rooms — typical engineering semester schedule.",
    subjects:[
      {name:"Mathematics",teacher:"Dr. Sharma",hoursPerWeek:5},
      {name:"Data Structures",teacher:"Prof. Gupta",hoursPerWeek:4},
      {name:"Operating Systems",teacher:"Dr. Mehta",hoursPerWeek:4},
      {name:"Computer Networks",teacher:"Prof. Singh",hoursPerWeek:3},
      {name:"Software Engineering",teacher:"Dr. Reddy",hoursPerWeek:3},
      {name:"DBMS",teacher:"Prof. Joshi",hoursPerWeek:4},
    ],
    rooms:[{name:"Room 101",capacity:60},{name:"Room 202",capacity:50},{name:"Lab A",capacity:30}],
    className:"CS — Semester IV", days:5, periodsPerDay:7
  },
  {
    name:"🏫 Small Class (Stress: minimal)",
    desc:"3 subjects, 1 room — smallest possible valid input. Tests edge cases.",
    subjects:[
      {name:"Physics",teacher:"Dr. Patel",hoursPerWeek:3},
      {name:"Chemistry",teacher:"Dr. Khan",hoursPerWeek:3},
      {name:"Biology",teacher:"Prof. Nair",hoursPerWeek:3},
    ],
    rooms:[{name:"Room 1",capacity:40}],
    className:"Science Class", days:5, periodsPerDay:7
  },
  {
    name:"🔥 Heavy Load (Stress: large)",
    desc:"8 subjects with shared teachers — tests conflict resolution under pressure.",
    subjects:[
      {name:"Algorithm Design",teacher:"Dr. Sharma",hoursPerWeek:5},
      {name:"Machine Learning",teacher:"Prof. Gupta",hoursPerWeek:4},
      {name:"Cloud Computing",teacher:"Dr. Mehta",hoursPerWeek:4},
      {name:"Cryptography",teacher:"Prof. Singh",hoursPerWeek:3},
      {name:"Compiler Design",teacher:"Dr. Sharma",hoursPerWeek:3},
      {name:"Computer Vision",teacher:"Prof. Gupta",hoursPerWeek:3},
      {name:"Distributed Systems",teacher:"Dr. Mehta",hoursPerWeek:3},
      {name:"NLP",teacher:"Dr. Reddy",hoursPerWeek:3},
    ],
    rooms:[{name:"Hall A",capacity:80},{name:"Hall B",capacity:60},{name:"Lab 1",capacity:40}],
    className:"CS — Semester VI", days:5, periodsPerDay:7
  },
  {
    name:"⚡ Same-Teacher Conflict Test",
    desc:"One teacher assigned to 3 subjects — graph coloring must schedule non-overlapping slots.",
    subjects:[
      {name:"Math I",teacher:"Dr. Sharma",hoursPerWeek:4},
      {name:"Math II",teacher:"Dr. Sharma",hoursPerWeek:4},
      {name:"Statistics",teacher:"Dr. Sharma",hoursPerWeek:3},
      {name:"English",teacher:"Prof. Roy",hoursPerWeek:3},
      {name:"Physics",teacher:"Prof. Roy",hoursPerWeek:3},
    ],
    rooms:[{name:"Room 101",capacity:60},{name:"Room 102",capacity:60}],
    className:"First Year Batch A", days:5, periodsPerDay:7
  },
  {
    name:"🏛️ University Full Schedule",
    desc:"10 subjects across 5 rooms — large-scale test showing GA optimisation power.",
    subjects:[
      {name:"Calculus",teacher:"Dr. Verma",hoursPerWeek:4},
      {name:"Linear Algebra",teacher:"Dr. Verma",hoursPerWeek:3},
      {name:"Programming",teacher:"Prof. Kumar",hoursPerWeek:5},
      {name:"Data Structures",teacher:"Prof. Kumar",hoursPerWeek:4},
      {name:"Physics",teacher:"Dr. Iyer",hoursPerWeek:4},
      {name:"Chemistry",teacher:"Dr. Rao",hoursPerWeek:3},
      {name:"English",teacher:"Prof. Das",hoursPerWeek:2},
      {name:"Economics",teacher:"Prof. Bose",hoursPerWeek:3},
      {name:"Psychology",teacher:"Dr. Nair",hoursPerWeek:2},
      {name:"Ethics",teacher:"Prof. Sen",hoursPerWeek:2},
    ],
    rooms:[
      {name:"Room 101",capacity:80},{name:"Room 102",capacity:70},
      {name:"Room 103",capacity:60},{name:"Lab A",capacity:40},{name:"Seminar Hall",capacity:100}
    ],
    className:"First Year All Branches", days:5, periodsPerDay:7
  },
];

// ── Tab switching (main) ────────────────────────────────────
function switchMainTab(tab) {
  ['schedule','analysis','testcases','about'].forEach(t => {
    document.getElementById('tab-'+t).style.display = t===tab ? (t==='schedule'?'grid':'block') : 'none';
    const btn = document.getElementById('maintab-'+t);
    if(btn) btn.className = 'gh-nav-tab' + (t===tab?' active':'');
  });
}

// ── Sidebar tab switching ───────────────────────────────────
function switchSideTab(tab) {
  ['subjects','rooms','config'].forEach(t => {
    document.getElementById('spanel-'+t).style.display = t===tab?'block':'none';
    const btn = document.getElementById('stab-'+t);
    if(!btn) return;
    btn.style.background    = t===tab ? 'var(--color-canvas-overlay)' : 'transparent';
    btn.style.borderColor   = t===tab ? 'var(--color-border-default)' : 'transparent';
    btn.style.color         = t===tab ? 'var(--color-fg-default)'     : 'var(--color-fg-muted)';
  });
}

// ── Validation helpers ──────────────────────────────────────
function showErr(id, show=true) {
  const el = document.getElementById(id);
  if(el) el.className = 'form-error' + (show?' visible':'');
}
function clearErr(...ids) { ids.forEach(id=>showErr(id,false)); }

function shakeEl(id) {
  const el = document.getElementById(id);
  if(!el) return;
  el.style.animation='none';
  void el.offsetWidth;
  el.style.animation='shake 0.4s ease';
  el.classList.add('error');
  setTimeout(()=>el.classList.remove('error'), 1500);
}

// ── Add subject ─────────────────────────────────────────────
function addSubject() {
  clearErr('err-sub-name','err-sub-teacher','err-sub-dup','err-sub-hours');
  const name    = document.getElementById('sub-name').value.trim();
  const teacher = document.getElementById('sub-teacher').value.trim();
  const hours   = parseInt(document.getElementById('sub-hours').value);
  let valid = true;
  if(!name)   { showErr('err-sub-name');    shakeEl('sub-name');    valid=false; }
  if(!teacher){ showErr('err-sub-teacher'); shakeEl('sub-teacher'); valid=false; }
  if(hours<1||hours>10||isNaN(hours)){ showErr('err-sub-hours'); shakeEl('sub-hours'); valid=false; }
  if(name && state.subjects.find(s=>s.name.toLowerCase()===name.toLowerCase())) {
    showErr('err-sub-dup'); shakeEl('sub-name'); valid=false;
  }
  if(!valid) return;
  state.subjects.push({ id:state.subId++, name, teacher, hoursPerWeek:hours, color:COLORS[state.subjects.length%COLORS.length] });
  document.getElementById('sub-name').value='';
  document.getElementById('sub-teacher').value='';
  document.getElementById('sub-hours').value='4';
  renderSubjects(); updateHint();
}

// ── Add room ────────────────────────────────────────────────
function addRoom() {
  clearErr('err-room-name','err-room-dup');
  const name = document.getElementById('room-name').value.trim();
  const cap  = parseInt(document.getElementById('room-cap').value)||60;
  if(!name){ showErr('err-room-name'); shakeEl('room-name'); return; }
  if(state.rooms.find(r=>r.name.toLowerCase()===name.toLowerCase())){ showErr('err-room-dup'); shakeEl('room-name'); return; }
  state.rooms.push({ id:state.roomId++, name, capacity:cap });
  document.getElementById('room-name').value='';
  document.getElementById('room-cap').value='60';
  renderRooms(); updateHint();
}

function removeSubject(id){ state.subjects=state.subjects.filter(s=>s.id!==id); renderSubjects(); updateHint(); }
function removeRoom(id)   { state.rooms=state.rooms.filter(r=>r.id!==id);       renderRooms();    updateHint(); }
function clearSubjects()  { state.subjects=[]; renderSubjects(); updateHint(); }
function clearRooms()     { state.rooms=[]; renderRooms(); updateHint(); }

function renderSubjects() {
  document.getElementById('sub-count').textContent='('+state.subjects.length+')';
  document.getElementById('subject-list').innerHTML = state.subjects.map(s=>`
    <div class="item-card">
      <div class="item-dot" style="background:${s.color}"></div>
      <div class="item-info">
        <div class="item-name">${esc(s.name)}</div>
        <div class="item-meta">${esc(s.teacher)} · ${s.hoursPerWeek}h/wk</div>
      </div>
      <button class="btn btn-danger btn-sm" onclick="removeSubject(${s.id})">✕</button>
    </div>`).join('');
}

function renderRooms() {
  document.getElementById('room-count').textContent='('+state.rooms.length+')';
  document.getElementById('room-list').innerHTML = state.rooms.map(r=>`
    <div class="item-card">
      <div class="item-dot" style="background:var(--color-success-fg)"></div>
      <div class="item-info">
        <div class="item-name">${esc(r.name)}</div>
        <div class="item-meta">Capacity: ${r.capacity}</div>
      </div>
      <button class="btn btn-danger btn-sm" onclick="removeRoom(${r.id})">✕</button>
    </div>`).join('');
}

function updateHint() {
  const btn  = document.getElementById('gen-btn');
  const hint = document.getElementById('gen-hint');
  const errDiv = document.getElementById('gen-validation-errors');
  const days = parseInt(document.getElementById('cfg-days').value)||5;
  const perd = parseInt(document.getElementById('cfg-periods').value)||7;
  const totalSlots = days*perd;
  const totalSessions = state.subjects.reduce((a,s)=>a+s.hoursPerWeek,0);
  let errors=[], ready=true;
  if(!state.subjects.length){ errors.push('Add at least 1 subject'); ready=false; }
  if(!state.rooms.length)   { errors.push('Add at least 1 room'); ready=false; }
  if(state.subjects.length && totalSessions > totalSlots*state.rooms.length) {
    errors.push(`⚠️ ${totalSessions} sessions exceed ${totalSlots} available slots. Reduce hours or add more rooms.`);
  }
  btn.disabled = !ready;
  hint.textContent = ready ? `${state.subjects.length} subjects · ${state.rooms.length} rooms · ${totalSessions} sessions → ready!` : errors[0]||'';
  errDiv.innerHTML = errors.slice(1).map(e=>`<div class="gh-alert gh-alert-warning" style="padding:8px 12px;font-size:12px;margin-top:4px"><span>⚠️</span><span>${e}</span></div>`).join('');
}

// ── Generate ────────────────────────────────────────────────
async function generateTimetable() {
  switchMainTab('schedule');
  showState('loading');
  startLoadingAnim();

  const payload = {
    className:     document.getElementById('cfg-class').value||'Class',
    days:          parseInt(document.getElementById('cfg-days').value),
    periodsPerDay: parseInt(document.getElementById('cfg-periods').value),
    breakAfter:    parseInt(document.getElementById('cfg-break').value),
    subjects:      state.subjects,
    rooms:         state.rooms,
  };

  try {
    const res = await fetch('/generate',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload)
    });
    if(!res.ok){ const e=await res.json(); throw new Error(e.error||`HTTP ${res.status}`); }
    const data = await res.json();
    if(data.error) throw new Error(data.error);
    state.lastResult = data;
    state.lastPayload = payload;
    renderResult(data, payload.breakAfter);
    showState('result');
  } catch(err) {
    showState('empty');
    showAlert('error','❌ '+err.message+'. Make sure <code>run.sh</code> has been executed and the server is running on port 8080.');
  }
}

// ── Loading animation ───────────────────────────────────────
let _lt=null;
function startLoadingAnim() {
  clearTimeout(_lt);
  const steps=[0,1,2,3,4,5];
  steps.forEach(i=>{ const el=document.getElementById('lstep-'+i); if(el){ el.className='loading-step step-pending'; el.textContent='○ '+el.textContent.replace(/^[◉○✓] /,''); } });
  let i=0;
  function tick(){
    if(i>0){ const prev=document.getElementById('lstep-'+(i-1)); if(prev){ prev.className='loading-step step-done'; prev.textContent='✓ '+prev.textContent.replace(/^[◉○✓] /,''); } }
    const cur=document.getElementById('lstep-'+i);
    if(cur){ cur.className='loading-step step-running'; cur.textContent='◉ '+cur.textContent.replace(/^[◉○✓] /,''); }
    if(i<5){ i++; _lt=setTimeout(tick,700); }
  }
  tick();
}

// ── Render result ───────────────────────────────────────────
function renderResult(data, breakAfter) {
  clearTimeout(_lt);
  const fit=(data.fitness*100).toFixed(1);
  document.getElementById('s-fitness').textContent=fit+'%';
  document.getElementById('s-fitness').className='stat-value '+(data.fitness>=0.99?'success':data.fitness>=0.8?'accent':'danger');
  document.getElementById('s-conflicts').textContent=data.hardConflicts;
  document.getElementById('s-conflicts').className='stat-value '+(data.hardConflicts===0?'success':'danger');
  document.getElementById('s-sessions').textContent=data.totalSessions;
  document.getElementById('s-time').textContent=(data.stats?.elapsedMs||0).toFixed(1);
  document.getElementById('tt-class-name').textContent=data.className+' — Timetable';
  document.getElementById('conflict-badge').textContent=data.hardConflicts;

  const alertDiv=document.getElementById('result-alert');
  if(data.hardConflicts===0){
    alertDiv.innerHTML=`<div class="gh-alert gh-alert-success">✅ <strong>Perfect schedule</strong> — zero conflicts. All ${data.totalSessions} sessions placed successfully in ${(data.stats?.elapsedMs||0).toFixed(1)}ms.</div>`;
  } else {
    alertDiv.innerHTML=`<div class="gh-alert gh-alert-warning">⚠️ ${data.hardConflicts} conflict(s) remain. Try increasing <strong>Generations</strong> in Config tab.</div>`;
  }

  buildGrid(data, breakAfter);
  buildLegend(data);
  renderAnalysis(data);
}

// ── Timetable grid ──────────────────────────────────────────
function buildGrid(data, breakAfter=-1) {
  const tt=data.timetable; if(!tt?.length) return;
  const days=tt.map(d=>d.dayName);
  const periods=tt[0].periods;
  document.getElementById('tt-head').innerHTML=`<tr><th>Time</th>${days.map(d=>`<th class="day-head">${d}</th>`).join('')}</tr>`;
  document.getElementById('tt-body').innerHTML=periods.map((p,pi)=>{
    const isBreak=(pi===breakAfter);
    const cells=tt.map(day=>{
      if(isBreak) return `<td><div class="cell-break">☕ Lunch Break</div></td>`;
      const cell=day.periods[pi];
      if(cell.subject){
        const bg=cell.color+'22', bdr=cell.color;
        return `<td><div class="cell-subject" style="background:${bg};border:1px solid ${bdr};color:${cell.color}" title="${esc(cell.teacher)} | ${esc(cell.room)}">
          ${esc(cell.subject)}<div class="cell-teacher">${esc(cell.teacher)}</div><div class="cell-room">📍 ${esc(cell.room)}</div></div></td>`;
      }
      return `<td><span class="cell-empty">—</span></td>`;
    }).join('');
    return `<tr><td class="time-col">${esc(p.time)}</td>${cells}</tr>`;
  }).join('');
}

function buildLegend(data) {
  const seen=new Map();
  data.timetable?.forEach(d=>d.periods?.forEach(c=>{ if(c.subject&&!seen.has(c.subject)) seen.set(c.subject,c.color); }));
  document.getElementById('tt-legend').innerHTML=[...seen.entries()].map(([name,color])=>`
    <div class="legend-chip"><div class="legend-dot" style="background:${color}"></div>${esc(name)}</div>`).join('');
}

// ── Analysis panel ──────────────────────────────────────────
function renderAnalysis(data) {
  const gc=data.stats?.graphColoring, ga=data.stats?.genetic;
  if(gc){
    document.getElementById('gc-nodes').textContent=gc.nodes;
    document.getElementById('gc-edges').textContent=gc.edges;
    document.getElementById('gc-colors').textContent=gc.colors;
    document.getElementById('gc-slots').textContent=(data.timetable?.length||5)*(data.timetable?.[0]?.periods?.length||7);
  }
  if(ga){
    document.getElementById('ga-gen').textContent=ga.generations;
    document.getElementById('ga-init').textContent=(ga.initialFit*100).toFixed(1)+'%';
    document.getElementById('ga-final').textContent=(ga.finalFit*100).toFixed(1)+'%';
    const imp=((ga.finalFit-ga.initialFit)*100).toFixed(1);
    document.getElementById('ga-improve').textContent=(imp>0?'+':'')+imp+'%';
    drawChart(ga.fitnessHistory||[]);
  }

  // Conflict list
  const cd=document.getElementById('conflict-list-content');
  if(data.hardConflicts===0){
    cd.innerHTML='<div class="gh-alert gh-alert-success">✅ No conflicts detected. The schedule is valid.</div>';
  } else {
    cd.innerHTML=`<div class="gh-alert gh-alert-warning">⚠️ ${data.hardConflicts} hard conflict(s) found. Increase generations to resolve them.</div>`;
  }

  // Teacher workload
  const wl={};
  data.timetable?.forEach(day=>day.periods?.forEach(cell=>{ if(cell.subject&&cell.teacher){ wl[cell.teacher]=(wl[cell.teacher]||0)+1; } }));
  const maxWL=Math.max(...Object.values(wl),1);
  document.getElementById('teacher-workload').innerHTML=Object.entries(wl).sort((a,b)=>b[1]-a[1]).map(([teacher,hours])=>`
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
      <div style="width:140px;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(teacher)}</div>
      <div style="flex:1;background:var(--color-border-muted);border-radius:3px;height:12px;overflow:hidden">
        <div style="height:100%;background:var(--color-accent-fg);width:${(hours/maxWL*100).toFixed(0)}%;transition:width 0.5s ease;border-radius:3px"></div>
      </div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--color-fg-muted);width:30px;text-align:right">${hours}h</div>
    </div>`).join('');

  document.getElementById('analysis-placeholder').style.display='none';
  document.getElementById('analysis-content').style.display='block';
}

// ── Fitness chart ───────────────────────────────────────────
function drawChart(history) {
  const canvas=document.getElementById('fitnessChart');
  const W=canvas.parentElement.offsetWidth||400, H=80;
  canvas.width=W; canvas.height=H;
  const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,W,H);
  if(!history.length) return;
  const mn=Math.min(...history), mx=Math.max(...history);
  const rng=Math.max(mx-mn,0.001);
  const tx=i=>(i/(history.length-1||1))*W;
  const ty=v=>H-((v-mn)/rng)*(H-10)-5;
  const grad=ctx.createLinearGradient(0,0,0,H);
  grad.addColorStop(0,'rgba(88,166,255,0.4)'); grad.addColorStop(1,'rgba(88,166,255,0)');
  ctx.beginPath(); ctx.moveTo(tx(0),ty(history[0]));
  history.forEach((v,i)=>ctx.lineTo(tx(i),ty(v)));
  ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.closePath(); ctx.fillStyle=grad; ctx.fill();
  ctx.beginPath(); ctx.moveTo(tx(0),ty(history[0]));
  history.forEach((v,i)=>ctx.lineTo(tx(i),ty(v)));
  ctx.strokeStyle='#58a6ff'; ctx.lineWidth=2; ctx.stroke();
}

// ── Show/hide states ────────────────────────────────────────
function showState(name) {
  document.getElementById('state-empty').style.display   =name==='empty'  ?'flex':'none';
  document.getElementById('state-loading').style.display =name==='loading'?'flex':'none';
  document.getElementById('state-result').style.display  =name==='result' ?'block':'none';
}
function showAlert(type, html) {
  const m={'success':'gh-alert-success','warning':'gh-alert-warning','error':'gh-alert-error','info':'gh-alert-info'};
  const div=document.createElement('div'); div.className='gh-alert '+(m[type]||m.info);
  div.innerHTML=html; document.getElementById('schedule-content').prepend(div);
  setTimeout(()=>div.remove(),6000);
}

// ── Exports ─────────────────────────────────────────────────
function downloadCSV() {
  const data=state.lastResult; if(!data) return;
  const days=data.timetable; const periods=days[0]?.periods||[];
  const rows=[['Time',...days.map(d=>d.dayName)].join(',')];
  periods.forEach((p,pi)=>{ rows.push([`"${p.time}"`, ...days.map(d=>{ const c=d.periods[pi]; return c.subject?`"${c.subject} (${c.teacher})"`:'"—"'; })].join(',')); });
  download(rows.join('\n'),'timetable.csv','text/csv');
}
function downloadJSON() { if(state.lastResult) download(JSON.stringify(state.lastResult,null,2),'timetable.json','application/json'); }
function download(content,filename,type) {
  const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([content],{type})); a.download=filename; a.click();
}

// ── Load test case ──────────────────────────────────────────
function loadTestCase(idx) {
  const tc=TEST_CASES[idx];
  state.subjects=[]; state.rooms=[]; state.subId=1; state.roomId=1;
  tc.subjects.forEach(s=>state.subjects.push({id:state.subId++,...s,color:COLORS[(state.subjects.length)%COLORS.length]}));
  tc.rooms.forEach(r=>state.rooms.push({id:state.roomId++,...r}));
  document.getElementById('cfg-class').value=tc.className;
  document.getElementById('cfg-days').value=tc.days;
  document.getElementById('cfg-periods').value=tc.periodsPerDay;
  renderSubjects(); renderRooms(); updateHint();
  switchMainTab('schedule'); switchSideTab('subjects');
  showAlert('info','✅ Loaded: <strong>'+tc.name+'</strong> — click Generate Timetable');
}

// ── Render test cases ───────────────────────────────────────
function renderTestCases() {
  document.getElementById('testcase-list').innerHTML=TEST_CASES.map((tc,i)=>`
    <div class="test-case-card" onclick="loadTestCase(${i})">
      <div class="test-case-title">${tc.name}</div>
      <div class="test-case-desc">${tc.desc}</div>
      <div class="test-case-meta">
        <span><strong>${tc.subjects.length}</strong> subjects</span>
        <span><strong>${tc.rooms.length}</strong> rooms</span>
        <span><strong>${tc.subjects.reduce((a,s)=>a+s.hoursPerWeek,0)}</strong> sessions</span>
        <span><strong>${tc.days}×${tc.periodsPerDay}</strong> grid</span>
      </div>
    </div>`).join('');
}

// ── Utility ─────────────────────────────────────────────────
function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ── Allow Enter key to add subject/room ─────────────────────
['sub-name','sub-teacher','sub-hours'].forEach(id=>{ const el=document.getElementById(id); if(el) el.addEventListener('keydown',e=>{ if(e.key==='Enter') addSubject(); }); });
['room-name','room-cap'].forEach(id=>{ const el=document.getElementById(id); if(el) el.addEventListener('keydown',e=>{ if(e.key==='Enter') addRoom(); }); });
['cfg-days','cfg-periods'].forEach(id=>{ const el=document.getElementById(id); if(el) el.addEventListener('change',updateHint); });

// ── Boot ─────────────────────────────────────────────────────
(function init(){
  const defaults=TEST_CASES[0];
  defaults.subjects.forEach(s=>state.subjects.push({id:state.subId++,...s,color:COLORS[state.subjects.length%COLORS.length]}));
  defaults.rooms.forEach(r=>state.rooms.push({id:state.roomId++,...r}));
  renderSubjects(); renderRooms(); renderTestCases(); updateHint();
})();
