# Routing Contract — FTC Orchestrator

**The contract in one line: mush in → exactly one thing fires → receipt lands in FIN.**

Never a menu. Never two things. Never a clarifying interrogation. A menu is a retrieval tax billed to the person with the least capacity to pay it — the exact bug this system exists to kill.

Binds to: state names from `state-model.md` §2, ask-size ladder from `state-model.md` §4, receipt pattern in §6 below. Consumed by: `orchestrator-spec.md` (Tools/Reach/Proof surfaces) and every test in `acceptance-tests.md`.

---

## §1 — Interface

**Input** (per exchange):

| Field | Source | Required? |
|---|---|---|
| `utterance` | Raw voice-to-text, verbatim. Never pre-cleaned. | yes |
| `timestamp` | Clock | yes |
| `exchange_history` | Last N turns of this exchange, incl. bounce count | yes (empty ok) |
| `fin_open_loops` | Open FIN issues in agent statuses (the WIRED organ) | yes (empty ok) |
| `skill_manifest` | Skill names + `description:` frontmatter only — never skill bodies | yes |
| `memory` | Open Brain retrieval | **no — optional.** Routing must be identical in shape when this is absent (audit: Brain is DEAD). |

**Output** (always exactly one):

```
dispatch {
  state:        CARE | STUCK | LOST | RE-ENTRY | NEW-INPUT | MUSH
  capacity:     estimated, per state-model §4
  ask_size:     L0 | L1 | L2 | L3
  action:       ONE of:
                  fire(skill)            — dispatch one named skill via Ringer
                  handoff(gemini|maya)   — NOT-CLAUDE branch, §4
                  ground()               — L1 grounding sentence, no skill
                  silence()              — L0, receipt only
  fin_ref:      FIN issue created or commented (always — this is the receipt anchor)
  receipt:      Ringside-pattern receipt, §6
}
```

**Invariants** (machine-checkable; tests ORC-07, ORC-08):
- **One-out:** exactly one `action` per input. Never a list, never "or".
- **≤1 actionable item** in anything shown to the person. A message containing two questions, or a question plus a suggestion, violates the contract.
- **Deterministic:** same input tuple → same dispatch. Tie-breaks are ordered (§5), not sampled.
- **Total:** every input produces a dispatch. There is no reject path. The floor is `MUSH + silence()`.

## §2 — Pipeline order

```
utterance → [CARE gate §3] → [NOT-CLAUDE branch §4] → [classify state §state-model]
          → [estimate capacity] → [select skill §5] → [size the ask §state-model §4]
          → [dispatch + receipt §6] → [watch for bounce §5] → [close loop §orchestrator-spec Proof]
```

The CARE gate runs **before** classification, on the raw utterance. Everything downstream can be preempted by it.

## §3 — Precedence rule 1: CARES outranks everything

**Trigger** (any one suffices):
- Nilly is named — any spelling/garbling a reasonable reader would recognize ("nilly", "my mom", "mum", dictation mangles like "nelly").
- Caregiving-friction signals without her name: distress language adjacent to care logistics (crying, sundowning, meds, the facility, "I can't do this again", door/wandering/night events).

**Behavior:**
1. State is forced to CARE. The CARES stabilization skill fires — targeting **the caregiver's footing**, at the capacity-appropriate ask size (usually L1).
2. **An explicit request for a different tool does not override.** "Just fix my calendar, don't give me the care stuff" while distress signals are present → CARES still fires first. This is safety precedence, not preference (test ORC-02b).
3. The overridden request is **not dropped** — it is captured to FIN (`agent todo`) inside the same receipt, and offered *after* stabilization, at the reduced ask size. Override means "first", not "instead"; a system that eats the original request teaches the person to stop asking.
4. Mentions with zero friction ("grab that photo of Nilly for the directory") pass the gate — the trigger is her presence *in a care context or alongside distress*, not the string alone. When in doubt, gate. False-positive cost: one grounding sentence. False-negative cost: the person stays unstabilized. Asymmetric — err toward CARE.

## §4 — Precedence rule 2: the NOT-CLAUDE branch

**Routes away:**

| Signal | Target | Examples |
|---|---|---|
| Calendar, Gmail, Drive, daily logistics | **Gemini** | "I got booked Thursday", "move the thing", "find that email/doc" |
| Real-time presence with Nilly | **Maya** | live conversation, in-the-room support, "sit with her" |

**The handoff protocol — designed as much for the shutting-up as the handing-off:**
1. Compose **one** handoff message: what's needed, the deadline if any, and the FIN reference. One sentence to the person: "Handed to Gemini: moving Thursday's booking." No elaboration.
2. Log the handoff to FIN (`agent working`, labeled `handoff`) — this FIN issue is the *only* thing Claude retains about the task.
3. **Then stop.** Claude does not shadow the task, does not "also take a look", does not use its own Gmail/Calendar/Drive access for the routed work — *even though this session provably has those tools wired* (see audit, "Gemini/Maya" row). Having the tools is not permission. An orchestrator that does everything is the forty-tool pile with extra steps.
4. Closure comes back through FIN: the handoff issue closes only on evidence the atom landed (calendar event exists, message actually sent — see `orchestrator-spec.md` → Proof). No evidence by the follow-up check → issue goes to `agent needs input`, never silently to done.

**Boundary cases:** mixed messages split — CARE gate first if triggered, logistics fragment handed off, at most one thing surfaced to the person (test ORC-03). Presence-with-Nilly always beats logistics-about-Nilly: "she's crying, what do I do *right now*" → CARE stabilization for the caregiver + Maya for presence, logistics deferred.

## §5 — Precedence rule 3: on bounce, go smaller — and skill selection

**Bounce, operationally** (any one):
- No engagement with the dispatched ask within the exchange (next message ignores it entirely);
- The next message is **vaguer**: shorter AND fewer content words AND no uptake of the offered ask (all three — brevity alone is not a bounce; "yes" is engagement);
- Explicit deflation: "never mind", "whatever", "forget it", trailing off.

**Response (the monotone rule):** a bounce means *less* capacity, not more. Drop ask size exactly one level and re-dispatch smaller — same state unless the bounce message itself reclassifies. Never repeat the bounced ask louder, never explain the bounced ask, never add options. Two consecutive bounces → L0 (silence + FIN receipt); if CARE signals are present at L0, queue CARE stabilization for next contact. Most systems escalate on disengagement — offer more detail, more options, bigger plans. That is backwards, and encoding the reverse is the point of this rule (test ORC-05).

**Skill selection within a state** — deterministic tie-break order, applied until one skill remains:
1. **Safety:** a CARE-adjacent skill beats a non-CARE skill.
2. **Topic evidence:** strongest overlap between utterance content words and the skill's `description:` frontmatter (manifest only — bodies are never read).
3. **Smaller ask:** the skill deliverable at the lower ask size wins.
4. **Recent success:** the skill that most recently completed (`agent done`) for this state, per FIN history — memory-blind by design, sharpened by Brain when reachable.
5. **Manifest order:** first in the manifest. Arbitrary but stable — determinism outranks cleverness at the bottom of a tie-break ladder.

**No skill fits** (below match threshold): do **not** stretch a bad match and do not ask "what do you want to do?" Route by state default — LOST/MUSH → `ground()` at L1; the utterance is logged verbatim to FIN (`agent todo`, labeled `unrouted`) so no arrival is ever dropped (test ORC-06). A pile of `unrouted` entries is the signal that a skill is missing — that's a September curation task, not a runtime one.

## §6 — The receipt (Ringside pattern)

Every dispatch — including `silence()` — produces a receipt as a FIN comment on `fin_ref`. Not "done": *how it was checked, and the proof.*

```
RECEIPT
  heard:    <utterance verbatim>
  read:     state=<state> capacity=<n> trigger=<which rule/evidence fired>
  did:      <action + skill/target + ask_size>
  checked:  <how the outcome was verified>
  proof:    <the atom or artifact: link, event id, message id — see orchestrator-spec Proof>
  loop:     CLOSED | OPEN(<what would close it>)
```

A receipt with an empty `proof` cannot mark its FIN issue `agent done` (test ORC-09). `heard:` is always verbatim — the mush is evidence, and cleaning it destroys the record of what load-8 arrivals actually look like (this is also how the state model's corpus grows).

## §7 — Degraded modes (from the audit — these are normal operation, not exceptions)

| Down | Behavior |
|---|---|
| Open Brain | Full function, memory-blind. Tie-break 4 uses FIN history only. No message to the person ever mentions memory being down (test ORC-10). |
| Ringer | Skill dispatch degrades to a FIN issue in `agent needs input` containing the exact dispatch instruction; the person's message still gets its state-appropriate L1/L2 response. |
| Gemini / Maya | Handoff logged to FIN as `agent needs input`, person told the one-liner ("Captured; the calendar move is queued"). Claude still does not do the logistics itself. |
| Linear (FIN) | The one hard dependency (only WIRED organ). Receipts buffer locally, flush on recovery — but if FIN is unreachable, say so plainly; this is the single failure worth surfacing. |
