import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCandidatesRequest, createCandidateRequest, resetCreateCandidateStatus } from "../../store/slices/adminSlice.js";
import BackButton from "../../components/common/BackButton.jsx";
import TableLoadingRow from "../../components/common/TableLoadingRow.jsx";
import PasswordField from "../../components/common/PasswordField.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import { sha256Hex } from "../../utils/hash.js";
import { isPasswordValid, passwordErrorMessage } from "../../utils/validation.js";
import { TECH_OPTIONS } from "../../constants/technologies.js";

const EMPTY_FORM = { firstName: "", lastName: "", email: "", mobile: "", password: "", experience: 0, technology: [] };

export default function CandidateList() {
  const dispatch = useDispatch();
  const { candidates, candidatesStatus, createCandidateStatus, createCandidateError } = useSelector((s) => s.admin);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);

  useEffect(() => { dispatch(fetchCandidatesRequest({ search: search || undefined })); }, [dispatch]);

  useEffect(() => {
    if (createCandidateStatus === "succeeded" && modalOpen) {
      setForm(EMPTY_FORM);
      setFormError(null);
      setModalOpen(false);
    }
  }, [createCandidateStatus, modalOpen]);

  const load = () => dispatch(fetchCandidatesRequest({ search: search || undefined }));

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleTech = (t) => set("technology", form.technology.includes(t) ? form.technology.filter(x=>x!==t) : [...form.technology, t]);

  const openModal = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    dispatch(resetCreateCandidateStatus());
    setModalOpen(true);
  };

  const handleCancel = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    dispatch(resetCreateCandidateStatus());
    setModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isPasswordValid(form.password)) {
      setFormError(passwordErrorMessage());
      return;
    }
    setFormError(null);
    const hashedPassword = await sha256Hex(form.password);
    dispatch(createCandidateRequest({ ...form, password: hashedPassword }));
  };

  return (
    <div>
      <BackButton to="/admin" />
      <div className="section-header">
        <div>
          <p className="page-title">Candidates</p>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Manage registered candidates</p>
        </div>
        <button className="btn btn-primary" onClick={openModal}>+ Add Candidate</button>
      </div>

      <div className="search-row">
        <input placeholder="Search by name or email…" value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&load()} />
        <button className="btn btn-primary" onClick={load}>Search</button>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Name</th><th>Email</th><th>Technologies</th><th>Exp</th><th>Company</th><th>Status</th></tr></thead>
          <tbody>
            {candidatesStatus === "loading" ? <TableLoadingRow colSpan={6} />
              : candidates.length === 0 ? <tr><td colSpan={6} className="loading">No candidates found</td></tr>
              : candidates.map(c => (
                <tr key={c._id}>
                  <td><strong>{c.firstName} {c.lastName}</strong></td>
                  <td className="muted">{c.email}</td>
                  <td>{c.technology?.join(", ") || "—"}</td>
                  <td>{c.experience} yrs</td>
                  <td>{c.currentCompany || "—"}</td>
                  <td><span className={`badge ${c.isActive?"badge-completed":"badge-cancelled"}`}>{c.isActive?"Active":"Inactive"}</span></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Candidate</h3>
            <p className="muted" style={{ marginBottom: "1rem" }}>Create a candidate account directly. They can sign in immediately with the password you set.</p>
            {(formError || (createCandidateStatus === "failed" && createCandidateError)) && (
              <div className="error-banner" style={{ marginBottom: "1rem" }}>{formError || createCandidateError}</div>
            )}
            <form className="form-grid" onSubmit={handleSubmit}>
              <div className="row-2">
                <div className="form-group"><label>First name</label><input value={form.firstName} onChange={e=>set("firstName",e.target.value)} required /></div>
                <div className="form-group"><label>Last name</label><input value={form.lastName} onChange={e=>set("lastName",e.target.value)} required /></div>
              </div>
              <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={e=>set("email",e.target.value)} required /></div>
              <div className="row-2">
                <div className="form-group"><label>Mobile</label><input value={form.mobile} onChange={e=>set("mobile",e.target.value)} required /></div>
                <div className="form-group"><label>Experience (yrs)</label><input type="number" min="0" value={form.experience} onChange={e=>set("experience",Number(e.target.value))} /></div>
              </div>
              <PasswordField value={form.password} onChange={(v)=>set("password",v)} />
              <div className="form-group">
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
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={handleCancel} disabled={createCandidateStatus === "loading"}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={createCandidateStatus === "loading"}>
                  {createCandidateStatus === "loading" ? <span className="btn-spinner"><Spinner size={14} /> Creating…</span> : "Save Candidate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
