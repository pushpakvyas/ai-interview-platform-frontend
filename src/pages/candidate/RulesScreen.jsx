import { useParams, useNavigate } from "react-router-dom";
import BackButton from "../../components/common/BackButton.jsx";

export default function RulesScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  return (
    <div className="flow-page">
      <div className="flow-card">
        <div className="flow-progress">
          <div className="flow-dot" /><div className="flow-dot active" /><div className="flow-dot" />
        </div>
        <h1>Rules & Guidelines</h1>
        <p className="flow-subtitle">Please read and follow these rules for a fair interview.</p>
        <div className="flow-steps">
          {[
            ["📷","Camera must be on","Keep your face clearly visible in the frame at all times."],
            ["🔇","Quiet environment","Find a quiet, well-lit space. Avoid background noise."],
            ["👤","Sit alone","No other people should be visible in the frame."],
            ["🚫","No tab switching","Switching tabs or minimizing the window counts as a violation."],
            ["📋","No copy-paste","Copy and paste are disabled during the interview."],
            ["🛠️","DevTools closed","Opening browser developer tools will trigger a warning."],
          ].map(([icon, title, desc]) => (
            <div className="flow-step" key={title}>
              <span className="flow-step-icon">{icon}</span>
              <div className="flow-step-text"><strong>{title}</strong>{desc}</div>
            </div>
          ))}
        </div>
        <div className="warning-rules">
          <strong>⚠️ Warning system:</strong> You have a maximum of <strong>3 warnings</strong>. Violations include: face not detected, multiple faces, looking away, leaving your seat, switching tabs, or opening DevTools. After 3 warnings, <strong>your interview ends automatically</strong>.
        </div>
        <div className="flow-actions">
          <BackButton to={`/candidate/interview/${id}/welcome`} />
          <button className="btn btn-primary" onClick={() => navigate(`/candidate/interview/${id}/acknowledge`)}>Next →</button>
        </div>
      </div>
    </div>
  );
}
