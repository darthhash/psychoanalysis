export default function About() {
  return (
    <div className="h-full flex flex-col">
      <header className="px-4 py-3 border-b border-[var(--border)]">
        <span className="text-xs tracking-widest text-[var(--muted)] uppercase">
          About
        </span>
      </header>

      <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto">
        <h1 className="text-xl text-[var(--fg)] mb-6">Psychoanalysis</h1>

        <section className="mb-8">
          <h2 className="text-sm text-violet-400 uppercase tracking-widest mb-3">
            What is this
          </h2>
          <p className="text-base text-[var(--fg)] leading-relaxed mb-3">
            This is an AI psychoanalyst working in the Lacanian tradition.
            It is not therapy. It is not advice. It is a space for free
            association — you speak, the analyst listens, and occasionally
            intervenes.
          </p>
          <p className="text-base text-[var(--fg)] leading-relaxed">
            The analyst does not comfort or reassure. It maintains a position
            of neutrality, asking questions and reflecting your own words back
            to you. The goal is not to feel better — it is to hear what you
            are actually saying.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-sm text-violet-400 uppercase tracking-widest mb-3">
            Lacanian Psychoanalysis
          </h2>
          <p className="text-base text-[var(--fg)] leading-relaxed mb-3">
            Jacques Lacan (1901–1981) was a French psychoanalyst who
            reinterpreted Freud through linguistics and philosophy. Key ideas:
          </p>
          <ul className="space-y-3 text-base text-[var(--fg)] leading-relaxed">
            <li>
              <span className="text-violet-300 font-medium">The Unconscious is structured like a language.</span>{" "}
              Your slips, repetitions, and word choices reveal more than your
              conscious intentions.
            </li>
            <li>
              <span className="text-violet-300 font-medium">The subject is divided.</span>{" "}
              You are not a unified "self" — there is always a gap between
              what you say and what speaks through you.
            </li>
            <li>
              <span className="text-violet-300 font-medium">Desire is the desire of the Other.</span>{" "}
              What you want is shaped by what you believe others want from
              you.
            </li>
            <li>
              <span className="text-violet-300 font-medium">The Real resists symbolization.</span>{" "}
              There is always something that cannot be put into words — and
              that is precisely what matters.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-sm text-violet-400 uppercase tracking-widest mb-3">
            How sessions work
          </h2>
          <ul className="space-y-2 text-base text-[var(--fg)] leading-relaxed">
            <li>
              <span className="text-[var(--muted)]">Free association —</span>{" "}
              Say whatever comes to mind. There are no wrong answers.
            </li>
            <li>
              <span className="text-[var(--muted)]">Variable-length sessions —</span>{" "}
              The analyst may end the session at any moment, especially when
              something significant emerges. This is intentional.
            </li>
            <li>
              <span className="text-[var(--muted)]">Interpretation —</span>{" "}
              Rare. Given only when your material has "ripened." You will see
              the eye indicator fill up as interpretation approaches.
            </li>
            <li>
              <span className="text-[var(--muted)]">Cooldown —</span>{" "}
              After each session there is a mandatory pause. Deeper sessions
              have longer pauses. Use this time to record dreams or write notes.
            </li>
            <li>
              <span className="text-[var(--muted)]">Memory —</span>{" "}
              The analyst remembers prior sessions. Themes, signifiers, and
              interpretations carry across.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-sm text-violet-400 uppercase tracking-widest mb-3">
            The eye indicator
          </h2>
          <p className="text-base text-[var(--fg)] leading-relaxed mb-3">
            The eye icon in the session header shows how close you are to an
            interpretation moment:
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-3">
              <span className="w-20 text-[var(--muted)]">0–30%</span>
              <span className="text-[var(--muted)]">Early — material is just beginning to emerge</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-20 text-violet-500">30–60%</span>
              <span className="text-violet-400">Surfacing — patterns are forming</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-20 text-violet-300">60–85%</span>
              <span className="text-violet-300">Close — something is near the surface</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-20 text-red-400">85–100%</span>
              <span className="text-red-400">Interpretation — the moment has arrived</span>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-sm text-violet-400 uppercase tracking-widest mb-3">
            Dreams & Notes
          </h2>
          <p className="text-base text-[var(--fg)] leading-relaxed">
            Between sessions, record your dreams and write notes. Dreams are
            the "royal road to the unconscious" (Freud). The analyst will
            eventually have access to this material.
          </p>
        </section>

        <p className="text-xs text-[var(--muted)] mt-8 pb-8">
          This is not a substitute for real psychoanalysis or mental health
          treatment. If you are in crisis, seek professional help.
        </p>
      </div>
    </div>
  );
}
