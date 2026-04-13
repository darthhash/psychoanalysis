export default function MessageBubble({ role, content }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[75%] px-5 py-3 rounded-2xl text-base leading-relaxed ${
          isUser
            ? "bg-violet-600/20 text-violet-100 rounded-br-sm"
            : "bg-[var(--surface)] text-[var(--fg)] border border-[var(--border)] rounded-bl-sm"
        }`}
      >
        {content}
      </div>
    </div>
  );
}
