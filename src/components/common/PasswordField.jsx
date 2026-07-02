import { useState } from "react";
import { PASSWORD_REQUIREMENTS } from "../../utils/validation.js";

export default function PasswordField({ label = "Password", value, onChange, placeholder = "••••••••", autoComplete = "new-password" }) {
  const [touched, setTouched] = useState(false);

  return (
    <div className="input-group">
      <label>{label}</label>
      <input
        type="password"
        placeholder={placeholder}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setTouched(true)}
        required
      />
      {touched && value.length > 0 && (
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
