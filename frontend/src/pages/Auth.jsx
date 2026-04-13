import { useState } from "react";
import { login, register, setToken } from "../lib/api";

export default function Auth({ onAuth }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const fn = isLogin ? login : register;
      const data = await fn(email, password);
      setToken(data.token);
      onAuth();
    } catch (err) {
      setError(err.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="w-full max-w-sm p-8">
        <h1 className="text-lg tracking-widest text-[var(--muted)] uppercase text-center mb-8">
          Psychoanalysis
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email"
            required
            className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-5 py-3.5 text-base text-[var(--fg)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            required
            minLength={6}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-5 py-3.5 text-base text-[var(--fg)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition"
          />

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3.5 border border-[var(--border)] text-[var(--fg)] hover:border-[var(--accent)] transition rounded-xl text-base disabled:opacity-50"
          >
            {loading ? "..." : isLogin ? "Enter" : "Register"}
          </button>
        </form>

        <button
          onClick={() => {
            setIsLogin(!isLogin);
            setError("");
          }}
          className="mt-6 text-sm text-[var(--muted)] hover:text-[var(--fg)] transition w-full text-center"
        >
          {isLogin ? "No account? Register" : "Already have an account? Login"}
        </button>
      </div>
    </div>
  );
}
