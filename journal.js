/* ============================================================
   Nostalgic Journal — app logic
   ============================================================ */
(() => {
  'use strict';

  /* ---------- date model ---------- */
  const BASE = new Date(2026, 0, 1);                 // day index 0 = Jan 1, 2026
  const DAY = 86400000;
  const midnight = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const idxOf  = d => Math.round((midnight(d) - BASE) / DAY);
  const dateOf = i => new Date(BASE.getFullYear(), BASE.getMonth(), BASE.getDate() + i);
  const keyOf  = i => { const d = dateOf(i); return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`; };
  const fmtLong = d => d.toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' });
  const TODAY = idxOf(new Date());

  /* spread pairing: left page is always the even-parity day of a pair */
  const leftOfDay = i => i - (((i % 2) + 2) % 2);

  /* ---------- persistence (entries + settings persist; calc does NOT) ---------- */
  const LS_ENTRIES = 'nj-entries-v1';
  const LS_SETTINGS = 'nj-settings-v1';
  let entries = {};
  try { entries = JSON.parse(localStorage.getItem(LS_ENTRIES)) || {}; } catch(e){ entries = {}; }
  const saveEntries = () => { try { localStorage.setItem(LS_ENTRIES, JSON.stringify(entries)); } catch(e){} };

  let settings = { theme:'cream', font:"'Lora', Georgia, serif", size:'m' };
  try { Object.assign(settings, JSON.parse(localStorage.getItem(LS_SETTINGS)) || {}); } catch(e){}
  const saveSettings = () => { try { localStorage.setItem(LS_SETTINGS, JSON.stringify(settings)); } catch(e){} };

  /* ---------- state ---------- */
  let leftIndex = leftOfDay(TODAY);
  let animating = false;
  let leftPanel = null;        // 'cal' | 'set' | null  (mutually exclusive)
  let calcOpen = false;        // independent
  const esc = s => s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  /* ---------- el refs ---------- */
  const $ = id => document.getElementById(id);
  const leftDate=$('leftDate'), rightDate=$('rightDate'),
        leftText=$('leftText'), rightText=$('rightText'),
        leaf=$('leaf'), leafFront=$('leafFront'), leafBack=$('leafBack');

  /* ---------- live pages ---------- */
  function setDateEl(el, idx){
    const isToday = idx === TODAY;
    el.innerHTML = fmtLong(dateOf(idx)) + (isToday ? '<span class="today-pill">Today</span>' : '');
  }
  function setLivePage(side, idx){
    if (side === 'left'){
      leftDate.dataset.idx = idx; setDateEl(leftDate, idx);
      leftText.value = entries[keyOf(idx)] || ''; leftText.dataset.idx = idx;
    } else {
      rightDate.dataset.idx = idx; setDateEl(rightDate, idx);
      rightText.value = entries[keyOf(idx)] || ''; rightText.dataset.idx = idx;
    }
  }
  function renderPages(){
    setLivePage('left', leftIndex);
    setLivePage('right', leftIndex + 1);
  }

  /* static markup used on the flipping leaf faces */
  function faceHTML(idx, placeholder){
    const isToday = idx === TODAY;
    const txt = entries[keyOf(idx)] || '';
    return `<div class="date">${fmtLong(dateOf(idx))}${isToday?'<span class="today-pill">Today</span>':''}</div>
            <div class="write-wrap"><div class="sheet">${esc(txt)}</div></div>`;
  }

  /* save on type */
  function bindType(ta){
    ta.addEventListener('input', () => {
      const k = keyOf(+ta.dataset.idx);
      if (ta.value) entries[k] = ta.value; else delete entries[k];
      saveEntries();
    });
  }
  bindType(leftText); bindType(rightText);

  /* ---------- 3D page flip ---------- */
  function flip(dir){
    if (animating) return;
    animating = true;

    if (dir > 0){                          // NEXT — right leaf turns to the left
      const curRight = leftIndex + 1, newLeft = leftIndex + 2, newRight = leftIndex + 3;
      leafFront.innerHTML = faceHTML(curRight);
      leafBack.innerHTML  = faceHTML(newLeft);
      leaf.className = 'flip-leaf active --next';
      setLivePage('right', newRight);      // reveal the page underneath
      startSpin(-180, () => { leftIndex = newLeft; });
    } else {                               // PREV — left leaf turns to the right
      const curLeft = leftIndex, newRight = leftIndex - 1, newLeft = leftIndex - 2;
      leafFront.innerHTML = faceHTML(curLeft);
      leafBack.innerHTML  = faceHTML(newRight);
      leaf.className = 'flip-leaf active --prev';
      setLivePage('left', newLeft);
      startSpin(180, () => { leftIndex = newLeft; });
    }
  }
  function startSpin(deg, commit){
    leaf.style.transition = 'none';
    leaf.style.transform  = 'rotateY(0deg)';
    void leaf.offsetWidth;                 // reflow so the spin animates from 0
    leaf.style.transition = '';
    const done = (e) => {
      if (e && e.propertyName !== 'transform') return;
      leaf.removeEventListener('transitionend', done);
      commit();
      renderPages();
      leaf.className = 'flip-leaf';
      leaf.style.transition = 'none';
      leaf.style.transform = '';
      animating = false;
      syncCal();
    };
    leaf.addEventListener('transitionend', done);
    requestAnimationFrame(() => { leaf.style.transform = `rotateY(${deg}deg)`; });
  }

  /* navigate without animation (calendar / today) */
  function goToDay(idx){
    leftIndex = leftOfDay(idx);
    renderPages();
    syncCal();
  }

  /* ============================================================
     PANELS
     ============================================================ */
  const panels = { cal:$('panel-cal'), set:$('panel-set'), calc:$('panel-calc') };
  const btns   = { cal:$('btn-cal'), set:$('btn-set'), calc:$('btn-calc') };
  const CLOSED = { 'panel-cal':'translateX(312px)', 'panel-set':'translateX(312px)', 'panel-calc':'translateX(-312px)' };
  const setPanelOpen = (p, open) => { p.style.transform = open ? 'translateX(0px)' : CLOSED[p.id]; };

  function setLeftPanel(name){
    // toggle off if same
    const target = (leftPanel === name) ? null : name;
    leftPanel = target;
    ['cal','set'].forEach(n => {
      const isOpen = leftPanel === n;
      setPanelOpen(panels[n], isOpen);
      panels[n].classList.toggle('open', isOpen);
      btns[n].classList.toggle('is-on', isOpen);
    });
    if (leftPanel === 'cal') renderCal();
  }
  function toggleCalc(){
    calcOpen = !calcOpen;
    setPanelOpen(panels.calc, calcOpen);
    panels.calc.classList.toggle('open', calcOpen);
    btns.calc.classList.toggle('is-on', calcOpen);
  }

  /* ============================================================
     CALENDAR
     ============================================================ */
  let calY, calM;   // displayed month
  (function initCalMonth(){ const d = dateOf(leftIndex); calY = d.getFullYear(); calM = d.getMonth(); })();
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DOW = ['Su','Mo','Tu','We','Th','Fr','Sa'];

  function renderCal(){
    const host = $('cal-body');
    const first = new Date(calY, calM, 1).getDay();
    const days  = new Date(calY, calM + 1, 0).getDate();
    const spread = [leftIndex, leftIndex + 1];
    let html = `<div class="cal-head">
      <button class="cal-nav" data-mv="-1" aria-label="Previous month">${SVG.chevL}</button>
      <span class="mlabel">${MONTHS[calM]} ${calY}</span>
      <button class="cal-nav" data-mv="1" aria-label="Next month">${SVG.chevR}</button>
    </div><div class="cal-grid">`;
    DOW.forEach(d => html += `<div class="dow">${d}</div>`);
    for (let i=0;i<first;i++) html += `<div class="cal-cell blank"></div>`;
    for (let d=1; d<=days; d++){
      const idx = idxOf(new Date(calY, calM, d));
      const cls = ['cal-cell'];
      if (idx === TODAY) cls.push('today');
      if (spread.includes(idx)) cls.push('sel');
      html += `<button class="${cls.join(' ')}" data-idx="${idx}">${d}</button>`;
    }
    html += `</div><button class="cal-today-btn" id="cal-today">Today</button>`;
    host.innerHTML = html;
  }
  function syncCal(){ if (leftPanel === 'cal') renderCal(); }

  $('cal-body').addEventListener('click', e => {
    const mv = e.target.closest('[data-mv]');
    if (mv){ calM += +mv.dataset.mv; if (calM<0){calM=11;calY--;} if (calM>11){calM=0;calY++;} renderCal(); return; }
    if (e.target.id === 'cal-today'){ const d=dateOf(TODAY); calY=d.getFullYear(); calM=d.getMonth(); goToDay(TODAY); renderCal(); return; }
    const cell = e.target.closest('[data-idx]');
    if (cell){ goToDay(+cell.dataset.idx); }
  });

  /* ============================================================
     SETTINGS
     ============================================================ */
  const THEMES = [
    ['cream','Cream & Cocoa'], ['terracotta','Terracotta'], ['honey','Honey & Walnut'],
    ['slate','Slate & Mist'], ['ocean','Ocean & Pearl'], ['sage','Sage & Moss'],
    ['forest','Forest & Linen'], ['midnight','Midnight'], ['espresso','Espresso'], ['plum','Plum Dusk']
  ];
  const FONTS = [
    ["'Lora', Georgia, serif",'Lora — classic serif'],
    ["'Caveat', cursive",'Caveat — handwritten'],
    ["'Special Elite', monospace",'Special Elite — typewriter'],
    ["'Quicksand', sans-serif",'Quicksand — rounded'],
    ["'Nunito', sans-serif",'Nunito — clean sans']
  ];
  const SIZES = { s:['15px','26px'], m:['17px','30px'], l:['20px','34px'] };

  function applySettings(){
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.style.setProperty('--font-write', settings.font);
    const [fs, lh] = SIZES[settings.size];
    document.documentElement.style.setProperty('--write-size', fs);
    document.documentElement.style.setProperty('--line-h', lh);
  }
  function buildSettings(){
    // theme swatches — each swatch previews paper (top) + accent (bottom)
    const sw = $('set-swatches');
    sw.innerHTML = THEMES.map(([id,name]) =>
      `<button class="swatch" data-theme="${id}" title="${name}" style="${swatchStyle(id)}"><span></span></button>`
    ).join('');
    syncSettingsUI();
  }
  // peek each theme's paper & accent without switching the page theme: temp element
  const TVARS = {};
  function readThemeVars(){
    THEMES.forEach(([id]) => {
      const probe = document.createElement('div');
      probe.setAttribute('data-theme', id); probe.style.display='none';
      document.body.appendChild(probe);
      const cs = getComputedStyle(probe);
      TVARS[id] = { paper: cs.getPropertyValue('--paper').trim(), accent: cs.getPropertyValue('--accent').trim() };
      probe.remove();
    });
  }
  const swatchStyle = id => TVARS[id] ? `background:${TVARS[id].paper}` : '';
  function paintSwatchBars(){
    document.querySelectorAll('.swatch').forEach(b => {
      const id = b.dataset.theme; if (TVARS[id]) b.querySelector('span').style.background = TVARS[id].accent;
    });
  }
  function syncSettingsUI(){
    document.querySelectorAll('.swatch').forEach(b => b.classList.toggle('sel', b.dataset.theme === settings.theme));
    document.querySelectorAll('#set-size .seg button').forEach(b => b.classList.toggle('sel', b.dataset.size === settings.size));
    document.querySelectorAll('#set-fonts .font-opt').forEach(b => b.classList.toggle('sel', b.dataset.font === settings.font));
  }

  $('set-swatches').addEventListener('click', e => {
    const b = e.target.closest('.swatch'); if (!b) return;
    settings.theme = b.dataset.theme; applySettings(); saveSettings(); syncSettingsUI();
  });
  $('set-size').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    settings.size = b.dataset.size; applySettings(); saveSettings(); syncSettingsUI();
  });
  $('set-fonts').addEventListener('click', e => {
    const b = e.target.closest('.font-opt'); if (!b) return;
    settings.font = b.dataset.font; applySettings(); saveSettings(); syncSettingsUI();
  });

  function fillFontList(){
    $('set-fonts').innerHTML = FONTS.map(([f,label]) =>
      `<button class="font-opt" data-font="${f.replace(/"/g,'&quot;')}" style="font-family:${f}">${label}</button>`
    ).join('');
  }

  /* ============================================================
     CALCULATOR  (history is session-only — never persisted)
     ============================================================ */
  const calc = { acc:null, op:null, cur:'0', fresh:true };
  const history = [];   // lives only while the page is open
  const SYM = { add:'+', sub:'−', mul:'×', div:'÷' };
  const fmtNum = n => {
    if (!isFinite(n)) return 'Error';
    let s = Number(parseFloat(n.toPrecision(12))).toString();
    return s;
  };
  function calcDisplay(){
    $('calc-val').textContent = calc.cur;
    $('calc-expr').textContent = calc.op ? `${fmtNum(calc.acc)} ${SYM[calc.op]}` : '';
  }
  function renderHistory(){
    const h = $('calc-hist');
    if (!history.length){ h.innerHTML = '<div class="empty">No calculations yet</div>'; return; }
    h.innerHTML = history.slice(0,8).map((r,i) =>
      `<div class="hrow" data-h="${i}"><span>${r.expr}</span><b>${r.res}</b></div>`).join('');
  }
  function apply(a, op, b){
    switch(op){ case 'add': return a+b; case 'sub': return a-b; case 'mul': return a*b; case 'div': return b===0?NaN:a/b; }
  }
  function pushHist(expr, res){ history.unshift({ expr, res }); renderHistory(); }

  function calcInput(t){
    if (/\d/.test(t)){ calc.cur = calc.fresh ? t : (calc.cur==='0' ? t : calc.cur + t); calc.fresh=false; }
    else if (t==='.'){ if (calc.fresh){ calc.cur='0.'; calc.fresh=false; } else if(!calc.cur.includes('.')) calc.cur+='.'; }
    else if (t==='C'){ calc.acc=null; calc.op=null; calc.cur='0'; calc.fresh=true; }
    else if (t==='=' ){
      if (calc.op!=null && !calc.fresh){
        const a=calc.acc, b=parseFloat(calc.cur), r=apply(a,calc.op,b);
        pushHist(`${fmtNum(a)} ${SYM[calc.op]} ${fmtNum(b)}`, fmtNum(r));
        calc.cur=fmtNum(r); calc.acc=null; calc.op=null; calc.fresh=true;
      }
    }
    else { // operator
      if (calc.op!=null && !calc.fresh){
        const a=calc.acc, b=parseFloat(calc.cur), r=apply(a,calc.op,b);
        pushHist(`${fmtNum(a)} ${SYM[calc.op]} ${fmtNum(b)}`, fmtNum(r));
        calc.acc=r; calc.cur=fmtNum(r);
      } else {
        calc.acc=parseFloat(calc.cur);
      }
      calc.op=t; calc.fresh=true;
    }
    calcDisplay();
  }
  function buildCalc(){
    const keys = [
      ['C','clear'],['div','op','÷'],['mul','op','×'],
      ['7'],['8'],['9'],['sub','op','−'],
      ['4'],['5'],['6'],['add','op','+'],
      ['1'],['2'],['3'],['=','eq'],
      ['0','zero'],['.']
    ];
    $('calc-keys').innerHTML = keys.map(k=>{
      const val=k[0], extra=k[1]||'', label=k[2]||val;
      const cls = ['ckey']; if(extra) cls.push(extra);
      const data = (extra==='op') ? val : (val==='C'?'C':(val==='='?'=':val));
      return `<button class="${cls.join(' ')}" data-k="${data}">${label}</button>`;
    }).join('');
  }
  $('calc-keys').addEventListener('click', e => { const b=e.target.closest('.ckey'); if(b) calcInput(b.dataset.k); });
  $('calc-hist').addEventListener('click', e => {
    const r=e.target.closest('[data-h]'); if(!r) return;
    calc.cur = history[+r.dataset.h].res; calc.fresh=true; calc.acc=null; calc.op=null; calcDisplay();
  });

  /* ============================================================
     ICONS
     ============================================================ */
  const SVG = {
    chevL:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
    chevR:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
    cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="16" rx="2.4"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="2.5" x2="8" y2="6"/><line x1="16" y1="2.5" x2="16" y2="6"/></svg>',
    gear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    calc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2.5" width="14" height="19" rx="2.2"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8.5" y1="11.5" x2="8.5" y2="11.5"/><line x1="12" y1="11.5" x2="12" y2="11.5"/><line x1="15.5" y1="11.5" x2="15.5" y2="11.5"/><line x1="8.5" y1="15" x2="8.5" y2="15"/><line x1="12" y1="15" x2="12" y2="15"/><line x1="15.5" y1="15" x2="15.5" y2="15"/><line x1="8.5" y1="18.3" x2="8.5" y2="18.3"/><line x1="12" y1="18.3" x2="12" y2="18.3"/><line x1="15.5" y1="18.3" x2="15.5" y2="18.3"/></svg>'
  };

  /* ---------- wire controls ---------- */
  function paintIcons(){
    btns.cal.innerHTML = SVG.cal; btns.set.innerHTML = SVG.gear; btns.calc.innerHTML = SVG.calc;
    $('btn-prev').innerHTML = SVG.chevL; $('btn-next').innerHTML = SVG.chevR;
  }
  $('btn-prev').addEventListener('click', () => flip(-1));
  $('btn-next').addEventListener('click', () => flip(1));
  btns.cal.addEventListener('click', () => setLeftPanel('cal'));
  btns.set.addEventListener('click', () => setLeftPanel('set'));
  btns.calc.addEventListener('click', toggleCalc);

  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowLeft') flip(-1);
    if (e.key === 'ArrowRight') flip(1);
  });

  /* ---------- scaling ---------- */
  const scene = $('scene');
  function fit(){
    const s = Math.min(window.innerWidth/1440, window.innerHeight/780, 1.15);
    scene.style.transform = `translate(-50%,-50%) scale(${s})`;
  }
  window.addEventListener('resize', fit);

  /* ---------- init ---------- */
  function init(){
    paintIcons();
    applySettings();
    readThemeVars();
    buildSettings(); paintSwatchBars();
    fillFontList(); syncSettingsUI();
    buildCalc(); calcDisplay(); renderHistory();
    renderPages();
    fit();
  }
  init();
})();
