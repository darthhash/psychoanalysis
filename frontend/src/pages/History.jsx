import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { getSessionHistory, getMessages } from "../lib/api";
import MessageBubble from "../components/MessageBubble";

const END_TYPE_LABELS = {
  interpretation: "Interpretation",
  analyst_cut: "Cut by analyst",
  user_exit: "Left by analysand",
};

export default function History() {
  const [sessions, setSessions] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    getSessionHistory()
      .then(setSessions)
      .catch(() => {});
  }, []);

  const toggleExpand = async (sessionId) => {
    if (expanded === sessionId) {
      setExpanded(null);
      setMessages([]);
      return;
    }
    setExpanded(sessionId);
    setLoadingMessages(true);
    try {
      const msgs = await getMessages(sessionId);
      setMessages(msgs);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="h-full flex flex-col">
      <header className="px-4 py-3 border-b border-[var(--border)]">
        <span className="text-xs tracking-widest text-[var(--muted)] uppercase">
          Session History
        </span>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {sessions.length === 0 && (
          <p className="text-center text-[var(--muted)] text-sm mt-20">
            No sessions yet.
          </p>
        )}

        {sessions.map((s) => (
          <div
            key={s.id}
            className="border border-[var(--border)] rounded-xl overflow-hidden"
          >
            {/* Card — always visible */}
            <div className="px-5 py-4">
              {/* Top row: date + badge + count */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm text-[var(--muted)]">
                  {formatDate(s.started_at)}
                </span>
                {s.end_type && (
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      s.end_type === "interpretation"
                        ? "bg-violet-500/20 text-violet-300"
                        : s.end_type === "analyst_cut"
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-red-500/20 text-red-300"
                    }`}
                  >
                    {END_TYPE_LABELS[s.end_type] || s.end_type}
                  </span>
                )}
                {s.message_count > 0 && (
                  <span className="text-xs text-[var(--muted)]">
                    {s.message_count} msg
                  </span>
                )}
              </div>

              {/* Summary — full text */}
              {s.summary && (
                <p className="text-base text-[var(--fg)] leading-relaxed mb-3">
                  {s.summary}
                </p>
              )}

              {/* Key signifier */}
              {s.key_signifier && (
                <p className="text-sm text-violet-400 mb-3">
                  « {s.key_signifier} »
                </p>
              )}

              {/* Interpretation — always visible, prominent */}
              {s.interpretation && (
                <div className="p-4 rounded-lg bg-violet-500/10 border border-violet-500/20 mb-3">
                  <p className="text-xs text-violet-400 uppercase tracking-widest mb-2 font-medium">
                    Interpretation
                  </p>
                  <p className="text-base text-violet-200 italic leading-relaxed">
                    {s.interpretation}
                  </p>
                </div>
              )}

              {/* Expand button */}
              <button
                onClick={() => toggleExpand(s.id)}
                className="flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--fg)] transition mt-1"
              >
                {expanded === s.id ? (
                  <>
                    <ChevronUp size={14} /> Hide conversation
                  </>
                ) : (
                  <>
                    <ChevronDown size={14} /> Show full conversation
                  </>
                )}
              </button>
            </div>

            {/* Expanded: full conversation */}
            {expanded === s.id && (
              <div className="border-t border-[var(--border)] p-4 bg-[var(--surface)]">
                {loadingMessages ? (
                  <p className="text-sm text-[var(--muted)] text-center py-4">
                    ...
                  </p>
                ) : (
                  <div className="space-y-0">
                    {messages.map((m) => (
                      <MessageBubble
                        key={m.id}
                        role={m.role}
                        content={m.content}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
