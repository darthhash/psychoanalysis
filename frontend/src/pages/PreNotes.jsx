import { useState, useEffect } from "react";
import { createNote, listNotes } from "../lib/api";

export default function PreNotes() {
  const [notes, setNotes] = useState([]);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listNotes().then(setNotes).catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!input.trim() || saving) return;
    setSaving(true);
    try {
      const note = await createNote(input.trim());
      setNotes((prev) => [note, ...prev]);
      setInput("");
    } catch {}
    setSaving(false);
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="px-4 py-3 border-b border-[var(--border)]">
        <span className="text-xs tracking-widest text-[var(--muted)] uppercase">
          Notes
        </span>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-6">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What's on your mind before the session..."
            rows={4}
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--fg)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition resize-none"
          />
          <button
            onClick={handleSave}
            disabled={!input.trim() || saving}
            className="mt-2 px-4 py-2 text-xs border border-[var(--border)] text-[var(--muted)] hover:text-[var(--fg)] hover:border-[var(--accent)] transition rounded-lg disabled:opacity-30"
          >
            {saving ? "..." : "Save"}
          </button>
        </div>

        {notes.map((n) => (
          <div
            key={n.id}
            className="mb-4 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl"
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {n.content}
            </p>
            <p className="text-xs text-[var(--muted)] mt-2">
              {new Date(n.created_at).toLocaleString()}
            </p>
          </div>
        ))}

        {notes.length === 0 && (
          <p className="text-center text-[var(--muted)] text-xs mt-10">
            No notes yet
          </p>
        )}
      </div>
    </div>
  );
}
