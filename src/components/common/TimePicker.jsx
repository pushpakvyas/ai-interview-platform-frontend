import { useEffect, useRef, useState } from "react";

function formatDisplay(hhmm) {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2,"0")}:${String(m).padStart(2,"0")} ${period}`;
}

// 15-minute increments across the full day, e.g. "00:00", "00:15", ... "23:45"
const OPTIONS = Array.from({ length: 24 * 4 }, (_, i) => {
  const h = Math.floor(i / 4);
  const m = (i % 4) * 15;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
});

export default function TimePicker({ value, onChange, placeholder = "Select time" }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const listRef = useRef(null);
  const activeRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    // Scroll the current selection into view when the panel opens.
    requestAnimationFrame(() => activeRef.current?.scrollIntoView({ block: "center" }));
    return () => { document.removeEventListener("mousedown", onDocClick); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const pick = (t) => {
    onChange(t);
    setOpen(false);
  };

  return (
    <div className="dtpicker" ref={wrapRef}>
      <button type="button" className="dtpicker-trigger" onClick={() => setOpen(o => !o)}>
        <span className="dtpicker-icon">🕒</span>
        <span className={value ? "" : "dtpicker-placeholder"}>{value ? formatDisplay(value) : placeholder}</span>
      </button>
      {open && (
        <div className="dtpicker-panel dtpicker-panel-time">
          <div className="dtpicker-timelist" ref={listRef}>
            {OPTIONS.map((t) => (
              <button
                type="button"
                key={t}
                ref={t === value ? activeRef : null}
                className={`dtpicker-time-option${t === value ? " selected" : ""}`}
                onClick={() => pick(t)}
              >
                {formatDisplay(t)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
