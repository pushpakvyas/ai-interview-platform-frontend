import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchStatsRequest } from "../../store/slices/adminSlice.js";
import Spinner from "../../components/common/Spinner.jsx";
import TableLoadingRow from "../../components/common/TableLoadingRow.jsx";

const NAV = [
  { to:"/admin/candidates", icon:"👥", label:"Candidates", desc:"View and manage all registered candidates" },
  { to:"/admin/interviews", icon:"📋", label:"Interviews", desc:"Browse, filter, and manage scheduled interviews" },
  { to:"/admin/schedule",   icon:"📅", label:"Schedule Interview", desc:"Set up a new technical interview for a candidate" },
  { to:"/admin/templates",  icon:"⚙️", label:"Tech Templates", desc:"Manage AI interviewer prompts per technology" },
];

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const { stats, statsStatus, recentInterviews } = useSelector((s) => s.admin);

  useEffect(() => { dispatch(fetchStatsRequest()); }, [dispatch]);

  return (
    <div>
      <p className="page-title">Admin Dashboard</p>
      <p className="page-subtitle">Platform overview and quick actions</p>

      <div className="stats-grid">
        {stats ? [
          ["👤","Total Candidates", stats.totalCandidates],
          ["🗓️","Scheduled", stats.scheduledInterviews],
          ["✅","Completed", stats.completedInterviews],
          ["⚠️","Overdue", stats.pendingInterviews],
        ].map(([icon, label, val]) => (
          <div className="stat-card" key={label}>
            <div className="stat-icon">{icon}</div>
            <div className="stat-label">{label}</div>
            <div className="stat-value">{val}</div>
          </div>
        )) : [1,2,3,4].map(i => <div className="stat-card" key={i}><div className="stat-label">Loading…</div><div className="stat-value"><Spinner size={18} /></div></div>)}
      </div>

      <div className="section-header"><span className="section-title">Quick Actions</span></div>
      <div className="action-card-grid">
        {NAV.map(n => (
          <Link key={n.to} to={n.to} className="action-card">
            <span className="action-card-icon">{n.icon}</span>
            <div className="action-card-body">
              <div className="action-card-title">{n.label}</div>
              <div className="action-card-desc">{n.desc}</div>
            </div>
            <span className="action-card-arrow">→</span>
          </Link>
        ))}
      </div>

      <div className="section-header" style={{marginTop:"2rem"}}>
        <span className="section-title">Recent Interviews</span>
        <Link to="/admin/interviews" className="muted">View all →</Link>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Candidate</th><th>Technology</th><th>Date</th><th>Time</th><th>Status</th><th>Score</th></tr></thead>
          <tbody>
            {statsStatus === "loading" ? <TableLoadingRow colSpan={6} />
              : recentInterviews.length === 0 ? <tr><td colSpan={6} className="loading">No interviews scheduled yet</td></tr>
              : recentInterviews.map(iv => (
                <tr key={iv._id}>
                  <td><strong>{iv.candidate?.firstName} {iv.candidate?.lastName}</strong></td>
                  <td>{iv.technology}</td>
                  <td>{new Date(iv.scheduledDate).toDateString()}</td>
                  <td>{iv.scheduledTime}</td>
                  <td><span className={`badge badge-${iv.status.toLowerCase()}`}>{iv.status}</span></td>
                  <td>{iv.score ? <span className="score-pill">{iv.score.overallScore}/100</span> : "—"}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
