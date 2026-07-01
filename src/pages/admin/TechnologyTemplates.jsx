import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTemplatesRequest, createTemplateRequest, deleteTemplateRequest } from "../../store/slices/templateSlice.js";
import BackButton from "../../components/common/BackButton.jsx";
import ConfirmModal from "../../components/common/ConfirmModal.jsx";
import TableLoadingRow from "../../components/common/TableLoadingRow.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import { TECH_OPTIONS } from "../../constants/technologies.js";

export default function TechnologyTemplates() {
  const dispatch = useDispatch();
  const { items: templates, status, mutationStatus, mutationError } = useSelector((s) => s.template);
  const [form, setForm] = useState({ technology:"", defaultSystemPrompt:"" });
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  useEffect(() => { dispatch(fetchTemplatesRequest()); }, [dispatch]);

  useEffect(() => {
    if (mutationStatus === "succeeded") setForm({ technology:"", defaultSystemPrompt:"" });
  }, [mutationStatus]);

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(createTemplateRequest(form));
  };

  const confirmDelete = () => {
    dispatch(deleteTemplateRequest(pendingDeleteId));
    setPendingDeleteId(null);
  };

  return (
    <div>
      <BackButton to="/admin" />
      <p className="page-title">Technology Templates</p>
      <p className="page-subtitle">Manage AI interviewer prompts and question banks per technology</p>

      <div className="form-card form-page" style={{marginBottom:"2rem"}}>
        <h3>Create New Template</h3>
        {mutationStatus === "succeeded" && <div className="success-banner" style={{marginBottom:"1rem"}}>Template saved.</div>}
        {mutationStatus === "failed" && <div className="error-banner" style={{marginBottom:"1rem"}}>{mutationError}</div>}
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Technology name</label>
            <select value={form.technology} onChange={e=>set("technology",e.target.value)} required>
              <option value="">Select technology…</option>
              {TECH_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>System Prompt (AI interviewer instructions)</label>
            <textarea
              rows={8}
              placeholder={`You are an expert AI Technical Interviewer for {technology} roles.\n\n- Ask ONE question at a time\n- Cover core concepts, patterns, and best practices\n- Adjust difficulty based on candidate's answers\n- Be professional and encouraging`}
              value={form.defaultSystemPrompt}
              onChange={e=>set("defaultSystemPrompt",e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={mutationStatus === "loading"}>
            {mutationStatus === "loading" ? <span className="btn-spinner"><Spinner size={14} /> Creating…</span> : "Create Template →"}
          </button>
        </form>
      </div>

      <div className="section-header"><span className="section-title">Existing Templates</span><span className="muted">{templates.length} total</span></div>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Technology</th><th>Questions in Bank</th><th>Prompt Versions</th><th>Active</th><th>Actions</th></tr></thead>
          <tbody>
            {status === "loading" ? <TableLoadingRow colSpan={5} />
              : templates.length === 0 ? <tr><td colSpan={5} className="loading">No templates yet — create one above</td></tr>
              : templates.map(t => (
                <tr key={t._id}>
                  <td><strong>{t.technology}</strong></td>
                  <td>{t.questionBank?.length || 0}</td>
                  <td>{t.promptVersions?.length || 1}</td>
                  <td><span className={`badge ${t.isActive?"badge-completed":"badge-cancelled"}`}>{t.isActive?"Active":"Inactive"}</span></td>
                  <td>
                    <button
                      className="btn btn-sm"
                      style={{background:"var(--red-dim)",color:"var(--red)",border:"none"}}
                      onClick={() => setPendingDeleteId(t._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={!!pendingDeleteId}
        title="Delete template?"
        message="This will deactivate the template so it can no longer be used for new interviews."
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
