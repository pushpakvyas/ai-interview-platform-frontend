import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { registerRequest } from "../store/slices/authSlice.js";
import { sha256Hex } from "../utils/hash.js";
import { TECH_OPTIONS } from "../constants/technologies.js";
import Spinner from "../components/common/Spinner.jsx";

export default function Register() {
  const [form, setForm] = useState({
    firstName:"", lastName:"", email:"", mobile:"", password:"",
    experience:0, technology:[],
  });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error, user } = useSelector((s) => s.auth);

  useEffect(() => {
    if (status === "succeeded" && user) navigate("/candidate");
  }, [status, user, navigate]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleTech = (t) => set("technology", form.technology.includes(t) ? form.technology.filter(x=>x!==t) : [...form.technology, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const hashedPassword = await sha256Hex(form.password);
    dispatch(registerRequest({ ...form, password: hashedPassword }));
  };

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit} style={{ maxWidth: 520 }}>
        <div>
          <h2>Create account</h2>
          <p className="auth-subtitle">Register as a candidate to attend interviews</p>
        </div>
        {error && <div className="error-banner">{error}</div>}

        <div className="row-2">
          <div className="input-group"><label>First name</label><input placeholder="Alex" value={form.firstName} onChange={e=>set("firstName",e.target.value)} required /></div>
          <div className="input-group"><label>Last name</label><input placeholder="Smith" value={form.lastName} onChange={e=>set("lastName",e.target.value)} required /></div>
        </div>
        <div className="input-group"><label>Email</label><input type="email" placeholder="you@example.com" value={form.email} onChange={e=>set("email",e.target.value)} required /></div>
        <div className="row-2">
          <div className="input-group"><label>Mobile</label><input placeholder="+91 99999 99999" value={form.mobile} onChange={e=>set("mobile",e.target.value)} required /></div>
          <div className="input-group"><label>Password</label><input type="password" placeholder="••••••••" value={form.password} onChange={e=>set("password",e.target.value)} required /></div>
        </div>
        <div className="input-group"><label>Experience (yrs)</label><input type="number" min="0" value={form.experience} onChange={e=>set("experience",e.target.value)} /></div>

        <div className="input-group">
          <label>Technologies</label>
          <div className="tech-select">
            {TECH_OPTIONS.map(t => (
              <label key={t} className={`tech-chip${form.technology.includes(t)?" selected":""}`}>
                <input type="checkbox" checked={form.technology.includes(t)} onChange={()=>toggleTech(t)} />
                {t}
              </label>
            ))}
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={status === "loading"}>
          {status === "loading" ? <span className="btn-spinner"><Spinner size={14} /> Creating…</span> : "Create account →"}
        </button>
        <p className="auth-footer">Already registered? <Link to="/login">Sign in</Link></p>
      </form>
    </div>
  );
}
