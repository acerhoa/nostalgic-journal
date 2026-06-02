import { MONTHS, DOW } from '../lib/constants';
import { idxOf, TODAY } from '../lib/dates';
import { ChevronLeft, ChevronRight } from './icons';

interface Props {
  calY: number;
  calM: number;
  leftIndex: number;
  onMove: (delta: number) => void;
  onToday: () => void;
  onPick: (idx: number) => void;
}

export default function CalendarPanel({ calY, calM, leftIndex, onMove, onToday, onPick }: Props) {
  const first = new Date(calY, calM, 1).getDay();
  const days = new Date(calY, calM + 1, 0).getDate();
  const spread = [leftIndex, leftIndex + 1];

  const cells = [];
  for (let i = 0; i < first; i++) {
    cells.push(<div key={`b${i}`} className="cal-cell blank" />);
  }
  for (let d = 1; d <= days; d++) {
    const idx = idxOf(new Date(calY, calM, d));
    const cls = ['cal-cell'];
    if (idx === TODAY) cls.push('today');
    if (spread.includes(idx)) cls.push('sel');
    cells.push(
      <button key={`d${d}`} className={cls.join(' ')} onClick={() => onPick(idx)}>
        {d}
      </button>,
    );
  }

  return (
    <div id="cal-body">
      <div className="cal-head">
        <button className="cal-nav" aria-label="Previous month" onClick={() => onMove(-1)}>
          <ChevronLeft />
        </button>
        <span className="mlabel">{MONTHS[calM]} {calY}</span>
        <button className="cal-nav" aria-label="Next month" onClick={() => onMove(1)}>
          <ChevronRight />
        </button>
      </div>
      <div className="cal-grid">
        {DOW.map((d) => (
          <div key={d} className="dow">{d}</div>
        ))}
        {cells}
      </div>
      <button className="cal-today-btn" onClick={onToday}>Today</button>
    </div>
  );
}
