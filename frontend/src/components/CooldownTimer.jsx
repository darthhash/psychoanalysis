import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export default function CooldownTimer({ cooldownUntil, onExpired }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    if (!cooldownUntil) return;

    // Backend returns naive UTC timestamps — append Z if missing
    const raw = cooldownUntil.endsWith("Z") ? cooldownUntil : cooldownUntil + "Z";
    const target = new Date(raw);

    const tick = () => {
      const now = new Date();
      const diff = target - now;
      if (diff <= 0) {
        setRemaining("");
        onExpired?.();
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setRemaining(`${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [cooldownUntil, onExpired]);

  if (!remaining) return null;

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-[var(--muted)]">
      <Clock size={48} strokeWidth={1} />
      <p className="text-lg">Next session in</p>
      <p className="text-4xl font-light tabular-nums">{remaining}</p>
      <p className="text-xs mt-2">
        Use this time to record dreams or write notes
      </p>
    </div>
  );
}
