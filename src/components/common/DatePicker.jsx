import { useEffect, useRef, useState } from "react";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function toISODate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function parseISODate(s) {
  if (!s) return null;
  const [y,m,d] = s.split("-").map(Number);
  return new Date(y, m-1, d);
}
function formatDisplay(d) {
  if (!d) return "";
  return `${d.toLocaleDateString(undefined,{weekday:"short"})}, ${d.getDate()} ${MONTHS[d.getMonth()].slice(0,3)} ${d.getFullYear()}`;
}
function isSameDay(a,b) {
  return a && b && a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}

export default function DatePicker({ value, onChange, min, placeholder = "Select date" }) {
  const [open, setOpen] = useState(false);
  const selected = parseISODate(value);
  const minDate = parseISODate(min);
  const [viewDate, setViewDate] = useState(selected || new Date());
  const wrapRef = useRef(null);

  useEffect(() => {
    if (selected) setViewDate(selected);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDocClick); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const changeMonth = (delta) => setViewDate(new Date(year, month + delta, 1));

  const pick = (day) => {
    if (!day) return;
    if (minDate && day < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())) return;
    onChange(toISODate(day));
    setOpen(false);
  };

  return (
    <div className="dtpicker" ref={wrapRef}>
      <button type="button" className="dtpicker-trigger" onClick={() => setOpen(o => !o)}>
        <span className="dtpicker-icon">📅</span>
        <span className={selected ? "" : "dtpicker-placeholder"}>{selected ? formatDisplay(selected) : placeholder}</span>
      </button>
      {open && (
        <div className="dtpicker-panel">
          <div className="dtpicker-header">
            <button type="button" className="dtpicker-nav" onClick={() => changeMonth(-1)}>‹</button>
            <span className="dtpicker-title">{MONTHS[month]} {year}</span>
            <button type="button" className="dtpicker-nav" onClick={() => changeMonth(1)}>›</button>
          </div>
          <div className="dtpicker-weekdays">
            {WEEKDAYS.map((w, i) => <span key={i}>{w}</span>)}
          </div>
          <div className="dtpicker-grid">
            {cells.map((day, i) => {
              if (!day) return <span key={i} className="dtpicker-cell empty" />;
              const disabled = minDate && day < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
              const isSelected = isSameDay(day, selected);
              const isToday = isSameDay(day, today);
              return (
                <button
                  type="button"
                  key={i}
                  className={`dtpicker-cell${isSelected?" selected":""}${isToday && !isSelected?" today":""}`}
                  disabled={disabled}
                  onClick={() => pick(day)}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
