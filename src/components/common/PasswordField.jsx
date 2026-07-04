import { useState } from "react";
import { PASSWORD_REQUIREMENTS } from "../../utils/validation.js";

export default function PasswordField({
  label = "Password",
  value,
  onChange,
  placeholder = "••••••••",
  autoComplete = "new-password",
  showRequirements = true,
}) {
  const [touched, setTouched] = useState(false);
  const [visible, setVisible] = useState(false);

  return (
    <div className="input-group">
      <label>{label}</label>
      <div className="password-input-wrap">
        <input
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setTouched(true)}
          required
        />
        <button
          type="button"
          className="password-toggle-btn"
          onClick={() => setVisible((v) => !v)}
          tabIndex={-1}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          title={visible ? "Hide password" : "Show password"}
        >
          {visible ? (
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 3l18 18" />
              <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
              <path d="M9.88 5.09A9.77 9.77 0 0 1 12 5c6.5 0 10 7 10 7a13.16 13.16 0 0 1-3.08 3.94M6.61 6.61C4.13 8.36 2 12 2 12a13.13 13.13 0 0 0 5.09 5.63A9.77 9.77 0 0 0 12 19" />
            </svg>
          )}
        </button>
      </div>
      {showRequirements && touched && value.length > 0 && (
        <ul className="password-requirements">
          {PASSWORD_REQUIREMENTS.map((r) => {
            const met = r.test(value);
            return (
              <li key={r.key} className={met ? "met" : ""}>
                <span className="password-req-icon">{met ? "✓" : "•"}</span>
                {r.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
