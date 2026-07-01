import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BackButton from "../../components/common/BackButton.jsx";

export default function AcknowledgementScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="flow-page">
      <div className="flow-card">
        <div className="flow-progress">
          <div className="flow-dot" /><div className="flow-dot" /><div className="flow-dot active" />
        </div>
        <h1>Almost there</h1>
        <p className="flow-subtitle">Confirm that you've read and understood the interview rules before starting.</p>

        <label className="ack-box" onClick={() => setAgreed(a => !a)}>
          <input type="checkbox" checked={agreed} onChange={() => {}} />
          <span>I have read all the rules and guidelines. I agree to keep my camera and microphone on, sit alone in a quiet space, and not switch tabs or use any external resources during this interview.</span>
        </label>

        <div className="flow-actions">
          <BackButton to={`/candidate/interview/${id}/rules`} />
          <button className="btn btn-primary" disabled={!agreed} onClick={() => navigate(`/candidate/interview/${id}/live`)}>
            Start Interview →
          </button>
        </div>
      </div>
    </div>
  );
}
