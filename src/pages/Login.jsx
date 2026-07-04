import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginRequest } from "../store/slices/authSlice.js";
import { sha256Hex } from "../utils/hash.js";
import Spinner from "../components/common/Spinner.jsx";
import PasswordField from "../components/common/PasswordField.jsx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error, user } = useSelector((s) => s.auth);

  useEffect(() => {
    if (status === "succeeded" && user) {
      navigate(user.roleType === "ADMIN" ? "/admin" : "/candidate");
    }
  }, [status, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const hashedPassword = await sha256Hex(password);
    dispatch(loginRequest({ email, password: hashedPassword }));
  };

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <div>
          <h2>Welcome back</h2>
          <p className="auth-subtitle">Sign in to your account</p>
        </div>
        {error && <div className="error-banner">{error}</div>}
        <div className="input-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <PasswordField
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          showRequirements={false}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={status === "loading"}
        >
          {status === "loading" ? (
            <span className="btn-spinner">
              <Spinner size={14} /> Signing in…
            </span>
          ) : (
            "Sign in →"
          )}
        </button>
        <p className="auth-footer">
          Don't have an account? Ask your admin to create one for you.
        </p>
      </form>
    </div>
  );
}
