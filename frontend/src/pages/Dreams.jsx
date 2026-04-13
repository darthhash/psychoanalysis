import { useState, useEffect } from "react";
import { createDream, listDreams } from "../lib/api";

export default function Dreams() {
  const [dreams, setDreams] = useState([]);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listDreams().then(setDreams).catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!input.trim() || saving) return;
    setSaving(true);
    try {
      const dream = await createDream(input.trim());
      setDreams((prev) => [dream, ...prev]);
      setInput("");
    } catch {}
    setSaving(false);
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="px-4 py-3 border-b border-[var(--border)]">
        <span className="text-xs tracking-widest text-[var(--muted)] uppercase">
          Dream journal
        </span>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Input */}
        <div className="mb-6">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your dream..."
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

        {/* List */}
        {dreams.map((d) => (
          <div
            key={d.id}
            className="mb-4 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl"
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {d.content}
            </p>
            <p className="text-xs text-[var(--muted)] mt-2">
              {new Date(d.created_at).toLocaleString()}
            </p>
          </div>
        ))}

        {dreams.length === 0 && (
          <p className="text-center text-[var(--muted)] text-xs mt-10">
            No dreams recorded yet
          </p>
        )}
      </div>
    </div>
  );
}
