import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import apiClient from "../../api/axiosClient.js";
import BackButton from "../../components/common/BackButton.jsx";
import PageLoader from "../../components/common/PageLoader.jsx";

function ScoreBar({ label, val, max }) {
  const pct = Math.round((val / max) * 100);
  const color = pct >= 70 ? "var(--green)" : pct >= 40 ? "var(--amber)" : "var(--red)";
  return (
    <div style={{ marginBottom:"0.6rem" }}>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.8rem", marginBottom:"0.25rem" }}>
        <span style={{ color:"var(--text-2)" }}>{label}</span>
        <span style={{ fontFamily:"var(--font-mono)", color }}>{val}/{max}</span>
      </div>
      <div style={{ background:"var(--surface-3)", borderRadius:99, height:6, overflow:"hidden" }}>
        <div style={{ width:`${pct}%`, height:"100%", background:color, borderRadius:99, transition:"width 0.8s ease" }} />
      </div>
    </div>
  );
}

export default function InterviewReport() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiClient.get(`/reports/${id}`)
      .then((r) => setReport(r.data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load report."));
  }, [id]);

  if (error) return <p className="error-banner">{error}</p>;
  if (!report) return <PageLoader label="Loading report…" />;

  const { interview } = report;
  const score = interview.score;

  return (
    <div>
      <BackButton to="/candidate" label="← Back to Dashboard" />
      <div style={{ display:"flex", gap:"0.75rem", alignItems:"center", marginBottom:"1.5rem" }}>
        <p className="page-title" style={{margin:0}}>Interview Report</p>
        {/* <button className="btn btn-ghost btn-sm" onClick={()=>window.open(`${import.meta.env.VITE_API_URL}/reports/${id}/pdf`,"_blank")}>⬇ Download PDF</button> */}
      </div>

      {interview.terminatedForViolation && (
        <div className="error-banner" style={{marginBottom:"1rem"}}>⚠️ This interview was terminated early due to anti-cheat violations ({interview.warningsCount} warnings). No evaluation was performed.</div>
      )}

      <div className="report-section">
        <h3>Overview</h3>
        <div className="info-grid">
          {[
            ["Technology", interview.technology],
            ["Difficulty", interview.difficulty],
            ["Date", new Date(interview.scheduledDate).toDateString()],
            ["Status", interview.status],
            ["Duration", interview.duration ? `${interview.duration} min` : "—"],
          ].map(([lbl, val]) => (
            <div className="info-row" key={lbl}><span className="lbl">{lbl}</span><span className="val">{val||"—"}</span></div>
          ))}
        </div>
      </div>

      {score && (
        <div className="report-section">
          <h3>Scores</h3>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"2rem" }}>
            <div>
              <ScoreBar label="Technical Knowledge" val={score.technicalKnowledge} max={100} />
              <ScoreBar label="Communication" val={score.communication} max={100} />
              <ScoreBar label="Domain Knowledge" val={score.domainKnowledge} max={100} />
              <ScoreBar label="Confidence" val={score.confidence} max={100} />
              <ScoreBar label="Clarity" val={score.clarity} max={100} />
            </div>
            <div>
              <div style={{ textAlign:"center", padding:"1rem", background:"var(--surface-2)", borderRadius:"var(--radius)", marginBottom:"1rem" }}>
                <div className="metric-label">Overall Score</div>
                <div className={`metric-value ${score.overriddenByAdmin?(score.overriddenScore>=70?"high":score.overriddenScore>=40?"mid":"low"):(score.overallScore>=70?"high":score.overallScore>=40?"mid":"low")}`} style={{fontSize:"2.5rem"}}>
                  {score.overriddenByAdmin ? score.overriddenScore : score.overallScore}
                  <span style={{fontSize:"1rem",opacity:0.5}}>/100</span>
                </div>
              </div>
              <div style={{ textAlign:"center" }}>
                <div className="metric-label" style={{marginBottom:"0.4rem"}}>Recommendation</div>
                <span className={`badge badge-${(score.hiringRecommendation||"").toLowerCase().replace(" ","-")}`} style={{fontSize:"0.85rem",padding:"0.3rem 0.9rem"}}>
                  {score.hiringRecommendation}
                </span>
              </div>
            </div>
          </div>

          <hr className="divider" />
          <div className="feedback-label">AI Feedback</div>
          <div className="feedback-box">{score.aiFeedback}</div>

          {score.strengths?.length > 0 && <>
            <div className="feedback-label">Strengths</div>
            <div className="feedback-box">{score.strengths.map((s,i) => <div key={i}>✅ {s}</div>)}</div>
          </>}
          {score.weaknesses?.length > 0 && <>
            <div className="feedback-label">Weaknesses</div>
            <div className="feedback-box">{score.weaknesses.map((w,i) => <div key={i}>⚠️ {w}</div>)}</div>
          </>}
          {score.improvementSuggestions?.length > 0 && <>
            <div className="feedback-label">Areas of Improvement</div>
            <div className="feedback-box">{score.improvementSuggestions.map((s,i) => <div key={i}>💡 {s}</div>)}</div>
          </>}
        </div>
      )}
    </div>
  );
}
