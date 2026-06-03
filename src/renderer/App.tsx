import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { flushSync } from 'react-dom';
import {
  LINE_HEIGHT_RATIO,
  THEMES,
  type Settings,
} from './lib/constants';
import {
  TODAY,
  dateOf,
  esc,
  fmtLong,
  keyOf,
  leftOfDay,
} from './lib/dates';
import {
  loadEntries,
  loadSettings,
  saveEntries,
  saveSettings,
  type Entries,
} from './lib/storage';
import { INITIAL_CALC, calcInput, type CalcState, type HistRow } from './lib/calc';
import { CalendarIcon, CalcIcon, ChevronLeft, ChevronRight, GearIcon, CloseIcon } from './components/icons';
import CalendarPanel from './components/CalendarPanel';
import SettingsPanel, { type ThemeVars } from './components/SettingsPanel';
import CalculatorPanel from './components/CalculatorPanel';

type LeftPanel = 'cal' | 'set' | null;

// How far the panels tuck under the journal when closed (px).
const PANEL_HIDE = 312;

// Minimum journal dimensions (ensures calculator never overlaps arrow button).
const MIN_PAGE_W = 392;
const MIN_PAGE_H = 520;

export default function App() {
  /* ---------- persistent + view state ---------- */
  const [entries, setEntries] = useState<Entries>(() => loadEntries());
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [leftIndex, setLeftIndex] = useState<number>(() => leftOfDay(TODAY));

  const [leftPanel, setLeftPanel] = useState<LeftPanel>(null);
  const [calcOpen, setCalcOpen] = useState(false);

  const [themeVars, setThemeVars] = useState<Record<string, ThemeVars>>({});

  const initMonth = dateOf(leftOfDay(TODAY));
  const [calY, setCalY] = useState(initMonth.getFullYear());
  const [calM, setCalM] = useState(initMonth.getMonth());

  const [calc, setCalc] = useState<CalcState>(INITIAL_CALC);
  const [history, setHistory] = useState<HistRow[]>([]);

  // Journal size state for resizing.
  const [pageW, setPageW] = useState(MIN_PAGE_W);
  const [pageH, setPageH] = useState(MIN_PAGE_H);
  const resizeRef = useRef<{ startX: number; startY: number; startW: number; startH: number; corner: string } | null>(null);

  /* ---------- refs (used by the imperative 3D page flip) ---------- */
  const leafRef = useRef<HTMLDivElement>(null);
  const leafFrontRef = useRef<HTMLDivElement>(null);
  const leafBackRef = useRef<HTMLDivElement>(null);
  const leftTextRef = useRef<HTMLTextAreaElement>(null);
  const rightTextRef = useRef<HTMLTextAreaElement>(null);
  const leftDateRef = useRef<HTMLDivElement>(null);
  const rightDateRef = useRef<HTMLDivElement>(null);

  // Mirrors for values the once-bound listeners / animation read latest-first.
  const entriesRef = useRef(entries);
  const leftIndexRef = useRef(leftIndex);
  const animatingRef = useRef(false);

  /* ---------- persistence + side effects ---------- */
  useEffect(() => {
    entriesRef.current = entries;
    saveEntries(entries);
  }, [entries]);

  useEffect(() => {
    leftIndexRef.current = leftIndex;
  }, [leftIndex]);

  useEffect(() => {
    // applySettings — theme + writing typography on the document root.
    const root = document.documentElement;
    root.dataset.theme = settings.theme;
    root.style.setProperty('--font-write', settings.font);
    root.style.setProperty('--write-size', `${settings.textSize}px`);
    root.style.setProperty('--line-h', `${Math.round(settings.textSize * LINE_HEIGHT_RATIO)}px`);
    saveSettings(settings);
  }, [settings]);

  /* ---------- probe each theme's paper/accent for the swatches ---------- */
  useEffect(() => {
    const vars: Record<string, ThemeVars> = {};
    THEMES.forEach(([id]) => {
      const probe = document.createElement('div');
      probe.setAttribute('data-theme', id);
      probe.style.display = 'none';
      document.body.appendChild(probe);
      const cs = getComputedStyle(probe);
      vars[id] = {
        paper: cs.getPropertyValue('--paper').trim(),
        accent: cs.getPropertyValue('--accent').trim(),
      };
      probe.remove();
    });
    setThemeVars(vars);
  }, []);

  /* ---------- scene scaling (disabled for transparent window) ---------- */
  // With a transparent, resizable window, we don't auto-scale the scene.

  /* ============================================================
     3D PAGE FLIP
     ============================================================ */
  // Static markup for the flipping leaf faces.
  const faceHTML = useCallback((idx: number): string => {
    const isToday = idx === TODAY;
    const txt = entriesRef.current[keyOf(idx)] || '';
    return (
      `<div class="date">${fmtLong(dateOf(idx))}${isToday ? '<span class="today-pill">Today</span>' : ''}</div>` +
      `<div class="write-wrap"><div class="sheet">${esc(txt)}</div></div>`
    );
  }, []);

  // Reveal the page underneath the turning leaf (imperative, like the original).
  const revealLivePage = useCallback((side: 'left' | 'right', idx: number) => {
    const dateEl = side === 'left' ? leftDateRef.current : rightDateRef.current;
    const ta = side === 'left' ? leftTextRef.current : rightTextRef.current;
    if (dateEl) {
      dateEl.innerHTML =
        fmtLong(dateOf(idx)) + (idx === TODAY ? '<span class="today-pill">Today</span>' : '');
    }
    if (ta) ta.value = entriesRef.current[keyOf(idx)] || '';
  }, []);

  const startSpin = useCallback((deg: number, newLeft: number) => {
    const leaf = leafRef.current;
    if (!leaf) return;
    leaf.style.transition = 'none';
    leaf.style.transform = 'rotateY(0deg)';
    void leaf.offsetWidth; // reflow so the spin animates from 0
    leaf.style.transition = '';

    const done = (e?: TransitionEvent) => {
      if (e && e.propertyName !== 'transform') return;
      leaf.removeEventListener('transitionend', done);
      // Commit synchronously so React repaints the pages before we hide the
      // leaf — avoids a one-frame flash of the previous spread.
      flushSync(() => {
        leftIndexRef.current = newLeft;
        setLeftIndex(newLeft);
      });
      leaf.className = 'flip-leaf';
      leaf.style.transition = 'none';
      leaf.style.transform = '';
      animatingRef.current = false;
    };

    leaf.addEventListener('transitionend', done);
    requestAnimationFrame(() => {
      leaf.style.transform = `rotateY(${deg}deg)`;
    });
  }, []);

  const flip = useCallback((dir: number) => {
    if (animatingRef.current) return;
    const leaf = leafRef.current;
    const front = leafFrontRef.current;
    const back = leafBackRef.current;
    if (!leaf || !front || !back) return;
    animatingRef.current = true;

    const li = leftIndexRef.current;
    if (dir > 0) {
      // NEXT — the right leaf turns to the left.
      const curRight = li + 1;
      const newLeft = li + 2;
      const newRight = li + 3;
      front.innerHTML = faceHTML(curRight);
      back.innerHTML = faceHTML(newLeft);
      leaf.className = 'flip-leaf active --next';
      revealLivePage('right', newRight);
      startSpin(-180, newLeft);
    } else {
      // PREV — the left leaf turns to the right.
      const curLeft = li;
      const newRight = li - 1;
      const newLeft = li - 2;
      front.innerHTML = faceHTML(curLeft);
      back.innerHTML = faceHTML(newRight);
      leaf.className = 'flip-leaf active --prev';
      revealLivePage('left', newLeft);
      startSpin(180, newLeft);
    }
  }, [faceHTML, revealLivePage, startSpin]);

  // Navigate without animation (calendar / today).
  const goToDay = useCallback((idx: number) => {
    const li = leftOfDay(idx);
    leftIndexRef.current = li;
    setLeftIndex(li);
  }, []);

  /* ---------- keyboard navigation ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') flip(-1);
      if (e.key === 'ArrowRight') flip(1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [flip]);

  /* ---------- entry editing ---------- */
  const updateEntry = (idx: number, value: string) => {
    setEntries((prev) => {
      const next = { ...prev };
      const k = keyOf(idx);
      if (value) next[k] = value;
      else delete next[k];
      return next;
    });
  };

  /* ---------- panels ---------- */
  const toggleLeftPanel = (name: Exclude<LeftPanel, null>) => {
    setLeftPanel((cur) => (cur === name ? null : name));
  };

  /* ---------- calendar controls ---------- */
  const moveMonth = (delta: number) => {
    let m = calM + delta;
    let y = calY;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setCalM(m);
    setCalY(y);
  };
  const calToday = () => {
    const d = dateOf(TODAY);
    setCalY(d.getFullYear());
    setCalM(d.getMonth());
    goToDay(TODAY);
  };

  /* ---------- calculator controls ---------- */
  const onCalcKey = (token: string) => {
    const r = calcInput(calc, history, token);
    setCalc(r.state);
    setHistory(r.history);
  };
  const onPickHist = (i: number) => {
    setCalc({ acc: null, op: null, cur: history[i].res, fresh: true });
  };

  /* ---------- window controls ---------- */
  const handleClose = () => {
    window.api.closeWindow();
  };

  /* ---------- corner resize ---------- */
  const startResize = async (e: ReactMouseEvent, corner: string) => {
    e.preventDefault();
    const winSize = await window.api.getWindowSize();
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startW: pageW,
      startH: pageH,
      corner,
    };
    const startWinW = winSize.width;
    const startWinH = winSize.height;

    const onMove = (ev: globalThis.MouseEvent) => {
      if (!resizeRef.current) return;
      const { startX, startY, startW, startH, corner: c } = resizeRef.current;
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;

      let newW = startW;
      let newH = startH + dy;

      if (c === 'bl') {
        newW = startW - dx;
      } else {
        newW = startW + dx;
      }

      newW = Math.max(MIN_PAGE_W, newW);
      newH = Math.max(MIN_PAGE_H, newH);

      const deltaW = (newW - startW) * 2; // journal width change (2 pages)
      const deltaH = newH - startH;

      setPageW(newW);
      setPageH(newH);

      // Update window size proportionally to the journal size change.
      const windowW = startWinW + deltaW;
      const windowH = startWinH + deltaH;
      window.api.setWindowSize(Math.max(900, windowW), Math.max(600, windowH));
    };

    const onUp = () => {
      resizeRef.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  /* ---------- derived render values ---------- */
  const rightIndex = leftIndex + 1;
  const calOpen = leftPanel === 'cal';
  const setOpen = leftPanel === 'set';

  const leftPanelStyle = (open: boolean) => ({
    transform: open ? 'translateX(0px)' : `translateX(${PANEL_HIDE}px)`,
  });
  const rightPanelStyle = (open: boolean) => ({
    transform: open ? 'translateX(0px)' : `translateX(${-PANEL_HIDE}px)`,
  });

  // Dynamic styles based on journal size.
  const journalStyle = {
    '--page-w': `${pageW}px`,
    '--page-h': `${pageH}px`,
  } as React.CSSProperties;

  return (
    <div className="viewport">
      <div className="scene" id="scene" style={journalStyle}>
        {/* bookmark tab (draggable for window movement) */}
        <div className="tab drag-region">
          {settings.journalTitle || 'My Journal'}
        </div>

        {/* CONTROLS — X/Calendar/Gear to right of header, Calculator to left */}
        <div className="controls-right">
          <button
            className="btn square"
            id="btn-close"
            aria-label="Close"
            onClick={handleClose}
          >
            <CloseIcon />
          </button>
          <button
            className={`btn square${calOpen ? ' is-on' : ''}`}
            id="btn-cal"
            aria-label="Calendar"
            onClick={() => toggleLeftPanel('cal')}
          >
            <CalendarIcon />
          </button>
          <button
            className={`btn square${setOpen ? ' is-on' : ''}`}
            id="btn-set"
            aria-label="Settings"
            onClick={() => toggleLeftPanel('set')}
          >
            <GearIcon />
          </button>
        </div>

        <div className="controls-left">
          <button
            className={`btn square${calcOpen ? ' is-on' : ''}`}
            id="btn-calc"
            aria-label="Calculator"
            onClick={() => setCalcOpen((v) => !v)}
          >
            <CalcIcon />
          </button>
        </div>

        {/* THE JOURNAL (fixed centre) */}
        <div className="journal" id="journal">
          <div className="page left-page" data-screen-label="Left page">
            <div className="date" id="leftDate" ref={leftDateRef}>
              {fmtLong(dateOf(leftIndex))}
              {leftIndex === TODAY && <span className="today-pill">Today</span>}
            </div>
            <div className="write-wrap">
              <textarea
                className="sheet"
                id="leftText"
                ref={leftTextRef}
                spellCheck={false}
                value={entries[keyOf(leftIndex)] || ''}
                onChange={(e) => updateEntry(leftIndex, e.target.value)}
              />
            </div>
          </div>

          <div className="page right-page" data-screen-label="Right page">
            <div className="date" id="rightDate" ref={rightDateRef}>
              {fmtLong(dateOf(rightIndex))}
              {rightIndex === TODAY && <span className="today-pill">Today</span>}
            </div>
            <div className="write-wrap">
              <textarea
                className="sheet"
                id="rightText"
                ref={rightTextRef}
                spellCheck={false}
                value={entries[keyOf(rightIndex)] || ''}
                onChange={(e) => updateEntry(rightIndex, e.target.value)}
              />
            </div>
          </div>

          {/* flipping leaf */}
          <div className="flip-leaf" id="leaf" ref={leafRef}>
            <div className="face front page" id="leafFront" ref={leafFrontRef} />
            <div className="face back page" id="leafBack" ref={leafBackRef} />
            <div className="shade" />
          </div>

          {/* resize handles */}
          <div
            className="resize-handle resize-bl"
            onMouseDown={(e) => startResize(e, 'bl')}
          />
          <div
            className="resize-handle resize-br"
            onMouseDown={(e) => startResize(e, 'br')}
          />
        </div>

        {/* Navigation arrows */}
        <button className="btn round" id="btn-prev" aria-label="Previous page" onClick={() => flip(-1)}>
          <ChevronLeft />
        </button>
        <button className="btn round" id="btn-next" aria-label="Next page" onClick={() => flip(1)}>
          <ChevronRight />
        </button>

        {/* PANELS */}
        <div
          className={`panel left${calOpen ? ' open' : ''}`}
          id="panel-cal"
          style={leftPanelStyle(calOpen)}
        >
          <CalendarPanel
            calY={calY}
            calM={calM}
            leftIndex={leftIndex}
            onMove={moveMonth}
            onToday={calToday}
            onPick={goToDay}
          />
        </div>

        <div
          className={`panel left${setOpen ? ' open' : ''}`}
          id="panel-set"
          style={leftPanelStyle(setOpen)}
        >
          <SettingsPanel
            settings={settings}
            themeVars={themeVars}
            onTheme={(theme) => setSettings((s) => ({ ...s, theme }))}
            onTextSize={(textSize) => setSettings((s) => ({ ...s, textSize }))}
            onFont={(font) => setSettings((s) => ({ ...s, font }))}
            onTitle={(journalTitle) => setSettings((s) => ({ ...s, journalTitle }))}
          />
        </div>

        <div
          className={`panel right${calcOpen ? ' open' : ''}`}
          id="panel-calc"
          style={rightPanelStyle(calcOpen)}
        >
          <CalculatorPanel
            calc={calc}
            history={history}
            onKey={onCalcKey}
            onPickHist={onPickHist}
          />
        </div>
      </div>
    </div>
  );
}
