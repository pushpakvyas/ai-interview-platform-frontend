import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchCandidateDashboardRequest } from "../../store/slices/interviewSlice.js";
import SectionLoader from "../../components/common/SectionLoader.jsx";

function statusBadge(status) {
  const map = { SCHEDULED:"badge-scheduled", RESCHEDULED:"badge-rescheduled", COMPLETED:"badge-completed", CANCELLED:"badge-cancelled" };
  return <span className={`badge ${map[status]||"badge-scheduled"}`}>{status}</span>;
}

function recBadge(rec) {
  if (!rec) return null;
  const map = { "Strong Hire":"badge-strong-hire", "Hire":"badge-hire", "Borderline":"badge-borderline", "Reject":"badge-reject" };
  return <span className={`badge ${map[rec]||""}`}>{rec}</span>;
}

export default function CandidateDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { upcoming, completed, todaysInterview, status } = useSelector(s => s.interview);
  const user = useSelector(s => s.auth.user);

  useEffect(() => { dispatch(fetchCandidateDashboardRequest()); }, [dispatch]);

  return (
    <div>
      <p className="page-title">Hello, {user?.firstName} 👋</p>
      <p className="page-subtitle">Here's your interview overview</p>

      {todaysInterview && (
        <div className="today-banner">
          <div className="today-banner-left">
            <div className="today-banner-badge">Today</div>
            <h3>{todaysInterview.technology} Interview</h3>
            <p>{todaysInterview.scheduledTime} &nbsp;·&nbsp; {todaysInterview.duration} min &nbsp;·&nbsp; {todaysInterview.difficulty}</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate(`/candidate/interview/${todaysInterview._id}/welcome`)}>
            Begin Interview →
          </button>
        </div>
      )}

      <div className="section-gap">
        <div className="section-header">
          <span className="section-title">Upcoming Interviews</span>
          <span className="muted">{upcoming.length} scheduled</span>
        </div>
        {status === "loading" ? <SectionLoader label="Loading interviews…" /> : (
          <div className="card-grid">
            {upcoming.length === 0
              ? <div className="empty-state">No upcoming interviews. An admin will schedule one for you.</div>
              : upcoming.map(iv => (
                <div className="card" key={iv._id}>
                  <p className="card-tech">{iv.technology}</p>
                  <div className="card-meta">
                    <span>📅 {new Date(iv.scheduledDate).toDateString()}</span>
                    <span>🕐 {iv.scheduledTime}</span>
                    <span>⏱ {iv.duration} min &nbsp;·&nbsp; {iv.difficulty}</span>
                  </div>
                  <div className="card-footer">
                    {statusBadge(iv.status)}
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/candidate/interview/${iv._id}/welcome`)}>
                      Open →
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="section-gap">
        <div className="section-header">
          <span className="section-title">Completed Interviews</span>
        </div>
        <div className="card-grid">
          {completed.length === 0
            ? <div className="empty-state">No completed interviews yet.</div>
            : completed.map(iv => (
              <div className="card" key={iv._id}>
                <p className="card-tech">{iv.technology}</p>
                <div className="card-meta">
                  <span>📅 {new Date(iv.endedAt || iv.scheduledDate).toDateString()}</span>
                  {iv.score && <span className="score-pill">{iv.score.overallScore}/100</span>}
                </div>
                <div className="card-footer">
                  {recBadge(iv.score?.hiringRecommendation)}
                  <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/candidate/interview/${iv._id}/report`)}>View Report</button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
