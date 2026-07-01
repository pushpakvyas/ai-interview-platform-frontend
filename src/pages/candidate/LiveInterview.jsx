import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../../api/axiosClient.js";
import useAntiCheat from "../../components/interview/useAntiCheat.js";
import useFaceDetection from "../../components/interview/useFaceDetection.js";

function stripMarkdown(text) {
  if (!text) return text;
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1")
    .replace(/__(.*?)__/g, "$1").replace(/_(.*?)_/g, "$1")
    .replace(/`{1,3}(.*?)`{1,3}/g, "$1").replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "").replace(/^\s*\d+\.\s+/gm, "").trim();
}

function escapeHtml(t) {
  return t.replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[m]);
}

export default function LiveInterview() {
  const { id: interviewId } = useParams();
  const navigate = useNavigate();

  const [statusState, setStatusState] = useState("idle");
  const [statusMsg, setStatusMsg] = useState('Click "Start Interview" to begin');
  const [aiLabel, setAiLabel] = useState("Waiting to connect");
  const [timeLeft, setTimeLeft] = useState(1800);
  const [transcript, setTranscript] = useState([]);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [warnings, setWarnings] = useState(0);
  const [violationMsg, setViolationMsg] = useState("");

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const transcriptRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const timerRef = useRef(null);
  const silenceRef = useRef(null);
  const finalRef = useRef("");
  const isListeningRef = useRef(false);
  const logRef = useRef("");
  const historyRef = useRef([]);
  const questionIdRef = useRef(null);
  const voicesRef = useRef([]);
  const timeLeftRef = useRef(1800);

  useEffect(() => {
    const load = () => { voicesRef.current = window.speechSynthesis.getVoices(); };
    window.speechSynthesis.onvoiceschanged = load; load();
    const t = setTimeout(load, 800); return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (transcriptRef.current) transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
  }, [transcript]);

  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);

  const addLine = useCallback((speaker, text) => {
    setTranscript(p => [...p, { speaker, text }]);
    logRef.current += `${speaker === "AI" ? "Interviewer" : "Candidate"}: ${text}\n`;
  }, []);

  const speak = useCallback((text) => {
    if (!text) return;
    synthRef.current.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95; u.pitch = 1.02;
    // Prefer higher-quality neural/online voices when installed — the default
    // "first English voice" pick often lands on a low-quality robotic one.
    const NATURAL_VOICE_HINTS = ["Natural", "Online", "Neural", "Google", "Aria", "Jenny", "Samantha", "Zira"];
    const v =
      NATURAL_VOICE_HINTS.map(hint => voicesRef.current.find(v => v.name.includes(hint) && v.lang.includes("en")))
        .find(Boolean)
      || voicesRef.current.find(v => v.lang.includes("en"))
      || voicesRef.current[0];
    if (v) u.voice = v;
    u.onstart = () => { setIsAiSpeaking(true); setAiLabel("Speaking…"); setStatusState("speaking"); setStatusMsg("AI Interviewer is speaking…"); };
    u.onend = () => { setIsAiSpeaking(false); setAiLabel("Listening"); setStatusState("listening"); setStatusMsg('Your turn — click "Speak Answer"'); };
    synthRef.current.speak(u);
  }, []);

  const stopTracks = useCallback(() => {
    if (mediaRecorderRef.current?.state !== "inactive") mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const uploadRecording = useCallback(async () => {
    if (!recordedChunksRef.current.length) return;
    const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
    const fd = new FormData();
    fd.append("video", blob, "recording.webm");
    try { await apiClient.post(`/interviews/${interviewId}/recording`, fd, { headers: { "Content-Type": "multipart/form-data" } }); }
    catch (e) { console.error("Recording upload failed", e); }
  }, [interviewId]);

  const endSession = useCallback(async () => {
    clearInterval(timerRef.current);
    recognitionRef.current?.stop();
    synthRef.current.cancel();
    clearTimeout(silenceRef.current);
    stopTracks();
    setSessionEnded(true); setIsMicActive(false); setIsAiSpeaking(false);
    setStatusMsg("Calculating your score…"); setStatusState("connecting");

    try {
      await apiClient.post(`/interviews/${interviewId}/end`, { textTranscript: logRef.current });
      setStatusMsg("Interview complete"); setStatusState("connected");
      await uploadRecording();
    } catch (e) {
      console.error(e);
    } finally {
      navigate(`/candidate/interview/${interviewId}/report`);
    }
  }, [interviewId, stopTracks, uploadRecording, navigate]);

  const handleViolation = useCallback(async (type, details) => {
    if (!sessionStarted || sessionEnded) return;
    try {
      const { data } = await apiClient.post(`/interviews/${interviewId}/violation`, { type, details });
      setWarnings(data.warningsCount);
      setViolationMsg(`Warning ${data.warningsCount}/3: ${type.replace(/_/g, " ")}`);
      setTimeout(() => setViolationMsg(""), 4000);
      if (data.terminated) endSession();
    } catch(e) { console.error(e); }
  }, [interviewId, sessionStarted, sessionEnded, endSession]);

  useAntiCheat({ active: sessionStarted && !sessionEnded, onViolation: handleViolation });
  useFaceDetection({ active: sessionStarted && !sessionEnded, videoRef, onViolation: handleViolation });

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) { clearInterval(timerRef.current); endSession(); return 0; }
        return p - 1;
      });
    }, 1000);
  }, [endSession]);

  const resetSilence = useCallback(() => {
    clearTimeout(silenceRef.current);
    silenceRef.current = setTimeout(() => {
      if (recognitionRef.current && isListeningRef.current) recognitionRef.current.stop();
    }, 3000);
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || sessionEnded) return;
    finalRef.current = ""; isListeningRef.current = true;
    setIsMicActive(true); setStatusMsg("Listening… (3s silence = send)"); setStatusState("listening");
    recognitionRef.current.start();
  }, [sessionEnded]);

  const startInterview = useCallback(async () => {
    setSessionStarted(true); setStatusMsg("Accessing camera & microphone…"); setStatusState("connecting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      try {
        const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9,opus" });
        recordedChunksRef.current = [];
        recorder.ondataavailable = e => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
        recorder.start(1000);
        mediaRecorderRef.current = recorder;
      } catch(e) { console.warn("MediaRecorder failed", e); }

      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) throw new Error("Speech Recognition not supported in this browser");
      const rec = new SR();
      rec.continuous = true; rec.interimResults = true; rec.lang = "en-US";
      recognitionRef.current = rec;

      rec.onresult = (e) => {
        let interim = ""; finalRef.current = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) finalRef.current = e.results[i][0].transcript.trim();
          else interim = e.results[i][0].transcript;
        }
        if (interim || finalRef.current) resetSilence();
      };

      rec.onend = async () => {
        isListeningRef.current = false; setIsMicActive(false);
        const txt = finalRef.current.trim();
        if (txt.length > 3) {
          addLine("You", txt);
          historyRef.current.push({ role: "user", text: txt });
          setStatusMsg("AI is thinking…"); setStatusState("connecting");
          try {
            const { data } = await apiClient.post(`/interviews/${interviewId}/message`, {
              message: txt,
              history: historyRef.current,
              timeLeftSeconds: timeLeftRef.current,
              questionId: questionIdRef.current,
            });
            const aiText = stripMarkdown(data.response || "Could you please repeat?");
            questionIdRef.current = data.questionId;
            addLine("AI", aiText);
            historyRef.current.push({ role: "model", text: aiText });
            setTimeout(() => speak(aiText), 150);
          } catch(e) {
            const fb = "Could you please repeat your answer?";
            addLine("AI", fb); speak(fb);
          }
        }
      };

      startTimer();
      setStatusMsg("AI is preparing…"); setStatusState("connecting");
      const { data } = await apiClient.post(`/interviews/${interviewId}/start`);
      const greeting = stripMarkdown(data.greeting || "Hello! Let's begin your interview.");
      questionIdRef.current = data.questionId;
      addLine("AI", greeting);
      historyRef.current.push({ role: "model", text: greeting });
      speak(greeting);
      setTimeLeft(data.interview.duration * 60);
      setStatusMsg(`Interview started · ${data.interview.duration} minutes`);
      setStatusState("connected");
    } catch(e) {
      console.error(e); setStatusMsg("Failed to start: " + e.message); setStatusState("error");
      setSessionStarted(false);
    }
  }, [addLine, speak, resetSilence, startTimer, interviewId]);

  useEffect(() => () => { clearInterval(timerRef.current); recognitionRef.current?.stop(); synthRef.current.cancel(); stopTracks(); }, [stopTracks]);

  const fmt = s => `${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`;

  return (
    <div className="interview-page">
      <div className="interview-top">
        {/* AI panel */}
        <div className="video-panel" style={{ background: "#0d1117" }}>
          <span className="panel-label">AI Interviewer</span>
          <div className="ai-avatar-wrap">
            <div className={`ai-ring${isAiSpeaking ? " speaking" : ""}`}>🤖</div>
            <span className="ai-status">{aiLabel}</span>
          </div>
        </div>
        {/* Camera panel */}
        <div className="video-panel">
          <span className="panel-label">You</span>
          <video ref={videoRef} autoPlay playsInline muted />
          <span className={`mic-badge${isMicActive ? " active" : ""}`}>🎤</span>
        </div>
      </div>

      {/* Status */}
      <div className="status-bar">
        <div className="status-indicator">
          <span className={`status-dot ${statusState}`} />
          <span>{statusMsg}</span>
        </div>
        <span className={`timer${timeLeft <= 300 ? " warning" : ""}`}>{fmt(timeLeft)}</span>
        <span className={`warnings-pill${warnings > 0 ? " has-warnings" : ""}`}>
          ⚠️ {warnings}/3 warnings
        </span>
      </div>

      {violationMsg && <div className="violation-banner">⚠️ {violationMsg}</div>}

      {/* Transcript */}
      <div className="transcript-panel" ref={transcriptRef}>
        {transcript.length === 0
          ? <div className="transcript-empty">Live transcript will appear here once the interview starts</div>
          : transcript.map((line, i) => (
            <div key={i} className={`transcript-line ${line.speaker === "AI" ? "ai" : "user"}`}>
              <span className="spk">{line.speaker === "AI" ? "Sara" : "You"}:</span>
              <span className="txt" dangerouslySetInnerHTML={{ __html: escapeHtml(line.text) }} />
            </div>
          ))}
      </div>

      {/* Controls */}
      <div className="interview-controls">
        <button className="btn btn-start" onClick={startInterview} disabled={sessionStarted}>▶ Start</button>
        <button className="btn btn-end" onClick={endSession} disabled={!sessionStarted || sessionEnded}>■ End</button>
        <button className={`btn btn-speak${isMicActive ? " recording" : ""}`} onClick={startListening} disabled={!sessionStarted || sessionEnded}>
          {isMicActive ? "🔴 Listening…" : "🎤 Speak Answer"}
        </button>
      </div>

    </div>
  );
}
