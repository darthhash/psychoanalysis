import { useState, useEffect, useRef, useCallback } from "react";
import { Send, LogOut, Eye } from "lucide-react";
import MessageBubble from "../components/MessageBubble";
import VoiceRecorder from "../components/VoiceRecorder";
import CooldownTimer from "../components/CooldownTimer";
import {
  startSession,
  sendMessage,
  exitSession,
  checkCooldown,
} from "../lib/api";

export default function Session() {
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(null);
  const [residue, setResidue] = useState(null); // post-session screen
  const [tension, setTension] = useState(0);
  const bottomRef = useRef(null);

  useEffect(() => {
    checkCooldown()
      .then((data) => {
        if (data.active) setCooldown(data.cooldown_until);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleStart = async () => {
    try {
      const s = await startSession();
      setSession(s);
      setMessages([]);
      setResidue(null);
      setTension(0);
    } catch (e) {
      if (e.status === 429) {
        setCooldown(e.detail?.cooldown_until);
      }
    }
  };

  const handleSend = async (text) => {
    const content = text || input.trim();
    if (!content || !session || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content }]);
    setLoading(true);

    try {
      const reply = await sendMessage(session.id, content);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply.message.content },
      ]);
      setTension(reply.tension || 0);

      // Session ended by analyst (interpretation or cut)
      if (reply.session_ended) {
        setSession(null);
        setResidue({
          end_type: reply.end_type,
          interpretation: reply.interpretation,
          key_signifier: reply.key_signifier,
          lastMessage: reply.message.content,
        });
        if (reply.cooldown_until) setCooldown(reply.cooldown_until);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "..." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleUserExit = async () => {
    if (!session) return;
    try {
      const s = await exitSession(session.id);
      setSession(null);
      setResidue({
        end_type: "user_exit",
        interpretation: s.interpretation,
        key_signifier: s.key_signifier,
        lastMessage: null,
      });
      if (s.cooldown_until) setCooldown(s.cooldown_until);
    } catch {}
  };

  const handleCooldownExpired = useCallback(() => {
    setCooldown(null);
  }, []);

  const dismissResidue = () => {
    setResidue(null);
  };

  // Cooldown screen
  if (cooldown && !session && !residue) {
    return (
      <div className="h-full flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <CooldownTimer
            cooldownUntil={cooldown}
            onExpired={handleCooldownExpired}
          />
        </div>
      </div>
    );
  }

  // Post-session residue screen
  if (residue && !session) {
    return (
      <div className="h-full flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-lg text-center space-y-6">
            {residue.end_type === "analyst_cut" && (
              <p className="text-xs text-[var(--muted)] uppercase tracking-widest">
                Session ended by analyst
              </p>
            )}
            {residue.end_type === "interpretation" && (
              <p className="text-xs text-[var(--muted)] uppercase tracking-widest">
                Interpretation
              </p>
            )}
            {residue.end_type === "user_exit" && (
              <p className="text-xs text-[var(--muted)] uppercase tracking-widest">
                You left the session
              </p>
            )}

            {residue.interpretation && (
              <p className="text-lg leading-relaxed italic text-violet-300">
                {residue.interpretation}
              </p>
            )}

            {residue.key_signifier && (
              <div className="mt-4">
                <p className="text-xs text-[var(--muted)] uppercase tracking-widest mb-2">
                  Key signifier
                </p>
                <p className="text-2xl font-light text-violet-200">
                  « {residue.key_signifier} »
                </p>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-[var(--border)]">
              <p className="text-sm text-[var(--muted)]">
                While you wait — record a dream or write a note.
              </p>
            </div>

            <button
              onClick={dismissResidue}
              className="mt-4 text-xs text-[var(--muted)] hover:text-[var(--fg)] transition"
            >
              dismiss
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No active session
  if (!session) {
    return (
      <div className="h-full flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <button
            onClick={handleStart}
            className="px-8 py-4 border border-[var(--border)] text-[var(--muted)] hover:text-[var(--fg)] hover:border-[var(--accent)] transition rounded-lg text-base"
          >
            Begin session
          </button>
        </div>
      </div>
    );
  }

  // Active session
  return (
    <div className="h-full flex flex-col">
      <Header>
        <div className="flex items-center gap-4">
          <TensionIndicator tension={tension} />
          <button
            onClick={handleUserExit}
            className="flex items-center gap-1.5 text-[var(--muted)] hover:text-red-400 transition text-sm"
            title="Leave session"
          >
            <LogOut size={16} />
            <span className="text-xs">leave</span>
          </button>
        </div>
      </Header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-center text-[var(--muted)] text-sm mt-20">
            Speak or type.
          </p>
        )}
        {messages.map((m, i) => (
          <MessageBubble key={i} role={m.role} content={m.content} />
        ))}
        {loading && (
          <div className="flex justify-start mb-3">
            <div className="px-5 py-3 rounded-2xl rounded-bl-sm bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] text-base">
              ...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[var(--border)]">
        <div className="flex gap-2 items-end">
          <VoiceRecorder
            onTranscript={(text) => handleSend(text)}
            disabled={loading}
          />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="..."
            disabled={loading}
            className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-5 py-3.5 text-base text-[var(--fg)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition disabled:opacity-50"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="p-4 rounded-full bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--fg)] border border-[var(--border)] transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Send size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}

function Header({ children }) {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
      <span className="text-xs tracking-widest text-[var(--muted)] uppercase">
        Session
      </span>
      {children}
    </header>
  );
}

function TensionIndicator({ tension }) {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (tension / 100) * circumference;

  const color =
    tension < 30
      ? "var(--muted)"
      : tension < 60
      ? "#8b5cf6"
      : tension < 85
      ? "#a78bfa"
      : "#ef4444";

  const label =
    tension < 15
      ? ""
      : tension < 40
      ? "surfacing..."
      : tension < 65
      ? "forming"
      : tension < 85
      ? "close"
      : "interpretation";

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex items-center justify-center" title={`Interpretation: ${tension}%`}>
        <svg width="40" height="40" className="rotate-[-90deg]">
          <circle
            cx="20"
            cy="20"
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth="2.5"
          />
          <circle
            cx="20"
            cy="20"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <Eye
          size={16}
          className="absolute transition-colors duration-1000"
          style={{ color }}
        />
      </div>
      {label && (
        <span
          className="text-xs tracking-wide transition-colors duration-1000"
          style={{ color }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
