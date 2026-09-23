import { useState, useEffect, useCallback, useRef } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useTracks,
  useLocalParticipant,
  useRoomContext,
  ParticipantTile,
  DisconnectButton,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { getBackendUrl } from "../../utils/auth";
import {
  FiMic,
  FiMicOff,
  FiVideo,
  FiVideoOff,
  FiPhoneOff,
  FiMessageSquare,
  FiFileText,
  FiClock,
  FiSend,
} from "react-icons/fi";

/* ------------------------------------------------------------------ */
/*  Recording badge                                                    */
/* ------------------------------------------------------------------ */
function RecordingBadge({ interviewId }) {
  const [recording, setRecording] = useState(false);
  useEffect(() => {
    let t;
    const poll = async () => {
      try {
        const r = await fetch(`${getBackendUrl()}/api/interviews/${interviewId}/recording/status`, { credentials: "include" });
        if (r.ok) { const d = await r.json(); setRecording(!!d.recording); }
      } catch {}
    };
    poll();
    t = setInterval(poll, 8000);
    return () => clearInterval(t);
  }, [interviewId]);
  if (!recording) return null;
  return (
    <span className="inline-flex items-center gap-1.5 bg-red-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
      <span className="w-2 h-2 bg-white rounded-full animate-pulse" /> REC
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Participant tile with name label                                    */
/* ------------------------------------------------------------------ */
function Tile({ trackRef, label, empty, emptyIcon }) {
  if (empty) {
    return (
      <div className="relative bg-gray-900 rounded-xl overflow-hidden border border-gray-700 flex flex-col min-h-0">
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-gray-400 p-4 text-center">
          <div className="w-14 h-14 bg-gray-800 rounded-full flex items-center justify-center mb-2">{emptyIcon}</div>
          <p className="text-sm text-gray-300">{label}</p>
        </div>
        <div className="px-3 py-1.5 bg-gray-900 border-t border-gray-800 text-xs text-gray-400">{label}</div>
      </div>
    );
  }
  return (
    <div className="relative bg-gray-900 rounded-xl overflow-hidden border border-gray-700 flex flex-col min-h-0">
      <div className="flex-1 min-h-0 bg-black">
        <ParticipantTile trackRef={trackRef} className="h-full w-full" />
      </div>
      <div className="px-3 py-1.5 bg-gray-900 border-t border-gray-800 text-xs text-white font-medium">{label}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Video stage — true 1:1 split (two equal tiles)                     */
/* ------------------------------------------------------------------ */
function VideoStage({ hideLocal }) {
  const tracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { onlySubscribed: false }
  );
  const local = tracks.find((t) => t.participant.isLocal);
  const remote = tracks.find((t) => !t.participant.isLocal);

  // When local camera is toggled off, don't render the local tile
  const showLocal = local && !hideLocal;

  if (!showLocal && !remote) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-950 text-gray-400 p-8 text-center">
        <div>
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
            <FiVideo className="w-8 h-8" />
          </div>
          <p className="text-sm text-gray-300">Waiting for camera…</p>
          <p className="text-xs text-gray-500 mt-1">Allow camera/mic when prompted</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-3 p-3 bg-black">
      {showLocal ? (
        <Tile
          trackRef={local}
          label="You"
          empty={false}
          emptyIcon={<FiVideo className="w-6 h-6 text-gray-500" />}
        />
      ) : (
        <Tile
          trackRef={null}
          label="You (camera off)"
          empty={true}
          emptyIcon={<FiVideoOff className="w-6 h-6 text-gray-500" />}
        />
      )}
      <Tile
        trackRef={remote}
        label={remote?.participant?.name || remote?.participant?.identity || "Other participant"}
        empty={!remote}
        emptyIcon={<FiVideoOff className="w-6 h-6 text-gray-500" />}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Controls — custom buttons, no TrackToggle, stable state             */
/* ------------------------------------------------------------------ */
function ControlsBar({ onLeave, micOn, camOn, toggleMic, toggleCam }) {
  return (
    <div className="bg-gray-900 border-t border-gray-800 px-4 py-3 flex items-center justify-center gap-3 shrink-0">
      <button
        onClick={toggleMic}
        className={`w-11 h-11 rounded-full flex items-center justify-center border transition-colors ${
          micOn
            ? "bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
            : "bg-red-600 text-white border-red-600 hover:bg-red-700"
        }`}
        title={micOn ? "Mute mic" : "Unmute mic"}
      >
        {micOn ? <FiMic className="w-4 h-4" /> : <FiMicOff className="w-4 h-4" />}
      </button>

      <button
        onClick={toggleCam}
        className={`w-11 h-11 rounded-full flex items-center justify-center border transition-colors ${
          camOn
            ? "bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
            : "bg-red-600 text-white border-red-600 hover:bg-red-700"
        }`}
        title={camOn ? "Turn off camera" : "Turn on camera"}
      >
        {camOn ? <FiVideo className="w-4 h-4" /> : <FiVideoOff className="w-4 h-4" />}
      </button>

      <div className="w-px h-8 bg-gray-700 mx-2" />

      <DisconnectButton
        className="!rounded-full !bg-red-600 hover:!bg-red-700 !text-white !border-red-600 !px-6 !py-2 font-medium flex items-center gap-2"
      >
        <>
          <FiPhoneOff className="w-4 h-4" /> Leave
        </>
      </DisconnectButton>

      <button onClick={onLeave} className="hidden" aria-hidden tabIndex={-1}>leave</button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Right panel — Chat + Notes (1/3 width)                              */
/* ------------------------------------------------------------------ */
function RightPanel({ interviewId }) {
  const [tab, setTab] = useState("chat");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef(null);
  const [notes, setNotes] = useState(() => {
    try { return localStorage.getItem(`video-notes-${interviewId}`) || ""; }
    catch { return ""; }
  });

  const loadMessages = useCallback(async () => {
    try {
      const r = await fetch(`${getBackendUrl()}/api/interviews/${interviewId}/conversation`, { credentials: "include" });
      if (r.ok) { const d = await r.json(); setMessages(d.conversation || []); }
    } catch {}
  }, [interviewId]);

  useEffect(() => {
    loadMessages();
    const t = setInterval(loadMessages, 5000);
    return () => clearInterval(t);
  }, [loadMessages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    try { localStorage.setItem(`video-notes-${interviewId}`, notes); } catch {}
  }, [notes, interviewId]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    try {
      await fetch(`${getBackendUrl()}/api/interviews/${interviewId}/messages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      await loadMessages();
    } catch {}
    setSending(false);
  };

  return (
    <div className="w-full lg:w-[360px] bg-white border-l border-gray-200 flex flex-col min-h-0 shrink-0">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 shrink-0">
        <button onClick={() => setTab("chat")} className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 ${tab === "chat" ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50" : "text-gray-500 hover:text-gray-700"}`}>
          <FiMessageSquare className="w-4 h-4" /> Chat
        </button>
        <button onClick={() => setTab("notes")} className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 ${tab === "notes" ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50" : "text-gray-500 hover:text-gray-700"}`}>
          <FiFileText className="w-4 h-4" /> Notes
        </button>
      </div>

      {tab === "chat" ? (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 min-h-0">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <FiMessageSquare className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-sm text-gray-500">No messages yet</p>
                <p className="text-xs text-gray-400 mt-1">Say hello to start the conversation</p>
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">{m.sender_name || (m.sender_type === "user" ? "Candidate" : "Interviewer")}</span>
                    <span className="text-[10px] text-gray-400">
                      {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">{m.content}</p>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="p-3 border-t border-gray-200 bg-white shrink-0">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button onClick={sendMessage} disabled={!input.trim() || sending} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1">
                <FiSend className="w-3.5 h-3.5" /> Send
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col p-4 bg-gray-50 min-h-0">
          <p className="text-xs text-gray-500 mb-2">Private — only you see this. Auto-saved.</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Key points, questions, strengths, concerns..."
            className="flex-1 w-full p-3 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-h-[140px]"
          />
          <p className="text-[11px] text-gray-400 mt-2">{notes.length} chars</p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Inner room — renders inside LiveKitRoom                            */
/* ------------------------------------------------------------------ */
function VideoRoomInner({ interviewId, interview, onLeave }) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const [timeLeft, setTimeLeft] = useState("");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const busyRef = useRef(false);

  // Countdown timer
  useEffect(() => {
    if (!interview?.scheduled_at || !interview?.duration_minutes) return;
    const tick = () => {
      const end = new Date(interview.scheduled_at).getTime() + interview.duration_minutes * 60000;
      const diff = end - Date.now();
      if (diff <= 0) setTimeLeft("00:00");
      else {
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${m}:${String(s).padStart(2, "0")}`);
      }
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [interview]);

  const toggleMic = useCallback(async () => {
    if (!localParticipant || busyRef.current) return;
    busyRef.current = true;
    try {
      const next = !micOn;
      await localParticipant.setMicrophoneEnabled(next);
      setMicOn(next);
    } catch (e) {
      console.warn("Mic toggle failed:", e);
    } finally {
      busyRef.current = false;
    }
  }, [localParticipant, micOn]);

  const toggleCam = useCallback(async () => {
    if (!localParticipant || busyRef.current) return;
    busyRef.current = true;
    try {
      const next = !camOn;
      await localParticipant.setCameraEnabled(next);
      setCamOn(next);
    } catch (e) {
      console.warn("Cam toggle failed:", e);
    } finally {
      busyRef.current = false;
    }
  }, [localParticipant, camOn]);

  const handleLeave = useCallback(async () => {
    try {
      await fetch(`${getBackendUrl()}/api/interviews/${interviewId}/recording/stop`, { method: "POST", credentials: "include" });
    } catch {}
    if (room) room.disconnect();
    if (onLeave) onLeave();
  }, [room, interviewId, onLeave]);

  useEffect(() => {
    if (!room) return;
    const onDisconnected = () => {
      fetch(`${getBackendUrl()}/api/interviews/${interviewId}/recording/stop`, { method: "POST", credentials: "include" }).catch(() => {});
      if (onLeave) onLeave();
    };
    room.on("disconnected", onDisconnected);
    return () => room.off("disconnected", onDisconnected);
  }, [room, interviewId, onLeave]);

  return (
    <div className="h-full flex flex-col lg:flex-row min-h-0">
      {/* Left 2/3 — split cameras + controls */}
      <div className="flex-[2] flex flex-col bg-black min-h-0 min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-900 text-white border-b border-gray-800 shrink-0">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold truncate">{interview?.title || "Video Interview"}</h2>
            <p className="text-xs text-gray-400 truncate">
              {interview?.organization || ""}{interview?.post_title ? ` · ${interview.post_title}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {timeLeft && (
              <span className="inline-flex items-center gap-1.5 bg-gray-800 text-gray-200 text-xs px-2.5 py-1 rounded-full">
                <FiClock className="w-3.5 h-3.5" /> {timeLeft}
              </span>
            )}
            <RecordingBadge interviewId={interviewId} />
          </div>
        </div>

        {/* 1:1 video split */}
        <VideoStage hideLocal={!camOn} />

        {/* Controls */}
        <ControlsBar onLeave={handleLeave} micOn={micOn} camOn={camOn} toggleMic={toggleMic} toggleCam={toggleCam} />
        <RoomAudioRenderer />
      </div>

      {/* Right 1/3 — chat + notes */}
      <RightPanel interviewId={interviewId} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Outer wrapper — consent, token fetch, LiveKitRoom                  */
/* ------------------------------------------------------------------ */
export default function VideoRoom({ interviewId, interview, onLeave }) {
  const [token, setToken] = useState(null);
  const [url, setUrl] = useState(null);
  const [consent, setConsent] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState(null);
  const [loadingToken, setLoadingToken] = useState(true);

  const fetchToken = useCallback(async () => {
    setLoadingToken(true);
    setError(null);
    try {
      const r = await fetch(`${getBackendUrl()}/api/interviews/${interviewId}/video-token`, {
        method: "POST",
        credentials: "include",
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || `Failed to get video token (${r.status})`);
      }
      const d = await r.json();
      setToken(d.token);
      setUrl(d.url);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingToken(false);
    }
  }, [interviewId]);

  useEffect(() => { fetchToken(); }, [fetchToken]);

  if (loadingToken) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
          <p className="text-sm text-gray-600">Preparing video room...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white p-6 rounded-lg shadow max-w-md w-full text-center border border-gray-200">
          <p className="text-red-600 text-sm mb-3">{error}</p>
          <p className="text-xs text-gray-500 mb-4">Video requires LiveKit on the backend and UDP 50000-50050 + 3478 open.</p>
          <button onClick={fetchToken} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">Retry</button>
        </div>
      </div>
    );
  }

  if (!joined) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="bg-white p-6 rounded-xl shadow-lg max-w-lg w-full border border-gray-200">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <FiVideo className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 text-center">Join video interview</h3>
          <p className="text-sm text-gray-600 text-center mt-1">
            {interview?.title || "Interview"} · {interview?.duration_minutes || 30} min
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-5">
            <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" /> This call is recorded
            </p>
            <p className="text-xs text-amber-700 mt-1">By joining you consent to recording. Visible only to participants and hiring managers.</p>
            <label className="flex items-start gap-2 mt-3 text-sm cursor-pointer">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
              <span>I understand and consent to recording</span>
            </label>
          </div>
          <div className="flex gap-3 mt-5">
            <button
              disabled={!consent}
              onClick={() => setJoined(true)}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
            >
              <FiVideo className="w-4 h-4" /> Join with camera & mic
            </button>
            <button onClick={onLeave} className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
              Cancel
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">Browser will ask for camera/mic permission after you join.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] bg-gray-100">
      <LiveKitRoom video audio token={token} serverUrl={url} connect onDisconnected={onLeave} className="h-full">
        <VideoRoomInner interviewId={interviewId} interview={interview} onLeave={onLeave} />
      </LiveKitRoom>
    </div>
  );
}
