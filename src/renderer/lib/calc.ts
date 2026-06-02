/* ============================================================
   CALCULATOR  (history is session-only — never persisted)
   ============================================================ */
export interface CalcState {
  acc: number | null;
  op: string | null;
  cur: string;
  fresh: boolean;
}

export interface HistRow {
  expr: string;
  res: string;
}

export const SYM: Record<string, string> = { add: '+', sub: '−', mul: '×', div: '÷' };

export const INITIAL_CALC: CalcState = { acc: null, op: null, cur: '0', fresh: true };

export const fmtNum = (n: number): string => {
  if (!isFinite(n)) return 'Error';
  return Number(parseFloat(n.toPrecision(12))).toString();
};

function apply(a: number, op: string, b: number): number {
  switch (op) {
    case 'add': return a + b;
    case 'sub': return a - b;
    case 'mul': return a * b;
    case 'div': return b === 0 ? NaN : a / b;
    default: return NaN;
  }
}

/**
 * Pure reducer mirroring the original imperative calculator. Returns the next
 * calculator state plus the (possibly extended) history list.
 */
export function calcInput(
  state: CalcState,
  history: HistRow[],
  t: string,
): { state: CalcState; history: HistRow[] } {
  const c: CalcState = { ...state };
  let hist = history;

  if (/\d/.test(t)) {
    c.cur = c.fresh ? t : c.cur === '0' ? t : c.cur + t;
    c.fresh = false;
  } else if (t === '.') {
    if (c.fresh) { c.cur = '0.'; c.fresh = false; }
    else if (!c.cur.includes('.')) c.cur += '.';
  } else if (t === 'C') {
    c.acc = null; c.op = null; c.cur = '0'; c.fresh = true;
  } else if (t === '=') {
    if (c.op != null && !c.fresh) {
      const a = c.acc as number;
      const b = parseFloat(c.cur);
      const r = apply(a, c.op, b);
      hist = [{ expr: `${fmtNum(a)} ${SYM[c.op]} ${fmtNum(b)}`, res: fmtNum(r) }, ...history];
      c.cur = fmtNum(r); c.acc = null; c.op = null; c.fresh = true;
    }
  } else {
    // operator
    if (c.op != null && !c.fresh) {
      const a = c.acc as number;
      const b = parseFloat(c.cur);
      const r = apply(a, c.op, b);
      hist = [{ expr: `${fmtNum(a)} ${SYM[c.op]} ${fmtNum(b)}`, res: fmtNum(r) }, ...history];
      c.acc = r; c.cur = fmtNum(r);
    } else {
      c.acc = parseFloat(c.cur);
    }
    c.op = t; c.fresh = true;
  }

  return { state: c, history: hist };
}

// Key layout: [token, modifier-class, label?]
export const CALC_KEYS: ReadonlyArray<[string, string?, string?]> = [
  ['C', 'clear'], ['div', 'op', '÷'], ['mul', 'op', '×'],
  ['7'], ['8'], ['9'], ['sub', 'op', '−'],
  ['4'], ['5'], ['6'], ['add', 'op', '+'],
  ['1'], ['2'], ['3'], ['=', 'eq'],
  ['0', 'zero'], ['.'],
];
