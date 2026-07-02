import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTemplatesRequest, createTemplateRequest, deleteTemplateRequest } from "../../store/slices/templateSlice.js";
import BackButton from "../../components/common/BackButton.jsx";
import ConfirmModal from "../../components/common/ConfirmModal.jsx";
import TableLoadingRow from "../../components/common/TableLoadingRow.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import { TECH_OPTIONS } from "../../constants/technologies.js";

const EMPTY_FORM = { technology: "", defaultSystemPrompt: "" };

export default function TechnologyTemplates() {
  const dispatch = useDispatch();
  const { items: templates, status, mutationStatus, mutationError } = useSelector((s) => s.template);
  const [form, setForm] = useState(EMPTY_FORM);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  useEffect(() => { dispatch(fetchTemplatesRequest()); }, [dispatch]);

  // Once a create request succeeds, clear the form and close the modal.
  useEffect(() => {
    if (mutationStatus === "succeeded" && modalOpen) {
      setForm(EMPTY_FORM);
      setModalOpen(false);
    }
  }, [mutationStatus, modalOpen]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const openModal = () => {
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const handleCancel = () => {
    setForm(EMPTY_FORM);
    setModalOpen(false);
  };

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
      <div className="section-header">
        <div>
          <p className="page-title">Technology Templates</p>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Manage AI interviewer prompts and question banks per technology</p>
        </div>
        <button className="btn btn-primary" onClick={openModal}>+ New Template</button>
      </div>

      {mutationStatus === "succeeded" && !modalOpen && (
        <div className="success-banner" style={{ marginBottom: "1.25rem" }}>Template saved.</div>
      )}

      <div className="section-header"><span className="section-title">Existing Templates</span><span className="muted">{templates.length} total</span></div>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Technology</th><th>Questions in Bank</th><th>Prompt Versions</th><th>Active</th><th>Actions</th></tr></thead>
          <tbody>
            {status === "loading" ? <TableLoadingRow colSpan={5} />
              : templates.length === 0 ? (
                <tr><td colSpan={5} className="loading">No templates yet — click "+ New Template" to create one</td></tr>
              ) : templates.map(t => (
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

      {modalOpen && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Template</h3>
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
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={handleCancel} disabled={mutationStatus === "loading"}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={mutationStatus === "loading"}>
                  {mutationStatus === "loading" ? <span className="btn-spinner"><Spinner size={14} /> Saving…</span> : "Save Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
