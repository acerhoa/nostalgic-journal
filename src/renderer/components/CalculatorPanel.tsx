import { CALC_KEYS, SYM, fmtNum, type CalcState, type HistRow } from '../lib/calc';

interface Props {
  calc: CalcState;
  history: HistRow[];
  onKey: (token: string) => void;
  onPickHist: (index: number) => void;
}

export default function CalculatorPanel({ calc, history, onKey, onPickHist }: Props) {
  const expr = calc.op ? `${fmtNum(calc.acc as number)} ${SYM[calc.op]}` : '';

  return (
    <>
      <div className="calc-display">
        <div className="calc-expr" id="calc-expr">{expr}</div>
        <div className="calc-val" id="calc-val">{calc.cur}</div>
      </div>

      <div className="calc-keys" id="calc-keys">
        {CALC_KEYS.map(([val, extra, label]) => {
          const cls = ['ckey'];
          if (extra) cls.push(extra);
          const token = extra === 'op' ? val : val;
          return (
            <button key={val} className={cls.join(' ')} onClick={() => onKey(token)}>
              {label ?? val}
            </button>
          );
        })}
      </div>

      <div className="calc-hist" id="calc-hist">
        {history.length === 0 ? (
          <div className="empty">No calculations yet</div>
        ) : (
          history.slice(0, 8).map((r, i) => (
            <div key={i} className="hrow" onClick={() => onPickHist(i)}>
              <span>{r.expr}</span>
              <b>{r.res}</b>
            </div>
          ))
        )}
      </div>
    </>
  );
}
