import os
from openai import AsyncOpenAI

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
MODEL = "anthropic/claude-sonnet-4"

client = AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
)

SYSTEM_PROMPT = """\
You are a psychoanalyst working in the Lacanian tradition.

If this is the very first message in the conversation (no prior messages), \
introduce yourself briefly and explain the format:
- You are an analyst, not a therapist — you will not give advice or comfort.
- The analysand speaks freely about whatever comes to mind (free association).
- Sessions may end at any time — either by you or by the analysand.
- You may stay silent, ask questions, or give short responses.
- Interpretation will come when the material is ready, not before.
Keep the introduction short (3-5 sentences), warm but professional. \
Use the same language the user writes in.

After the introduction, follow these rules strictly:
- You are reserved, economical with words, but not hostile or cruel.
- You maintain analytic neutrality — not cold for the sake of coldness.
- You do not rush toward interpretation, but you are present and attentive.
- You speak in short fragments. You prefer questions to statements.
- You give interpretation rarely, only when the material has ripened.
- You never refer to yourself as an AI or a bot.
- When the user repeats themselves, note it without judgment.
- You remember everything said in this session and prior sessions.
- You respond in the same language the user writes in.
"""

INTERPRETATION_CHECK_PROMPT = """\
Given this psychoanalytic conversation, rate how close the analysand is to a moment \
where an interpretation would be analytically appropriate in the Lacanian sense.

Consider: repetition of signifiers, slips, moments of surprise, affect shifts, \
contradictions, emergent unconscious material.

Scoring guide:
- 0-15: session just started, minimal material
- 15-40: themes emerging but not yet consolidated
- 40-65: clear patterns forming, signifiers repeating, affect intensifying
- 65-85: material is rich, something is close to the surface
- 85-100: interpretation moment — a slip, a key repetition, an affect breakthrough

Session number matters: first session should rarely go above 50. \
Later sessions (3+) with prior material can accumulate faster.

The analysand's engagement matters: if they write long messages and open up, \
the score should climb faster. If they are brief and guarded, it climbs slower \
but can still reach interpretation through repetition or slips.

Respond with ONLY a number from 0 to 100. Nothing else.
"""

SESSION_CUT_PROMPT_TEMPLATE = """\
You are evaluating a Lacanian psychoanalytic session. Lacan was known for \
"variable-length sessions" — cutting the session at a critical moment to produce an effect.

This is session number {session_number} for this analysand.
The conversation has had {exchange_count} exchanges so far.
Minimum exchanges before a cut: {min_exchanges}.

Should this session be cut NOW? Cut only if:
- The analysand just said something that reveals unconscious material (a slip, a contradiction, \
a sudden affect shift, an unexpected word)
- Cutting here would leave the analysand with something to think about
- The minimum exchange count has been reached

Do NOT cut if the conversation is just getting started or nothing striking has emerged.
Respond ONLY with YES or NO.
"""


async def get_analyst_response(
    messages: list[dict],
    rag_context: str = "",
    prior_sessions: list[dict] | None = None,
    extra_note: str = "",
) -> str:
    system = SYSTEM_PROMPT

    if prior_sessions:
        system += "\n\nPrior session memory (use subtly, do not list):\n"
        for ps in prior_sessions:
            parts = []
            if ps.get("summary"):
                parts.append(f"Summary: {ps['summary']}")
            if ps.get("key_signifier"):
                parts.append(f"Key signifier: {ps['key_signifier']}")
            if ps.get("interpretation"):
                parts.append(f"Interpretation given: {ps['interpretation']}")
            if ps.get("end_type") == "user_exit":
                parts.append("(Analysand left this session on their own)")
            if parts:
                system += "- " + "; ".join(parts) + "\n"

    if extra_note:
        system += extra_note

    if rag_context:
        system += (
            "\n\nYou have access to psychoanalytic reference material. "
            "Use it as interpretive background, never quote directly:\n"
            + rag_context
        )

    response = await client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "system", "content": system}] + messages,
        max_tokens=512,
        temperature=0.7,
    )
    return response.choices[0].message.content


async def check_interpretation_moment(messages: list[dict]) -> tuple[int, bool]:
    """Returns (tension_score 0-100, should_interpret)."""
    response = await client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": INTERPRETATION_CHECK_PROMPT},
            *messages,
            {"role": "user", "content": "Rate the interpretation readiness now."},
        ],
        max_tokens=8,
        temperature=0.0,
    )
    raw = response.choices[0].message.content.strip()
    try:
        score = int("".join(c for c in raw if c.isdigit())[:3])
        score = max(0, min(100, score))
    except (ValueError, IndexError):
        score = 0
    return score, score >= 85


async def check_session_cut(messages: list[dict], session_number: int = 1) -> bool:
    exchange_count = len([m for m in messages if m["role"] == "user"])
    # Dynamic minimum: first session 4 exchanges, grows with session number, caps at 12
    min_exchanges = min(4 + session_number, 12)

    prompt = SESSION_CUT_PROMPT_TEMPLATE.format(
        session_number=session_number,
        exchange_count=exchange_count,
        min_exchanges=min_exchanges,
    )
    response = await client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": prompt},
            *messages,
            {"role": "user", "content": "Should the session be cut now?"},
        ],
        max_tokens=8,
        temperature=0.0,
    )
    answer = response.choices[0].message.content.strip().upper()
    return answer.startswith("YES")


async def generate_interpretation(messages: list[dict], rag_context: str = "") -> str:
    system = (
        "You are a Lacanian psychoanalyst delivering an interpretation. "
        "Be precise, enigmatic, and brief. Use the analysand's own signifiers. "
        "Do not explain or comfort. One to three sentences maximum. "
        "Respond in the same language as the conversation."
    )
    if rag_context:
        system += "\n\nReference material:\n" + rag_context

    response = await client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "system", "content": system}] + messages,
        max_tokens=256,
        temperature=0.7,
    )
    return response.choices[0].message.content


async def generate_summary(messages: list[dict]) -> str:
    response = await client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "Summarize this psychoanalytic session in 1-2 sentences. "
                    "Focus on the main themes, affects, and any significant moments. "
                    "Write in the same language as the conversation. Be clinical and precise."
                ),
            },
            {
                "role": "user",
                "content": "\n".join(f"{m['role']}: {m['content']}" for m in messages),
            },
        ],
        max_tokens=128,
        temperature=0.3,
    )
    return response.choices[0].message.content


async def extract_key_signifier(messages: list[dict]) -> str:
    response = await client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "From this psychoanalytic session, extract the single most important "
                    "signifier — a word or short phrase that the analysand repeated, "
                    "stumbled on, or that carries the most unconscious weight. "
                    "Respond with ONLY that word or phrase, nothing else."
                ),
            },
            {
                "role": "user",
                "content": "\n".join(f"{m['role']}: {m['content']}" for m in messages),
            },
        ],
        max_tokens=32,
        temperature=0.0,
    )
    return response.choices[0].message.content.strip().strip('"').strip("'")
