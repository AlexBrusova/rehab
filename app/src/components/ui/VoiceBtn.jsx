import { useState, useRef } from "react";
import { C } from "../../data/constants";

export default function VoiceBtn({ onTranscript }) {
  const [recording, setRecording] = useState(false);
  const [secs, setSecs] = useState(0);
  const ref = useRef(null);
  const toggle = () => {
    if (recording) {
      clearInterval(ref.current);
      setRecording(false);
      setSecs(0);
      if (onTranscript)
        onTranscript("[Recorded text: Voice summary auto-transcribed]");
    } else {
      setRecording(true);
      ref.current = setInterval(() => setSecs((s) => s + 1), 1000);
    }
  };
  return (
    <button
      onClick={toggle}
      style={{
        padding: "5px 12px",
        borderRadius: 8,
        background: recording
          ? "#c0392b"
          : `linear-gradient(135deg,${C.teal},${C.tealLt})`,
        color: "#fff",
        border: "none",
        cursor: "pointer",
        fontSize: 12,
        fontWeight: 700,
        fontFamily: "inherit",
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
      }}
    >
      {recording ? `⏹ Stop ${secs}s` : "🎤 Record"}
    </button>
  );
}
