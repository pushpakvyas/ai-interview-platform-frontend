import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSkillsRequest, createSkillRequest, updateSkillRequest, deleteSkillRequest } from "../../store/slices/skillSlice.js";
import BackButton from "../../components/common/BackButton.jsx";
import ConfirmModal from "../../components/common/ConfirmModal.jsx";
import TableLoadingRow from "../../components/common/TableLoadingRow.jsx";
import Spinner from "../../components/common/Spinner.jsx";

const EMPTY_FORM = { name: "", systemPromptFragment: "" };

export default function Skills() {
  const dispatch = useDispatch();
  const { items: skills, status, mutationStatus, mutationError } = useSelector((s) => s.skill);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  useEffect(() => { dispatch(fetchSkillsRequest()); }, [dispatch]);

  useEffect(() => {
    if (mutationStatus === "succeeded" && modalOpen) {
      setForm(EMPTY_FORM);
      setEditingId(null);
      setModalOpen(false);
    }
  }, [mutationStatus, modalOpen]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const openModal = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEditModal = (skill) => {
    setForm({ name: skill.name, systemPromptFragment: skill.systemPromptFragment });
    setEditingId(skill._id);
    setModalOpen(true);
  };

  const handleCancel = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setModalOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      dispatch(updateSkillRequest({ id: editingId, systemPromptFragment: form.systemPromptFragment }));
    } else {
      dispatch(createSkillRequest(form));
    }
  };

  const confirmDelete = () => {
    dispatch(deleteSkillRequest(pendingDeleteId));
    setPendingDeleteId(null);
  };

  return (
    <div>
      <BackButton to="/admin" />
      <div className="section-header">
        <div>
          <p className="page-title">Skills</p>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>The atomic skills (e.g. React, Node.js, MongoDB) that candidates list and job roles are composed of</p>
        </div>
        <button className="btn btn-primary" onClick={openModal}>+ New Skill</button>
      </div>

      {mutationStatus === "succeeded" && !modalOpen && (
        <div className="success-banner" style={{ marginBottom: "1.25rem" }}>Skill saved.</div>
      )}

      <div className="section-header"><span className="section-title">Existing Skills</span><span className="muted">{skills.length} total</span></div>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Skill name</th><th>Active</th><th>Actions</th></tr></thead>
          <tbody>
            {status === "loading" ? <TableLoadingRow colSpan={3} />
              : skills.length === 0 ? (
                <tr><td colSpan={3} className="loading">No skills yet — click "+ New Skill" to create one</td></tr>
              ) : skills.map(s => (
                <tr key={s._id}>
                  <td><strong>{s.name}</strong></td>
                  <td><span className={`badge ${s.isActive?"badge-completed":"badge-cancelled"}`}>{s.isActive?"Active":"Inactive"}</span></td>
                  <td>
                    <div className="action-cell">
                      <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(s)}>Edit</button>
                      <button
                        className="btn btn-sm"
                        style={{background:"var(--red-dim)",color:"var(--red)",border:"none"}}
                        onClick={() => setPendingDeleteId(s._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <h3>{editingId ? "Edit Skill" : "Add New Skill"}</h3>
            {mutationStatus === "failed" && <div className="error-banner" style={{marginBottom:"1rem"}}>{mutationError}</div>}
            <form className="form-grid" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Skill name</label>
                <input
                  type="text"
                  placeholder="e.g. React, Node.js, Docker"
                  value={form.name}
                  onChange={e=>set("name",e.target.value)}
                  disabled={!!editingId}
                  required
                />
                {editingId && <p className="muted" style={{marginTop:"0.4rem"}}>The skill name can't be changed after creation.</p>}
              </div>
              <div className="form-group">
                <label>Interview instructions for this skill (optional)</label>
                <textarea
                  rows={6}
                  placeholder="Leave blank to auto-generate a sensible default. These instructions get blended together when this skill is part of a job role interview."
                  value={form.systemPromptFragment}
                  onChange={e=>set("systemPromptFragment",e.target.value)}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={handleCancel} disabled={mutationStatus === "loading"}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={mutationStatus === "loading"}>
                  {mutationStatus === "loading" ? <span className="btn-spinner"><Spinner size={14} /> Saving…</span> : "Save Skill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!pendingDeleteId}
        title="Delete skill?"
        message="This will deactivate the skill so it can no longer be added to candidates or job roles."
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
