import { useEffect, useRef } from "react";

// face-api.js (and the TensorFlow.js core it bundles), plus the embedded
// model weight data, are only needed by this hook — both are dynamically
// imported so they become their own lazy-loaded chunks instead of bloating
// the main app bundle that every page (login, dashboards, etc.) downloads.
// They're fetched once, only when a live interview actually starts.
let faceapiPromise = null;
function getFaceapi() {
  if (!faceapiPromise) faceapiPromise = import("face-api.js");
  return faceapiPromise;
}

let weightsDataPromise = null;
function getWeightsData() {
  if (!weightsDataPromise) weightsDataPromise = import("./faceDetectionModelWeights.js");
  return weightsDataPromise;
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

// Loads the TinyFaceDetector purely from the embedded bytes in
// faceDetectionModelWeights.js, using face-api.js/TensorFlow.js's own
// weight-loading functions (tf.io.weightsLoaderFactory + loadFromWeightMap)
// with an in-memory "fetch" that just returns the already-embedded
// ArrayBuffer instead of making an HTTP request or reading from disk. This
// is the same mechanism face-api.js's own loadFromDisk() uses internally
// (reading bytes from disk instead of the network) — here the bytes come
// from memory instead of disk or network.
let modelsPromise = null;
function loadModels(faceapi) {
  if (!modelsPromise) {
    modelsPromise = getWeightsData().then(({ TINY_FACE_DETECTOR_MANIFEST, TINY_FACE_DETECTOR_WEIGHTS_B64 }) => {
      const weightsArrayBuffer = base64ToArrayBuffer(TINY_FACE_DETECTOR_WEIGHTS_B64);
      const fetchWeightsFromMemory = async (filePaths) => filePaths.map(() => weightsArrayBuffer);
      const loadWeights = faceapi.tf.io.weightsLoaderFactory(fetchWeightsFromMemory);
      return loadWeights(TINY_FACE_DETECTOR_MANIFEST, "").then((weightMap) => {
        faceapi.nets.tinyFaceDetector.loadFromWeightMap(weightMap);
      });
    });
  }
  return modelsPromise;
}

/**
 * Scans the candidate's camera feed every few seconds for:
 *  - MULTIPLE_FACES — more than one face in frame (e.g. someone else in the
 *    room, or a phone/second screen showing a face), flagged as a violation.
 *  - FACE_MISSING — no face in frame at all (candidate stepped away).
 *
 * Violations are "edge-triggered": onViolation fires once when the problem
 * starts, not on every 3s tick while it persists, so one sustained issue
 * counts as one warning rather than rapidly burning through the 3-warning
 * limit. It fires again if the situation clears and then recurs.
 */
export default function useFaceDetection({ active, videoRef, onViolation }) {
  const intervalRef = useRef(null);
  const readyRef = useRef(false);
  const faceapiRef = useRef(null);
  const multipleFlaggedRef = useRef(false);
  const missingStreakRef = useRef(0);
  const missingFlaggedRef = useRef(false);

  useEffect(() => {
    if (!active || !videoRef.current) return;
    let cancelled = false;

    getFaceapi()
      .then((faceapi) => loadModels(faceapi).then(() => faceapi))
      .then((faceapi) => { if (!cancelled) { faceapiRef.current = faceapi; readyRef.current = true; } })
      .catch((err) => {
        console.warn("Face detection models failed to load — multi-face/face-missing checks are disabled for this session.", err);
      });

    intervalRef.current = setInterval(async () => {
      if (!readyRef.current || !videoRef.current || videoRef.current.readyState < 2) return;
      const faceapi = faceapiRef.current;
      if (!faceapi) return;
      try {
        const detections = await faceapi.detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
        );

        if (detections.length > 1) {
          missingStreakRef.current = 0; missingFlaggedRef.current = false;
          if (!multipleFlaggedRef.current) {
            multipleFlaggedRef.current = true;
            onViolation("MULTIPLE_FACES", `${detections.length} faces detected in frame`);
          }
        } else if (detections.length === 0) {
          multipleFlaggedRef.current = false;
          missingStreakRef.current += 1;
          // Require two consecutive misses (~6s) before flagging, so a brief
          // look-down or a camera hiccup doesn't trigger a false warning.
          if (missingStreakRef.current >= 2 && !missingFlaggedRef.current) {
            missingFlaggedRef.current = true;
            onViolation("FACE_MISSING", "No face detected in frame");
          }
        } else {
          // Exactly one face — everything's fine, reset both flags so a
          // future recurrence can be flagged again.
          multipleFlaggedRef.current = false;
          missingStreakRef.current = 0;
          missingFlaggedRef.current = false;
        }
      } catch {
        // Ignore transient per-frame errors (e.g. video not ready yet) —
        // don't let a one-off failure spam violations.
      }
    }, 3000);

    return () => { cancelled = true; clearInterval(intervalRef.current); };
  }, [active, videoRef, onViolation]);
}
