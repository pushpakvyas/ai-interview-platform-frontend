import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchCandidatesRequest, scheduleInterviewRequest, resetScheduleStatus } from "../../store/slices/adminSlice.js";
import { fetchTemplatesRequest } from "../../store/slices/templateSlice.js";
import { fetchJobRolesRequest } from "../../store/slices/jobRoleSlice.js";
import { fetchSkillsRequest } from "../../store/slices/skillSlice.js";
import BackButton from "../../components/common/BackButton.jsx";
import Toast from "../../components/common/Toast.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import DatePicker from "../../components/common/DatePicker.jsx";
import TimePicker from "../../components/common/TimePicker.jsx";

const EMPTY_NEW_CANDIDATE = { firstName: "", lastName: "", email: "", mobile: "", experience: 0, skills: [] };

export default function ScheduleInterview() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { candidates, scheduleStatus, scheduleError } = useSelector((s) => s.admin);
  const { items: templates } = useSelector((s) => s.template);
  const { items: jobRoles } = useSelector((s) => s.jobRole);
  const { items: skills } = useSelector((s) => s.skill);

  const [candidateMode, setCandidateMode] = useState("existing"); // existing | new
  const [targetMode, setTargetMode] = useState("skill"); // skill | role

  const [form, setForm] = useState({ candidateId:"", technology:"", jobRoleId:"", scheduledDate:"", scheduledTime:"", duration:30, difficulty:"Medium" });
  const [newCandidate, setNewCandidate] = useState(EMPTY_NEW_CANDIDATE);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    dispatch(resetScheduleStatus());
    dispatch(fetchCandidatesRequest({ limit: 200 }));
    dispatch(fetchTemplatesRequest());
    dispatch(fetchJobRolesRequest());
    dispatch(fetchSkillsRequest());
  }, [dispatch]);

  useEffect(() => {
    if (scheduleStatus === "succeeded") navigate("/admin/interviews");
  }, [scheduleStatus, navigate]);

  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const setNC = (k,v) => setNewCandidate(f=>({...f,[k]:v}));
  const toggleSkill = (t) => setNC("skills", newCandidate.skills.includes(t) ? newCandidate.skills.filter(x=>x!==t) : [...newCandidate.skills, t]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.scheduledDate || !form.scheduledTime) {
      setFormError("Please select both a date and a time.");
      return;
    }
    if (candidateMode === "new" && (!newCandidate.firstName || !newCandidate.lastName || !newCandidate.email || !newCandidate.mobile)) {
      setFormError("Please fill in the new candidate's name, email, and mobile number.");
      return;
    }
    if (targetMode === "skill" && !form.technology) {
      setFormError("Please select a technology.");
      return;
    }
    if (targetMode === "role" && !form.jobRoleId) {
      setFormError("Please select a job role.");
      return;
    }
    setFormError(null);

    const payload = {
      scheduledDate: form.scheduledDate,
      scheduledTime: form.scheduledTime,
      duration: form.duration,
      difficulty: form.difficulty,
    };
    if (candidateMode === "existing") payload.candidateId = form.candidateId;
    else payload.newCandidate = newCandidate;

    if (targetMode === "skill") payload.technology = form.technology;
    else payload.jobRoleId = form.jobRoleId;

    dispatch(scheduleInterviewRequest(payload));
  };

  const selectedCandidate = candidates.find(c => c._id === form.candidateId);
  const matchingTemplates = selectedCandidate?.technology?.length
    ? templates.filter(t => selectedCandidate.technology.includes(t.technology))
    : templates;
  const noMatch = candidateMode === "existing" && !!selectedCandidate?.technology?.length && matchingTemplates.length === 0;
  const availableTemplates = noMatch ? templates : matchingTemplates;

  return (
    <div className="form-page">
      <BackButton to="/admin" />
      <p className="page-title">Schedule Interview</p>
      <p className="page-subtitle">Set up a new technical interview for a candidate</p>

      <Toast message={scheduleError} type="error" onClose={() => dispatch(resetScheduleStatus())} />
      {formError && <div className="error-banner" style={{ marginBottom: "1rem" }}>{formError}</div>}

      <div className="form-card">
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Candidate</label>
            <div className="tech-select" style={{marginBottom:"0.75rem"}}>
              <label className={`tech-chip${candidateMode==="existing"?" selected":""}`}>
                <input type="radio" name="candidateMode" checked={candidateMode==="existing"} onChange={()=>setCandidateMode("existing")} />
                Existing candidate
              </label>
              <label className={`tech-chip${candidateMode==="new"?" selected":""}`}>
                <input type="radio" name="candidateMode" checked={candidateMode==="new"} onChange={()=>setCandidateMode("new")} />
                New candidate
              </label>
            </div>

            {candidateMode === "existing" ? (
              <select
                value={form.candidateId}
                onChange={e=>setForm(f=>({...f, candidateId:e.target.value}))}
                required
              >
                <option value="">Select a candidate…</option>
                {candidates.map(c => <option key={c._id} value={c._id}>{c.firstName} {c.lastName} — {c.email}</option>)}
              </select>
            ) : (
              <div className="form-grid" style={{gap:"0.75rem"}}>
                <p className="muted" style={{margin:0}}>A password will be auto-generated and emailed to the candidate along with the interview details and platform login link.</p>
                <div className="row-2">
                  <div className="form-group"><label>First name</label><input value={newCandidate.firstName} onChange={e=>setNC("firstName",e.target.value)} required /></div>
                  <div className="form-group"><label>Last name</label><input value={newCandidate.lastName} onChange={e=>setNC("lastName",e.target.value)} required /></div>
                </div>
                <div className="form-group"><label>Email</label><input type="email" value={newCandidate.email} onChange={e=>setNC("email",e.target.value)} required /></div>
                <div className="row-2">
                  <div className="form-group"><label>Mobile</label><input value={newCandidate.mobile} onChange={e=>setNC("mobile",e.target.value)} required /></div>
                  <div className="form-group"><label>Experience (yrs)</label><input type="number" min="0" value={newCandidate.experience} onChange={e=>setNC("experience",Number(e.target.value))} /></div>
                </div>
                <div className="form-group">
                  <label>Skills</label>
                  <div className="tech-select">
                    {skills.map(s => (
                      <label key={s._id} className={`tech-chip${newCandidate.skills.includes(s.name)?" selected":""}`}>
                        <input type="checkbox" checked={newCandidate.skills.includes(s.name)} onChange={()=>toggleSkill(s.name)} />
                        {s.name}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Interviewing for</label>
            <div className="tech-select" style={{marginBottom:"0.75rem"}}>
              <label className={`tech-chip${targetMode==="skill"?" selected":""}`}>
                <input type="radio" name="targetMode" checked={targetMode==="skill"} onChange={()=>setTargetMode("skill")} />
                Individual skill
              </label>
              <label className={`tech-chip${targetMode==="role"?" selected":""}`}>
                <input type="radio" name="targetMode" checked={targetMode==="role"} onChange={()=>setTargetMode("role")} />
                Job role (multiple skills)
              </label>
            </div>

            {targetMode === "skill" ? (
              <>
                <select value={form.technology} onChange={e=>set("technology",e.target.value)} required>
                  <option value="">Select technology…</option>
                  {availableTemplates.map(t => <option key={t._id} value={t.technology}>{t.technology}</option>)}
                </select>
                {noMatch && (
                  <p className="muted" style={{marginTop:"0.4rem"}}>
                    No template matches this candidate's registered skills ({selectedCandidate.technology.join(", ")}) — showing all technologies instead.
                  </p>
                )}
              </>
            ) : (
              <>
                <select value={form.jobRoleId} onChange={e=>set("jobRoleId",e.target.value)} required>
                  <option value="">Select job role…</option>
                  {jobRoles.map(r => <option key={r._id} value={r._id}>{r.name} ({r.skills.map(s=>s.name).join(", ")})</option>)}
                </select>
                {jobRoles.length === 0 && (
                  <p className="muted" style={{marginTop:"0.4rem"}}>No job roles defined yet — create one on the Job Roles page.</p>
                )}
              </>
            )}
          </div>

          <div className="row-2">
            <div className="form-group">
              <label>Date</label>
              <DatePicker value={form.scheduledDate} onChange={(v)=>set("scheduledDate",v)} min={new Date().toISOString().slice(0,10)} />
            </div>
            <div className="form-group">
              <label>Time</label>
              <TimePicker value={form.scheduledTime} onChange={(v)=>set("scheduledTime",v)} />
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
