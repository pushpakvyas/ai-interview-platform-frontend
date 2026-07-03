import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchJobRolesRequest, createJobRoleRequest, updateJobRoleRequest, deleteJobRoleRequest } from "../../store/slices/jobRoleSlice.js";
import { fetchSkillsRequest, createSkillRequest, resetSkillMutationStatus } from "../../store/slices/skillSlice.js";
import BackButton from "../../components/common/BackButton.jsx";
import ConfirmModal from "../../components/common/ConfirmModal.jsx";
import TableLoadingRow from "../../components/common/TableLoadingRow.jsx";
import Spinner from "../../components/common/Spinner.jsx";

const EMPTY_FORM = { name: "", skills: [] };

export default function JobRoles() {
  const dispatch = useDispatch();
  const { items: jobRoles, status, mutationStatus, mutationError } = useSelector((s) => s.jobRole);
  const { items: skills, mutationStatus: skillMutationStatus, mutationError: skillMutationError, lastCreated } = useSelector((s) => s.skill);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [newSkillName, setNewSkillName] = useState("");

  useEffect(() => {
    dispatch(fetchJobRolesRequest());
    dispatch(fetchSkillsRequest());
  }, [dispatch]);

  useEffect(() => {
    if (mutationStatus === "succeeded" && modalOpen) {
      setForm(EMPTY_FORM);
      setEditingId(null);
      setModalOpen(false);
    }
  }, [mutationStatus, modalOpen]);

  // When a skill is added inline from this page (because it was missing from
  // the list), automatically select it into the role being built.
  useEffect(() => {
    if (skillMutationStatus === "succeeded" && lastCreated) {
      setForm((f) => ({ ...f, skills: [...f.skills, lastCreated._id] }));
      setNewSkillName("");
      dispatch(resetSkillMutationStatus());
    }
  }, [skillMutationStatus, lastCreated, dispatch]);

  const toggleSkill = (id) =>
    setForm((f) => ({ ...f, skills: f.skills.includes(id) ? f.skills.filter((s) => s !== id) : [...f.skills, id] }));

  const handleAddSkill = (e) => {
    e.preventDefault();
    const name = newSkillName.trim();
    if (!name) return;
    dispatch(createSkillRequest({ name }));
  };

  const openModal = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEditModal = (role) => {
    setForm({ name: role.name, skills: role.skills.map((s) => s._id) });
    setEditingId(role._id);
    setModalOpen(true);
  };

  const handleCancel = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setModalOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.skills.length === 0) return;
    if (editingId) {
      dispatch(updateJobRoleRequest({ id: editingId, skills: form.skills }));
    } else {
      dispatch(createJobRoleRequest(form));
    }
  };

  const confirmDelete = () => {
    dispatch(deleteJobRoleRequest(pendingDeleteId));
    setPendingDeleteId(null);
  };

  return (
    <div>
      <BackButton to="/admin" />
      <div className="section-header">
        <div>
          <p className="page-title">Job Roles</p>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Combine skills into a job role (e.g. MERN Stack Developer) for a single blended interview</p>
        </div>
        <button className="btn btn-primary" onClick={openModal}>+ New Role</button>
      </div>

      {mutationStatus === "succeeded" && !modalOpen && (
        <div className="success-banner" style={{ marginBottom: "1.25rem" }}>Job role saved.</div>
      )}

      <div className="section-header"><span className="section-title">Existing Roles</span><span className="muted">{jobRoles.length} total</span></div>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Role name</th><th>Skills</th><th>Active</th><th>Actions</th></tr></thead>
          <tbody>
            {status === "loading" ? <TableLoadingRow colSpan={4} />
              : jobRoles.length === 0 ? (
                <tr><td colSpan={4} className="loading">No job roles yet — click "+ New Role" to create one</td></tr>
              ) : jobRoles.map((r) => (
                <tr key={r._id}>
                  <td><strong>{r.name}</strong></td>
                  <td>{r.skills.map((s) => s.name).join(", ")}</td>
                  <td><span className={`badge ${r.isActive?"badge-completed":"badge-cancelled"}`}>{r.isActive?"Active":"Inactive"}</span></td>
                  <td>
                    <div className="action-cell">
                      <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(r)}>Edit</button>
                      <button
                        className="btn btn-sm"
                        style={{background:"var(--red-dim)",color:"var(--red)",border:"none"}}
                        onClick={() => setPendingDeleteId(r._id)}
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
            <h3>{editingId ? "Edit Job Role" : "Add New Job Role"}</h3>
            {mutationStatus === "failed" && <div className="error-banner" style={{marginBottom:"1rem"}}>{mutationError}</div>}
            <form className="form-grid" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Role name</label>
                <input
                  type="text"
                  placeholder="e.g. MERN Stack Developer"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  disabled={!!editingId}
                  required
                />
                {editingId && <p className="muted" style={{marginTop:"0.4rem"}}>The role name can't be changed after creation.</p>}
              </div>
              <div className="form-group">
                <label>Skills that make up this role</label>
                <div className="tech-select">
                  {skills.map((s) => (
                    <label key={s._id} className={`tech-chip${form.skills.includes(s._id)?" selected":""}`}>
                      <input type="checkbox" checked={form.skills.includes(s._id)} onChange={() => toggleSkill(s._id)} />
                      {s.name}
                    </label>
                  ))}
                </div>
                {form.skills.length === 0 && <p className="muted" style={{marginTop:"0.4rem"}}>Select at least one skill.</p>}

                <div className="row-2" style={{marginTop:"0.75rem", alignItems:"flex-end"}}>
                  <div className="form-group" style={{marginBottom:0}}>
                    <label>Skill missing? Add it here</label>
                    <input
                      type="text"
                      placeholder="e.g. GraphQL"
                      value={newSkillName}
                      onChange={(e) => setNewSkillName(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={handleAddSkill}
                    disabled={skillMutationStatus === "loading" || !newSkillName.trim()}
                  >
                    {skillMutationStatus === "loading" ? <Spinner size={14} /> : "+ Add Skill"}
                  </button>
                </div>
                {skillMutationStatus === "failed" && skillMutationError && (
                  <p className="muted" style={{marginTop:"0.4rem", color:"var(--red)"}}>{skillMutationError}</p>
                )}
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={handleCancel} disabled={mutationStatus === "loading"}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={mutationStatus === "loading" || form.skills.length === 0}>
                  {mutationStatus === "loading" ? <span className="btn-spinner"><Spinner size={14} /> Saving…</span> : "Save Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!pendingDeleteId}
        title="Delete job role?"
        message="This will deactivate the role so it can no longer be used for new interviews."
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
