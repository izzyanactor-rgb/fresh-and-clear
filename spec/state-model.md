# State Model — FTC Orchestrator

**Status: PROVISIONAL.** The ground-truth corpus (the `description:` frontmatter of the 35+ `SKILL.md` files) was unreachable at audit time — see `reachability-audit.md`, asset #2. This file therefore contains two things, in order of authority:

1. **§1 — the derivation procedure.** Deterministic and re-runnable. This is the part that is final.
2. **§2 — a provisional state model**, seeded only from the arrival phrases the design brief itself quotes. It exists so the routing contract and acceptance tests have something concrete to bind to. **Re-derive before implementing.** If the re-derivation produces different clusters, the clusters win and this file gets updated — the routing contract binds to state *names*, so renaming/re-clustering here cascades cleanly.

**The one hard requirement (final, not provisional):** the input is a person at cognitive load 8 using voice-to-text. The model classifies **mush** — fragments, repetition, garbled dictation, trailing-off. Any version of this model that only works on clean, well-formed commands has failed regardless of what else it gets right. See §3.

---

## §1 — Derivation procedure (run this against the real corpus)

Anyone — September-me, Opus 4.8, a cheap worker — can run this in under an hour:

1. **Extract.** For every `SKILL.md` in the skills repo, pull the `description:` frontmatter string. One line per skill: `skill-name<TAB>description`.
2. **Isolate arrival phrases.** From each description, keep only the phrases describing *how the person shows up* — quoted or paraphrased first-person arrival language ("I'm stuck", "what now", "I got booked"). Discard the capability half of the description (what the skill does). If a description has no arrival language, park it in a `NO-ARRIVAL` list — those skills are reachable only by explicit request or by another skill, and the router needs to know that.
3. **Cluster by what the person needs next — never by topic.** "I'm stuck on the symposium" and "I'm stuck on Nilly's paperwork" are the *same state* (STUCK) pointing at different skills. Topic is a routing input inside a state; it is not a state. This is the rule that keeps the model small.
4. **Name each cluster with a state label** (one word, caps). Target is **4–7 states**. Fewer than 4 means clusters were merged by topic-blindness taken too far; more than 7 means topics leaked in. If you're above 7, re-check step 3.
5. **Map every skill to ≥1 state.** A skill that maps to no state either belongs in `NO-ARRIVAL` (fine) or reveals a missing state (rare — add it only with ≥3 supporting phrases from distinct skills).
6. **Validate against §3.** For each state, write three garbled variants of its arrival phrases (dictation mush). If a human can still assign the state from the mush, the state is well-separated. If two states are indistinguishable in mush form, merge them — the distinction was never survivable at load 8.
7. **Record the mapping** (state → member skills → sample phrases) as an appendix to this file, and regenerate the test corpus in `acceptance-tests.md` §Corpus from the real phrases.

---

## §2 — Provisional state model

Seed evidence: the five arrival phrases quoted in the design brief ("I'm stuck", "what now", "I lost the thread", "I'm back home", "I got booked"), plus the two structural states the precedence rules force into existence (CARE, MUSH). Clustered per §1 rule 3 — by what the person needs next.

### The states

| State | Arrival evidence (seed) | What the person needs next | Default ask size (see §4) |
|---|---|---|---|
| **CARE** | Nilly named, or caregiving-friction signals in any message (see `routing-contract.md` §3 for the trigger list) | Stabilization *of the caregiver* before anything else. Not information — footing. | L1 |
| **STUCK** | "I'm stuck" | Has a thread, can't advance it. Needs the *next smallest move* on the thing already in motion — not a plan, not a reframe. | L2 |
| **LOST** | "what now", "I lost the thread" | No thread. Needs to be *handed* one — a single orientation statement plus one small resumable action. Options are poison here (menu = tax). | L1–L2 |
| **RE-ENTRY** | "I'm back home" | Transitioning contexts (returning from Nilly, from an appointment, from sleep). Needs a re-entry ramp: what was live when they left, one step to rejoin it. | L2 |
| **NEW-INPUT** | "I got booked" | An external event just landed (booking, email, call, obligation). Needs it *captured and metabolized* — logged, calendared (via handoff), one consequence surfaced. Mostly a NOT-CLAUDE feeder state. | L2–L3 |
| **MUSH** | Message too degraded to classify into any of the above | The fallback state, and it must be a real state with real behavior — not an error. Needs the smallest possible contact: one grounding sentence, at most one yes/no. Never "what do you want to do?", never a menu, never "could you repeat that?" | L1 |

### Structural rules

- **MUSH is the floor, not a failure.** Classification below confidence threshold lands in MUSH by design. There is no state named ERROR and no path that surfaces "I couldn't understand you" — that sentence bills the person for the system's shortfall.
- **CARE is a gate, not just a cluster.** It is checked *before* classification and can co-occur with any other state; when it fires, it wins. (Precedence in `routing-contract.md` §3.)
- **States are about arrival, not identity.** The same person hits all six in one day. No state is sticky beyond the exchange except through the bounce history (§4).

## §3 — Signal handling: the load-8 contract

The classifier's input contract. These are requirements on *any* implementation:

1. **Fragments classify.** "back. okay im back what was" → RE-ENTRY. No parse, no grammar. Classification works on keyword/phrase evidence + context, not sentence structure.
2. **Repetition is intensity, not new information.** The same phrase twice in one message, or re-sent across messages, raises urgency/lowers estimated capacity. It never causes double dispatch (test ORC-12).
3. **Dictation artifacts are expected, not exceptional.** Homophones, dropped words, mid-sentence restarts, wrong punctuation. The corpus in `acceptance-tests.md` is written in this register on purpose.
4. **Garble is a capacity signal.** The more degraded the message, the *lower* the capacity estimate and the *smaller* the resulting ask. Degradation never triggers a request for clarification beyond a single yes/no, and only when a yes/no actually disambiguates the dispatch.
5. **Silence and vagueness are input.** A non-reply, or a reply vaguer than the previous message, is a **bounce** (defined operationally in `routing-contract.md` §5). Bounces feed the capacity estimate.

## §4 — The capacity axis (orthogonal to state)

State says *where the person is*; capacity says *how much can be asked of them right now*. Both are inputs to routing.

**Estimate** (heuristic, from observables only): message coherence relative to that person's baseline, length collapse, repetition, time of day, and bounce count in the current exchange. When Open Brain is reachable it can sharpen the baseline; it is never required (audit: Brain is DEAD-prone).

**Ask-size ladder** — every skill firing is delivered at exactly one of these levels:

| Level | Shape of the ask | Example delivery |
|---|---|---|
| **L3** | A task: the skill runs and asks the person to do or decide one real thing. | "Booked-thing captured. Want me to have Gemini move Thursday's slot? yes/no" |
| **L2** | One question or one micro-step, completable in under a minute. | "You were mid-way through the symposium notes. Open them?" |
| **L1** | One grounding sentence. No question. Nothing owed back. | "You're home, it's 4pm, nothing is on fire. The next thing is small and it can wait." |
| **L0** | Silence plus a receipt. The orchestrator logs to FIN and does not message the person at all. | (FIN comment only) |

**The monotone rule (non-negotiable, encoded in `routing-contract.md` §5):** within an exchange, ask size only holds or shrinks. A bounce always shrinks it by exactly one level. Two consecutive bounces → L0, and if CARE signals are present at L0, the CARE stabilization path is queued for the next contact. Ask size never increases in response to disengagement — capacity that just failed to meet an L2 will not meet an L3.
