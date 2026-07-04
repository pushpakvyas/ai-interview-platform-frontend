import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../../api/axiosClient.js";
import useAntiCheat from "../../components/interview/useAntiCheat.js";
import useFaceDetection from "../../components/interview/useFaceDetection.js";

function stripMarkdown(text) {
  if (!text) return text;
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/`{1,3}(.*?)`{1,3}/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .trim();
}

function escapeHtml(t) {
  return t.replace(
    /[&<>"']/g,
    (m) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        m
      ],
  );
}

const VOICE_PROFILES = {
  "en-IN-female": {
    label: "Indian Female",
    langs: ["en-in"],
    nameHints: ["heera", "veena", "raveena", "neerja", "indian", "india"],
    excludeHints: ["male", "ravi", "prabhat"],
    pitch: 1.08,
    rate: 0.95,
  },
  "en-IN-male": {
    label: "Indian Male",
    langs: ["en-in"],
    nameHints: ["ravi", "prabhat", "indian", "india"],
    excludeHints: ["female", "heera", "veena", "raveena", "neerja"],
    pitch: 0.88,
    rate: 0.95,
  },
  "en-US-female": {
    label: "US Female",
    langs: ["en-us"],
    nameHints: [
      "samantha",
      "zira",
      "aria",
      "jenny",
      "female",
      "google us english",
    ],
    excludeHints: ["male", "david", "guy", "mark"],
    pitch: 1.05,
    rate: 0.95,
  },
  "en-US-male": {
    label: "US Male",
    langs: ["en-us"],
    nameHints: ["david", "guy", "mark", "male"],
    excludeHints: ["female", "samantha", "zira", "aria", "jenny"],
    pitch: 0.9,
    rate: 0.95,
  },
};

function pickVoiceForProfile(voices, profile) {
  if (!voices.length) return null;
  const hasHint = (v, hints) =>
    hints.some((h) => v.name.toLowerCase().includes(h));
  const notExcluded = voices.filter((v) => !hasHint(v, profile.excludeHints));
  const matchesLang = (v) =>
    profile.langs.includes((v.lang || "").toLowerCase().replace("_", "-"));
  const matchesName = (v) => hasHint(v, profile.nameHints);

  return (
    notExcluded.find((v) => matchesLang(v) && matchesName(v)) ||
    notExcluded.find((v) => matchesLang(v)) ||
    notExcluded.find((v) => matchesName(v)) ||
    notExcluded.find((v) => (v.lang || "").toLowerCase().startsWith("en")) ||
    voices.find((v) => (v.lang || "").toLowerCase().startsWith("en")) ||
    voices[0]
  );
}

export default function LiveInterview() {
  const { id: interviewId } = useParams();
  const navigate = useNavigate();

  const [statusState, setStatusState] = useState("idle");
  const [statusMsg, setStatusMsg] = useState(
    'Click "Start Interview" to begin',
  );
  const [aiLabel, setAiLabel] = useState("Waiting to connect");
  const [timeLeft, setTimeLeft] = useState(1800);
  const [transcript, setTranscript] = useState([]);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [warnings, setWarnings] = useState(0);
  const [violationMsg, setViolationMsg] = useState("");
  const [audioShareMissing, setAudioShareMissing] = useState(false);
  const [voiceType, setVoiceType] = useState(
    () => localStorage.getItem("aiVoiceType") || "en-US-female",
  );

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const displayStreamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const transcriptRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const timerRef = useRef(null);
  const silenceRef = useRef(null);
  const noSpeechRef = useRef(null);
  const finalRef = useRef("");
  const isListeningRef = useRef(false);
  const logRef = useRef("");
  const historyRef = useRef([]);
  const questionIdRef = useRef(null);
  const voicesRef = useRef([]);
  const timeLeftRef = useRef(1800);
  const turnIdRef = useRef(0);
  const startListeningRef = useRef(() => {});
  const voiceTypeRef = useRef(voiceType);

  useEffect(() => {
    const load = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };
    window.speechSynthesis.onvoiceschanged = load;
    load();
    const t = setTimeout(load, 800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    voiceTypeRef.current = voiceType;
    localStorage.setItem("aiVoiceType", voiceType);
  }, [voiceType]);

  useEffect(() => {
    if (transcriptRef.current)
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
  }, [transcript]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  const addLine = useCallback((speaker, text, questionId) => {
    setTranscript((p) => [...p, { speaker, text, questionId }]);
    logRef.current += `${speaker === "AI" ? "Interviewer" : "Candidate"}: ${text}\n`;
  }, []);

  const speak = useCallback((text) => {
    if (!text) return;
    synthRef.current.cancel();
    const u = new SpeechSynthesisUtterance(text);
    // Prefer higher-quality neural/online voices when installed — the default
    // "first English voice" pick often lands on a low-quality robotic one.
    const profile =
      VOICE_PROFILES[voiceTypeRef.current] || VOICE_PROFILES["en-US-female"];
    const v = pickVoiceForProfile(voicesRef.current, profile);
    u.rate = profile.rate;
    u.pitch = profile.pitch;
    if (v) u.voice = v;
    u.onstart = () => {
      setIsAiSpeaking(true);
      setAiLabel("Speaking…");
      setStatusState("speaking");
      setStatusMsg("AI Interviewer is speaking…");
    };
    u.onend = () => {
      setIsAiSpeaking(false);
      setAiLabel("Listening");
      setStatusState("listening");
      // Realistic turn-taking: the candidate's turn starts automatically as
      // soon as the AI stops talking — no manual button press needed. The
      // "Speak Answer" button remains as a manual fallback/restart control.
      startListeningRef.current();
    };
    synthRef.current.speak(u);
  }, []);

  const stopTracks = useCallback(() => {
    if (mediaRecorderRef.current?.state !== "inactive")
      mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    displayStreamRef.current?.getTracks().forEach((t) => t.stop());
    displayStreamRef.current = null;
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed")
      audioCtxRef.current.close();
    audioCtxRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const uploadRecording = useCallback(async () => {
    if (!recordedChunksRef.current.length) return;
    const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
    const fd = new FormData();
    fd.append("video", blob, "recording.webm");
    try {
      await apiClient.post(`/interviews/${interviewId}/recording`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } catch (e) {
      console.error("Recording upload failed", e);
    }
  }, [interviewId]);

  const endSession = useCallback(async () => {
    clearInterval(timerRef.current);
    recognitionRef.current?.stop();
    synthRef.current.cancel();
    clearTimeout(silenceRef.current);
    clearTimeout(noSpeechRef.current);
    stopTracks();
    setSessionEnded(true);
    setIsMicActive(false);
    setIsAiSpeaking(false);
    setStatusMsg("Calculating your score…");
    setStatusState("connecting");

    try {
      await apiClient.post(`/interviews/${interviewId}/end`, {
        textTranscript: logRef.current,
      });
      setStatusMsg("Interview complete");
      setStatusState("connected");
      await uploadRecording();
    } catch (e) {
      console.error(e);
    } finally {
      navigate(`/candidate/interview/${interviewId}/report`);
    }
  }, [interviewId, stopTracks, uploadRecording, navigate]);

  const handleViolation = useCallback(
    async (type, details) => {
      if (!sessionStarted || sessionEnded) return;
      try {
        const { data } = await apiClient.post(
          `/interviews/${interviewId}/violation`,
          { type, details },
        );
        setWarnings(data.warningsCount);
        setViolationMsg(
          `Warning ${data.warningsCount}/3: ${type.replace(/_/g, " ")}`,
        );
        setTimeout(() => setViolationMsg(""), 4000);
        if (data.terminated) endSession();
      } catch (e) {
        console.error(e);
      }
    },
    [interviewId, sessionStarted, sessionEnded, endSession],
  );

  useAntiCheat({
    active: sessionStarted && !sessionEnded,
    onViolation: handleViolation,
  });
  useFaceDetection({
    active: sessionStarted && !sessionEnded,
    videoRef,
    onViolation: handleViolation,
  });

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((p) => {
        if (p <= 1) {
          clearInterval(timerRef.current);
          endSession();
          return 0;
        }
        return p - 1;
      });
    }, 1000);
  }, [endSession]);

  // Fires 2s after the candidate's last detected word — this is the
  // "they've finished talking, send the answer" timer. It's only ever
  // (re)started once actual speech has been detected (see rec.onresult and
  // startListening below), never on an empty mic.
  const resetSilence = useCallback(() => {
    clearTimeout(silenceRef.current);
    silenceRef.current = setTimeout(() => {
      if (recognitionRef.current && isListeningRef.current)
        recognitionRef.current.stop();
    }, 2000);
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || sessionEnded || isListeningRef.current)
      return;
    finalRef.current = "";
    isListeningRef.current = true;
    setIsMicActive(true);
    setStatusMsg("Listening… (2s silence = send)");
    setStatusState("listening");
    recognitionRef.current.start();
    clearTimeout(silenceRef.current);
    clearTimeout(noSpeechRef.current);
    // Grace period to let the candidate collect their thoughts before
    // saying anything — the 2s "send on silence" timer only starts once
    // speech is actually detected (see rec.onresult). This timeout is just
    // a safety net so the mic doesn't stay open forever if nobody speaks.
    noSpeechRef.current = setTimeout(() => {
      if (recognitionRef.current && isListeningRef.current)
        recognitionRef.current.stop();
    }, 12000);
  }, [sessionEnded]);

  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  // Lets the candidate redo their answer to the most recent AI question —
  // e.g. if they feel their last answer wasn't good. Clicking that line:
  //  1. stops whatever's currently happening (TTS / listening),
  //  2. discards anything said/asked after that question (so the AI
  //     doesn't end up responding to two different answers to the same
  //     question), and
  //  3. reopens the mic for a fresh answer to that exact question.
  const redoLatestQuestion = useCallback(() => {
    if (!sessionStarted || sessionEnded) return;
    let idx = -1;
    for (let i = transcript.length - 1; i >= 0; i--) {
      if (transcript[i].speaker === "AI") {
        idx = i;
        break;
      }
    }
    if (idx === -1) return;

    turnIdRef.current++; // invalidate any in-flight AI response for the old answer
    synthRef.current.cancel();
    clearTimeout(silenceRef.current);
    clearTimeout(noSpeechRef.current);
    finalRef.current = ""; // prevent the imminent recognition.stop() below from auto-submitting stale text
    if (isListeningRef.current) recognitionRef.current?.stop();

    setTranscript((t) => t.slice(0, idx + 1));
    historyRef.current = historyRef.current.slice(0, idx + 1);
    questionIdRef.current = transcript[idx].questionId ?? questionIdRef.current;
    setIsAiSpeaking(false);
    setStatusMsg("Answer again — listening…");
    setStatusState("listening");
    setTimeout(() => startListening(), 150);
  }, [transcript, sessionStarted, sessionEnded, startListening]);

  const startInterview = useCallback(async () => {
    setSessionStarted(true);
    setStatusMsg("Accessing camera & microphone…");
    setStatusState("connecting");
    try {
      // Ask for full-tab capture FIRST, while the click that triggered this
      // handler still counts as "recent user activation" — some browsers
      // refuse getDisplayMedia() if too much async work happened first.
      // This is what makes the recording show the whole page (AI panel,
      // transcript, candidate panel) instead of just the webcam, and — if
      // the candidate leaves "Share tab audio" checked in the picker — also
      // captures the AI interviewer's spoken audio, which a plain
      // getUserMedia() mic stream never could.
      let displayStream = null;
      try {
        displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
          preferCurrentTab: true,
          selfBrowserSurface: "include",
        });
        displayStreamRef.current = displayStream;
        // Browsers only include tab audio if the candidate left "Share tab
        // audio" checked in the picker — there's no way to require it
        // programmatically, so just surface it clearly if it's missing.
        setAudioShareMissing(displayStream.getAudioTracks().length === 0);
      } catch (err) {
        console.warn(
          "Full-page recording not available/permitted, falling back to camera-only recording:",
          err.message,
        );
        setAudioShareMissing(true);
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      // Build the stream that actually gets recorded: the full-tab video
      // (if we got it) plus a mix of the candidate's mic and the tab's own
      // audio output, so both sides of the conversation end up in one file.
      let recorderStream = stream;
      if (displayStream) {
        try {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          const audioCtx = new AudioCtx();
          audioCtxRef.current = audioCtx;
          const dest = audioCtx.createMediaStreamDestination();
          if (stream.getAudioTracks().length) {
            audioCtx
              .createMediaStreamSource(new MediaStream(stream.getAudioTracks()))
              .connect(dest);
          }
          if (displayStream.getAudioTracks().length) {
            audioCtx
              .createMediaStreamSource(
                new MediaStream(displayStream.getAudioTracks()),
              )
              .connect(dest);
          }
          recorderStream = new MediaStream([
            ...displayStream.getVideoTracks(),
            ...dest.stream.getAudioTracks(),
          ]);
        } catch (err) {
          console.warn(
            "Audio mixing for full-page recording failed, using camera stream instead:",
            err.message,
          );
          recorderStream = stream;
        }
        // If the candidate manually stops sharing via the browser's own
        // "Stop sharing" bar, don't leave the interview stuck — just log it,
        // the interview itself keeps running off the camera stream.
        displayStream.getVideoTracks()[0]?.addEventListener("ended", () => {
          console.warn(
            "Tab sharing was stopped; the recording from this point on will be missing full-page video.",
          );
        });
      }

      try {
        const recorder = new MediaRecorder(recorderStream, {
          mimeType: "video/webm;codecs=vp9,opus",
        });
        recordedChunksRef.current = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) recordedChunksRef.current.push(e.data);
        };
        recorder.start(1000);
        mediaRecorderRef.current = recorder;
      } catch (e) {
        console.warn("MediaRecorder failed", e);
      }

      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR)
        throw new Error("Speech Recognition not supported in this browser");
      const rec = new SR();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";
      recognitionRef.current = rec;

      rec.onresult = (e) => {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const segment = e.results[i][0].transcript;
          if (e.results[i].isFinal) {
            // Append, don't overwrite — browsers finalize speech in short
            // phrases as you talk, not just once at the very end. Wiping
            // finalRef.current here (as the old code did) discarded
            // everything said before the most recent pause.
            finalRef.current = finalRef.current
              ? `${finalRef.current} ${segment.trim()}`
              : segment.trim();
          } else {
            interim += segment;
          }
        }
        if (interim || finalRef.current) {
          clearTimeout(noSpeechRef.current);
          resetSilence();
        }
      };

      rec.onend = async () => {
        isListeningRef.current = false;
        setIsMicActive(false);
        const txt = finalRef.current.trim();
        if (txt.length > 3) {
          addLine("You", txt);
          historyRef.current.push({ role: "user", text: txt });
          setStatusMsg("AI is thinking…");
          setStatusState("connecting");
          const myTurn = ++turnIdRef.current;
          try {
            const { data } = await apiClient.post(
              `/interviews/${interviewId}/message`,
              {
                message: txt,
                history: historyRef.current,
                timeLeftSeconds: timeLeftRef.current,
                questionId: questionIdRef.current,
              },
            );
            if (myTurn !== turnIdRef.current) return; // superseded by a redo/newer turn
            const aiText = stripMarkdown(
              data.response || "Could you please repeat?",
            );
            questionIdRef.current = data.questionId;
            addLine("AI", aiText, data.questionId);
            historyRef.current.push({ role: "model", text: aiText });
            setTimeout(() => speak(aiText), 150);
          } catch (e) {
            if (myTurn !== turnIdRef.current) return;
            const fb = "Could you please repeat your answer?";
            addLine("AI", fb);
            speak(fb);
          }
        }
      };

      startTimer();
      setStatusMsg("AI is preparing…");
      setStatusState("connecting");
      const { data } = await apiClient.post(`/interviews/${interviewId}/start`);
      const greeting = stripMarkdown(
        data.greeting || "Hello! Let's begin your interview.",
      );
      questionIdRef.current = data.questionId;
      addLine("AI", greeting, data.questionId);
      historyRef.current.push({ role: "model", text: greeting });
      speak(greeting);
      setTimeLeft(data.interview.duration * 60);
      setStatusMsg(`Interview started · ${data.interview.duration} minutes`);
      setStatusState("connected");
    } catch (e) {
      console.error(e);
      setStatusMsg("Failed to start: " + e.message);
      setStatusState("error");
      setSessionStarted(false);
    }
  }, [addLine, speak, resetSilence, startTimer, interviewId]);

  useEffect(
    () => () => {
      clearInterval(timerRef.current);
      clearTimeout(silenceRef.current);
      clearTimeout(noSpeechRef.current);
      recognitionRef.current?.stop();
      synthRef.current.cancel();
      stopTracks();
    },
    [stopTracks],
  );

  const fmt = (s) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="interview-page">
      <div className="interview-top">
        {/* AI panel */}
        <div className="video-panel" style={{ background: "#0d1117" }}>
          <span className="panel-label">AI Interviewer</span>
          <div className="ai-avatar-wrap">
            <div className={`ai-ring${isAiSpeaking ? " speaking" : ""}`}>
              🤖
            </div>
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
        <span className={`timer${timeLeft <= 300 ? " warning" : ""}`}>
          {fmt(timeLeft)}
        </span>
        <span className={`warnings-pill${warnings > 0 ? " has-warnings" : ""}`}>
          ⚠️ {warnings}/3 warnings
        </span>
      </div>

      {violationMsg && (
        <div className="violation-banner">⚠️ {violationMsg}</div>
      )}

      {audioShareMissing && sessionStarted && !sessionEnded && (
        <div className="violation-banner">
          🔇 The recording won't include the AI interviewer's voice — "Share tab
          audio" wasn't enabled. Your answers are still being recorded and
          scored normally.
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginLeft: "auto" }}
            onClick={() => setAudioShareMissing(false)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Transcript */}
      <div className="transcript-panel" ref={transcriptRef}>
        {transcript.length === 0 ? (
          <div className="transcript-empty">
            Live transcript will appear here once the interview starts
          </div>
        ) : (
          transcript.map((line, i) => {
            const isAI = line.speaker === "AI";
            const isLatestQuestion =
              isAI && i === transcript.map((l) => l.speaker).lastIndexOf("AI");
            const redoable =
              isLatestQuestion && sessionStarted && !sessionEnded;
            return (
              <div
                key={i}
                className={`transcript-row ${isAI ? "row-ai" : "row-user"}`}
              >
                <div
                  className={`transcript-bubble ${isAI ? "ai" : "user"}${redoable ? " clickable" : ""}`}
                  onClick={redoable ? redoLatestQuestion : undefined}
                  title={
                    redoable
                      ? "Not happy with your answer? Click to answer this question again."
                      : undefined
                  }
                >
                  <span className="bubble-spk">
                    {isAI ? "AI Interviewer" : "You"}
                  </span>
                  <span
                    className="bubble-txt"
                    dangerouslySetInnerHTML={{ __html: escapeHtml(line.text) }}
                  />
                  {redoable && (
                    <span className="redo-hint">↺ answer again</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Controls */}
      <div className="interview-controls">
        <select
          className="btn"
          value={voiceType}
          onChange={(e) => setVoiceType(e.target.value)}
          disabled={sessionStarted}
          title="AI interviewer voice"
          aria-label="AI interviewer voice"
        >
          {Object.entries(VOICE_PROFILES).map(([key, p]) => (
            <option key={key} value={key}>
              🔊 {p.label}
            </option>
          ))}
        </select>
        <button
          className="btn btn-start"
          onClick={startInterview}
          disabled={sessionStarted}
        >
          ▶ Start
        </button>
        <button
          className="btn btn-end"
          onClick={endSession}
          disabled={!sessionStarted || sessionEnded}
        >
          ■ End
        </button>
        <button
          className={`btn btn-speak${isMicActive ? " recording" : ""}`}
          onClick={startListening}
          disabled={!sessionStarted || sessionEnded}
        >
          {isMicActive ? "🔴 Listening…" : "🎤 Speak Again"}
        </button>
      </div>
    </div>
  );
}
