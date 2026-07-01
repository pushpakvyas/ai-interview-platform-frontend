import { useEffect, useRef } from "react";

/**
 * PLACEHOLDER for face/multi-face detection.
 *
 * Real face detection requires a model library such as face-api.js or
 * MediaPipe Face Detection running against the candidate's <video> element.
 * This hook is wired up with the correct lifecycle (interval scan of the
 * video element) so you can drop in a real detector without restructuring
 * the interview flow. Install face-api.js, load its tiny face detector
 * model, then replace the TODO below with real inference.
 *
 * npm install face-api.js
 * (and serve the model weights from /public/models — see face-api.js docs)
 */
export default function useFaceDetection({ active, videoRef, onViolation }) {
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!active || !videoRef.current) return;

    intervalRef.current = setInterval(async () => {
      // TODO: replace with real face-api.js / MediaPipe inference, e.g.:
      // const detections = await faceapi.detectAllFaces(videoRef.current, ...);
      // if (detections.length === 0) onViolation('FACE_MISSING', 'No face detected');
      // if (detections.length > 1) onViolation('MULTIPLE_FACES', `${detections.length} faces detected`);
    }, 5000);

    return () => clearInterval(intervalRef.current);
  }, [active, videoRef, onViolation]);
}
