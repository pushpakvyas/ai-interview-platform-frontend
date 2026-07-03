import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchInterviewsRequest, cancelInterviewRequest, fetchCandidatesRequest } from "../../store/slices/adminSlice.js";
import BackButton from "../../components/common/BackButton.jsx";
import TableLoadingRow from "../../components/common/TableLoadingRow.jsx";
import { statusLabel, statusBadgeClass } from "../../utils/status.js";

const STATUS_OPTIONS = ["","SCHEDULED","RESCHEDULED","IN_PROGRESS","COMPLETED","CANCELLED","EXPIRED"];

export default function InterviewList() {
  const dispatch = useDispatch();
  const { interviews, interviewsStatus, candidates } = useSelector((s) => s.admin);
  const [statusFilter, setStatusFilter] = useState("");
  const [candidateFilter, setCandidateFilter] = useState("");

  useEffect(() => {
    dispatch(fetchCandidatesRequest({ limit: 200 }));
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchInterviewsRequest({ status: statusFilter || undefined, candidate: candidateFilter || undefined }));
  }, [dispatch, statusFilter, candidateFilter]);

  const handleCancel = (id) => {
    const reason = window.prompt("Cancellation reason:");
    if (!reason) return;
    dispatch(cancelInterviewRequest({ id, reason }));
  };

  return (
    <div>
      <BackButton to="/admin" />
      <p className="page-title">Interviews</p>
      <p className="page-subtitle">View and manage all interviews</p>
      <div className="search-row">
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s?statusLabel(s):"All Statuses"}</option>)}
        </select>
        <select value={candidateFilter} onChange={e=>setCandidateFilter(e.target.value)}>
          <option value="">All Candidates</option>
          {candidates.map(c => <option key={c._id} value={c._id}>{c.firstName} {c.lastName} — {c.email}</option>)}
        </select>
        <button className="btn btn-ghost" onClick={() => dispatch(fetchInterviewsRequest({ status: statusFilter || undefined, candidate: candidateFilter || undefined }))}>Refresh</button>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Candidate</th><th>Technology</th><th>Date</th><th>Time</th><th>Status</th><th>Score</th><th>Actions</th></tr></thead>
          <tbody>
            {interviewsStatus === "loading" ? <TableLoadingRow colSpan={7} />
              : interviews.length === 0 ? <tr><td colSpan={7} className="loading">No interviews found</td></tr>
              : interviews.map(iv => (
                <tr key={iv._id}>
                  <td><strong>{iv.candidate?.firstName} {iv.candidate?.lastName}</strong><br/><span className="muted">{iv.candidate?.email}</span></td>
                  <td>{iv.technology}</td>
                  <td>{new Date(iv.scheduledDate).toDateString()}</td>
                  <td>{iv.scheduledTime}</td>
                  <td>
                    <span className={`badge ${statusBadgeClass(iv.status)}`}>{statusLabel(iv.status)}</span>
                    {iv.terminatedForViolation && <span className="badge badge-cancelled" style={{marginLeft:4}}>Violation</span>}
                  </td>
                  <td>{iv.score ? <span className="score-pill">{iv.score.overallScore}/100</span> : "—"}</td>
                  <td>
                    <div className="action-cell">
                      {iv.status==="COMPLETED" && <Link className="btn btn-ghost btn-sm" to={`/admin/reports/${iv._id}`}>Report</Link>}
                      {["SCHEDULED","RESCHEDULED"].includes(iv.status) && <button className="btn btn-sm" style={{background:"var(--red-dim)",color:"var(--red)",border:"none"}} onClick={()=>handleCancel(iv._id)}>Cancel</button>}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
