import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchCandidatesRequest, scheduleInterviewRequest, resetScheduleStatus } from "../../store/slices/adminSlice.js";
import { fetchTemplatesRequest } from "../../store/slices/templateSlice.js";
import BackButton from "../../components/common/BackButton.jsx";
import Toast from "../../components/common/Toast.jsx";
import Spinner from "../../components/common/Spinner.jsx";

export default function ScheduleInterview() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { candidates, scheduleStatus, scheduleError } = useSelector((s) => s.admin);
  const { items: templates } = useSelector((s) => s.template);

  const [form, setForm] = useState({ candidateId:"", technology:"", scheduledDate:"", scheduledTime:"", duration:30, difficulty:"Medium" });

  useEffect(() => {
    dispatch(resetScheduleStatus());
    dispatch(fetchCandidatesRequest({ limit: 200 }));
    dispatch(fetchTemplatesRequest());
  }, [dispatch]);

  useEffect(() => {
    if (scheduleStatus === "succeeded") navigate("/admin/interviews");
  }, [scheduleStatus, navigate]);

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(scheduleInterviewRequest(form));
  };

  const selectedCandidate = candidates.find(c => c._id === form.candidateId);
  const matchingTemplates = selectedCandidate?.technology?.length
    ? templates.filter(t => selectedCandidate.technology.includes(t.technology))
    : templates;
  const noMatch = !!selectedCandidate?.technology?.length && matchingTemplates.length === 0;
  const availableTemplates = noMatch ? templates : matchingTemplates;

  return (
    <div className="form-page">
      <BackButton to="/admin" />
      <p className="page-title">Schedule Interview</p>
      <p className="page-subtitle">Set up a new technical interview for a candidate</p>

      <Toast message={scheduleError} type="error" onClose={() => dispatch(resetScheduleStatus())} />

      <div className="form-card">
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Candidate</label>
            <select
              value={form.candidateId}
              onChange={e=>setForm(f=>({...f, candidateId:e.target.value, technology:""}))}
              required
            >
              <option value="">Select a candidate…</option>
              {candidates.map(c => <option key={c._id} value={c._id}>{c.firstName} {c.lastName} — {c.email}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Technology</label>
            <select value={form.technology} onChange={e=>set("technology",e.target.value)} required>
              <option value="">Select technology…</option>
              {availableTemplates.map(t => <option key={t._id} value={t.technology}>{t.technology}</option>)}
            </select>
            {noMatch && (
              <p className="muted" style={{marginTop:"0.4rem"}}>
                No template matches this candidate's registered skills ({selectedCandidate.technology.join(", ")}) — showing all technologies instead.
              </p>
            )}
          </div>
          <div className="row-2">
            <div className="form-group">
              <label>Date</label>
              <input type="date" value={form.scheduledDate} onChange={e=>set("scheduledDate",e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Time</label>
              <input type="time" value={form.scheduledTime} onChange={e=>set("scheduledTime",e.target.value)} required />
            </div>
          </div>
          <div className="row-2">
            <div className="form-group">
              <label>Duration (minutes)</label>
              <input type="number" min="10" max="120" value={form.duration} onChange={e=>set("duration",Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label>Difficulty</label>
              <select value={form.difficulty} onChange={e=>set("difficulty",e.target.value)}>
                <option>Easy</option><option>Medium</option><option>Hard</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={scheduleStatus === "loading"}>
            {scheduleStatus === "loading" ? <span className="btn-spinner"><Spinner size={14} /> Scheduling…</span> : "Schedule Interview →"}
          </button>
        </form>
      </div>
    </div>
  );
}
