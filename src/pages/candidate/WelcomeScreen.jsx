import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../../api/axiosClient.js";
import BackButton from "../../components/common/BackButton.jsx";
import PageLoader from "../../components/common/PageLoader.jsx";

const EARLY_START_GRACE_MS = 10 * 60 * 1000;

function getStartsAt(interview) {
  if (!interview) return null;
  const [hours, minutes] = interview.scheduledTime.split(":").map(Number);
  const d = new Date(interview.scheduledDate);
  d.setHours(hours, minutes, 0, 0);
  return d.getTime() - EARLY_START_GRACE_MS;
}

function formatCountdown(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return h > 0
    ? `${h}h ${m}m ${s}s`
    : `${m}m ${s}s`;
}

export default function WelcomeScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    apiClient.get(`/candidate/interviews/${id}`)
      .then((r) => setInterview(r.data.interview))
      .finally(() => setLoaded(true));
  }, [id]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const startsAt = getStartsAt(interview);
  const canStart = startsAt === null || now >= startsAt;

  if (!loaded) return <PageLoader label="Loading interview details…" />;

  return (
    <div className="flow-page">
      <div className="flow-card">
        <div className="flow-progress">
          <div className="flow-dot active" /><div className="flow-dot" /><div className="flow-dot" />
        </div>
        <h1>Ready to begin?</h1>
        <p className="flow-subtitle">Your AI-powered technical interview is about to start. Read the steps below before proceeding.</p>
        <div className="flow-steps">
          {[
            ["🎙️","Speak clearly","The AI interviewer listens to your answers via your microphone."],
            ["🤖","One question at a time","Answer each question fully — the AI asks follow-ups based on what you say."],
            ["⏱️","Manage your time","You'll see a live timer. Try to give complete but concise answers."],
            ["📊","Score at the end","When the session ends, a scorecard and hiring recommendation are generated instantly."],
          ].map(([icon, title, desc]) => (
            <div className="flow-step" key={title}>
              <span className="flow-step-icon">{icon}</span>
              <div className="flow-step-text"><strong>{title}</strong>{desc}</div>
            </div>
          ))}
        </div>
        {!canStart && (
          <div className="warning-rules">
            ⏳ This interview isn't open yet. You can begin in <strong>{formatCountdown(startsAt - now)}</strong>.
          </div>
        )}
        <div className="flow-actions">
          <BackButton to="/candidate" />
          <button className="btn btn-primary" disabled={!canStart} onClick={() => navigate(`/candidate/interview/${id}/rules`)}>Next →</button>
        </div>
      </div>
    </div>
  );
}
