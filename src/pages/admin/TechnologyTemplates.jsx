import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchTemplatesRequest,
  createTemplateRequest,
  updateTemplateRequest,
  deleteTemplateRequest,
  resetTemplateMutationStatus,
} from "../../store/slices/templateSlice.js";
import BackButton from "../../components/common/BackButton.jsx";
import ConfirmModal from "../../components/common/ConfirmModal.jsx";
import TableLoadingRow from "../../components/common/TableLoadingRow.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import { TECH_OPTIONS } from "../../constants/technologies.js";

const DEFAULT_CRITERIA = ["Technical Knowledge", "Communication", "Domain Knowledge", "Confidence", "Clarity"];

const EMPTY_FORM = {
  technology: "",
  defaultSystemPrompt: "",
  questionBank: [],
  evaluationCriteriaText: DEFAULT_CRITERIA.join(", "),
};

const EMPTY_QUESTION = { question: "", topic: "", difficulty: "MEDIUM" };

export default function TechnologyTemplates() {
  const dispatch = useDispatch();
  const { items: templates, status, mutationStatus, mutationError } = useSelector((s) => s.template);
  const [form, setForm] = useState(EMPTY_FORM);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = creating, otherwise the template's _id
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  useEffect(() => { dispatch(fetchTemplatesRequest()); }, [dispatch]);

  // Once a create/update request succeeds, clear the form and close the modal.
  useEffect(() => {
    if (mutationStatus === "succeeded" && modalOpen) {
      setForm(EMPTY_FORM);
      setEditingId(null);
      setModalOpen(false);
    }
  }, [mutationStatus, modalOpen]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const openCreateModal = () => {
    dispatch(resetTemplateMutationStatus());
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEditModal = (template) => {
    dispatch(resetTemplateMutationStatus());
    setEditingId(template._id);
    setForm({
      technology: template.technology,
      defaultSystemPrompt: template.defaultSystemPrompt || "",
      questionBank: (template.questionBank || []).map((q) => ({
        question: q.question || "",
        topic: q.topic || "",
        difficulty: q.difficulty || "MEDIUM",
      })),
      evaluationCriteriaText: (template.evaluationCriteria?.length ? template.evaluationCriteria : DEFAULT_CRITERIA).join(", "),
    });
    setModalOpen(true);
  };

  const handleCancel = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setModalOpen(false);
  };

  const addQuestionRow = () => {
    setForm((f) => ({ ...f, questionBank: [...f.questionBank, { ...EMPTY_QUESTION }] }));
  };

  const updateQuestionRow = (idx, key, value) => {
    setForm((f) => ({
      ...f,
      questionBank: f.questionBank.map((q, i) => (i === idx ? { ...q, [key]: value } : q)),
    }));
  };

  const removeQuestionRow = (idx) => {
    setForm((f) => ({ ...f, questionBank: f.questionBank.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const evaluationCriteria = form.evaluationCriteriaText
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    const questionBank = form.questionBank
      .map((q) => ({ ...q, question: q.question.trim(), topic: q.topic.trim() }))
      .filter((q) => q.question.length > 0);

    if (editingId) {
      dispatch(updateTemplateRequest({
        id: editingId,
        defaultSystemPrompt: form.defaultSystemPrompt,
        questionBank,
        evaluationCriteria,
      }));
    } else {
      dispatch(createTemplateRequest({
        technology: form.technology,
        defaultSystemPrompt: form.defaultSystemPrompt,
        questionBank,
        evaluationCriteria,
      }));
    }
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
        <button className="btn btn-primary" onClick={openCreateModal}>+ New Template</button>
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
                  <td style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={() => openEditModal(t)}
                    >
                      Edit
                    </button>
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
          <div className="modal-panel" style={{ maxWidth: "720px" }} onClick={(e) => e.stopPropagation()}>
            <h3>{editingId ? `Edit Template — ${form.technology}` : "Add New Template"}</h3>
            {mutationStatus === "failed" && <div className="error-banner" style={{marginBottom:"1rem"}}>{mutationError}</div>}
            <form className="form-grid" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Technology name</label>
                {editingId ? (
                  // Technology is the template's unique key and interviews already
                  // reference it — renaming it here would silently orphan those
                  // links, so it's locked once a template exists. Delete + recreate
                  // if the technology itself truly needs to change.
                  <input value={form.technology} disabled />
                ) : (
                  <select value={form.technology} onChange={e=>set("technology",e.target.value)} required>
                    <option value="">Select technology…</option>
                    {TECH_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                )}
              </div>

              <div className="form-group">
                <label>System Prompt (AI interviewer instructions)</label>
                <textarea
                  rows={6}
                  placeholder={`You are an expert AI Technical Interviewer for {technology} roles.\n\n- Ask ONE question at a time\n- Cover core concepts, patterns, and best practices\n- Adjust difficulty based on candidate's answers\n- Be professional and encouraging`}
                  value={form.defaultSystemPrompt}
                  onChange={e=>set("defaultSystemPrompt",e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Evaluation criteria (comma-separated)</label>
                <input
                  value={form.evaluationCriteriaText}
                  onChange={e=>set("evaluationCriteriaText", e.target.value)}
                  placeholder="Technical Knowledge, Communication, Domain Knowledge, Confidence, Clarity"
                />
              </div>

              <div className="form-group">
                <label>Question bank / skills to test</label>
                <div className="qbank-editor">
                  {form.questionBank.length === 0 && (
                    <p className="muted" style={{ margin: "0 0 0.5rem" }}>
                      No questions yet — the AI interviewer will ask generic questions until you add some below.
                    </p>
                  )}
                  {form.questionBank.map((q, idx) => (
                    <div className="qbank-row" key={idx}>
                      <input
                        className="qbank-question"
                        placeholder="Question or skill to probe (e.g. Explain event delegation in JS)"
                        value={q.question}
                        onChange={(e) => updateQuestionRow(idx, "question", e.target.value)}
                      />
                      <input
                        className="qbank-topic"
                        placeholder="Topic (optional)"
                        value={q.topic}
                        onChange={(e) => updateQuestionRow(idx, "topic", e.target.value)}
                      />
                      <select
                        className="qbank-difficulty"
                        value={q.difficulty}
                        onChange={(e) => updateQuestionRow(idx, "difficulty", e.target.value)}
                      >
                        <option value="EASY">Easy</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HARD">Hard</option>
                      </select>
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost qbank-remove"
                        onClick={() => removeQuestionRow(idx)}
                        aria-label="Remove question"
                        title="Remove question"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button type="button" className="btn btn-sm btn-ghost" onClick={addQuestionRow}>
                    + Add question
                  </button>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={handleCancel} disabled={mutationStatus === "loading"}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={mutationStatus === "loading"}>
                  {mutationStatus === "loading"
                    ? <span className="btn-spinner"><Spinner size={14} /> Saving…</span>
                    : editingId ? "Save Changes" : "Save Template"}
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