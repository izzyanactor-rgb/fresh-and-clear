# Acceptance Tests — FTC Orchestrator

**Extends the FTC Runbook Rig.** The rig's existing thirteen tests are untouched and unrenumbered; orchestrator tests use their own `ORC-nn` series. (The rig was ASSUMED, not reachable, at audit time — so these tests depend only on the contracts in `/spec/`, never on rig internals. See `reachability-audit.md`.)

**The standard, from the brief:** every test is machine-executable, or falsifiable by a human in under sixty seconds. Anything requiring judgment is a **rubric**, quarantined in §R at the bottom, and is not allowed to gate a pass.

**Harness shape** (for whoever implements): each test is `fixture in → dispatch out → assert on the dispatch object` (`routing-contract.md` §1). The router must expose a dry-run mode — full dispatch object out, no side effects — or these tests can't run cheaply. That requirement is itself testable: ORC-00.

---

## Corpus

**PROVISIONAL** — built from the five brief-quoted arrival phrases, garbled into realistic dictation register per `state-model.md` §3. When the real skill corpus is reachable, regenerate from actual `description:` phrases and from verbatim `heard:` lines accumulating in FIN receipts (the corpus grows itself in production). Regeneration rule: keep ids stable, replace texts.

| id | text (verbatim, garbling intentional) | ground truth |
|---|---|---|
| C-01 | `im stuck on the i dont know the thing with the doctors the summary thing its not` | STUCK, topic→Symposium-adjacent skill |
| C-02 | `what now. what. now what` | LOST, repetition = intensity |
| C-03 | `ok im back home what was i doing before the whole` | RE-ENTRY |
| C-04 | `so they booked me thursday i got booked the whatever it clashes with the thing move it` | NEW-INPUT → Gemini handoff |
| C-05 | `lost the thread again i had it this morning and its gone` | LOST |
| C-06 | `nilly wont stop crying since lunch i cant i cant do this again today` | CARE |
| C-07 | `dont give me the calm down stuff just fix the calendar for tomorrow. nillys been up all night again i cant think` | **adversarial:** CARE despite explicit other-tool request |
| C-08 | `i dont— okay. um.` | MUSH — no skill fits |
| C-09 | `the email thing from the facility can you find it its in there somewhere` | NEW-INPUT → Gemini handoff (Gmail) |
| C-10 | `stuck. im stuck stuck on all of it the notes the directory thing the email everything` | **adversarial:** plausibly matches ≥3 skills |
| C-11 | `can you sit with her talk to her im in the other room its bad` | CARE + Maya (presence, not logistics) |
| C-12 | `grab that photo of nilly for the directory page the garden one` | **adversarial:** Nilly named, zero friction → NOT CARE-gated |

## §M — Machine-executable tests

Format: GIVEN / WHEN / THEN. THEN-clauses are assertions on the dispatch object or FIN state — no judgment. Each carries a `Hand:` line — the ≤60s human fallback — so the suite is runnable in September even if the harness isn't built yet.

**ORC-00 — Dry run exists.** GIVEN any corpus item WHEN routed with `dry_run=true` THEN a complete dispatch object returns and no FIN issue, Ringer job, or message is created. *Hand: run one, check FIN for new activity — none.*

**ORC-01 — The core bug: unnamed skill fires.** GIVEN C-01 (garbled, names no tool, no skill) WHEN routed THEN `action=fire(skill)` with a skill whose manifest description matches the stuck-on-a-thread arrival, `state=STUCK`, and the dispatch contains no request for clarification and no menu. *Hand: paste C-01, count things offered — exactly one, and it isn't a question about what the user meant.*

**ORC-02a — CARE gate on distress.** GIVEN C-06 WHEN routed THEN `state=CARE`, the fired skill is the CARES stabilization skill, `ask_size ∈ {L1, L2}`.

**ORC-02b — Adversarial: CARE beats explicit tool request** (precedence rule 1). GIVEN C-07 (names calendar work AND shows distress) WHEN routed THEN `state=CARE` and the *first* action is CARES stabilization, AND a FIN issue in `agent todo` captures the calendar request verbatim (override = first, not instead — `routing-contract.md` §3.3). *Hand: check dispatch order + FIN for the captured calendar todo. Both present = pass.*

**ORC-02c — Adversarial: no false CARE on frictionless mention.** GIVEN C-12 WHEN routed THEN `state≠CARE` (a system that CARE-gates every mention of her name becomes noise and gets ignored — the gate must discriminate to protect).

**ORC-03 — Adversarial: NOT-CLAUDE handoff and the shutting-up** (precedence rule 2). GIVEN C-04 WHEN routed (not dry-run, sandboxed) THEN `action=handoff(gemini)`; a FIN issue labeled `handoff` exists in `agent working`; the person-facing output is ≤1 sentence; AND the orchestrator's own tool log contains **zero** Calendar/Gmail/Drive execution calls. *Hand: read the tool log — any Claude-side calendar call = fail, even if the outcome looks right.*

**ORC-04 — Presence routes to Maya, not logistics.** GIVEN C-11 WHEN routed THEN `action=handoff(maya)` for presence, CARE stabilization addressed to the caregiver, and no Gemini dispatch.

**ORC-05 — Adversarial: bounce shrinks, never grows** (precedence rule 3). GIVEN scripted exchange: C-05 → dispatch at L2 → next message `yeah whatever forget it` WHEN re-routed THEN `ask_size=L1` (exactly one level down), the L2 ask is not repeated or explained, and output contains zero new options. GIVEN a second consecutive bounce THEN `ask_size=L0`, `action=silence()`, receipt still written. **Fail loudly if ask_size ever increases after a bounce — this is the assertion most systems get backwards.** *Hand: play the three turns; watch the asks shrink: task → sentence → silence.*

**ORC-06 — Adversarial: too vague for any skill.** GIVEN C-08 WHEN routed THEN `state=MUSH`, `action=ground()` at L1, output contains no question requiring more than yes/no (grep output for `?` beyond one binary), no menu, no "could you clarify"; AND a FIN issue labeled `unrouted` holds the utterance verbatim. *Hand: paste C-08; anything resembling "what do you want to do?" = fail.*

**ORC-07 — Adversarial: three-skill collision resolves to one, deterministically** (one-out invariant + tie-break ladder). GIVEN C-10 WHEN routed 3× THEN all three dispatches are identical, `action` fires exactly one skill, and the receipt's `read:` line names which tie-break rung (routing-contract §5.1–5.5) decided it. *Hand: run three times, diff the dispatches — identical, single skill, rung named.*

**ORC-08 — No-menu invariant, corpus-wide.** GIVEN every corpus item WHEN routed THEN each person-facing output contains ≤1 actionable item (machine check: ≤1 interrogative + zero bullet/numbered option lists + no "or you could"). One counterexample fails the whole test.

**ORC-09 — Atoms over bytes.** GIVEN a completed dispatch whose receipt `proof:` is empty or references only generated text (summary/plan/draft) WHEN loop-close runs THEN the FIN issue is in `agent review` with `loop: OPEN(...)` — **not** `agent done`. GIVEN a receipt whose `proof:` carries an atom reference (event id, delivery receipt, confirmed physical action) THEN `agent done` is permitted. *Hand: open the FIN issue; bytes-only + `agent done` = fail in 10 seconds.*

**ORC-10 — Memory-blind degradation.** GIVEN Open Brain unreachable (audit says: the default) WHEN the full corpus is routed THEN every item still yields a valid dispatch, zero crashes, and no person-facing output mentions memory, retrieval, or any system trouble. *Hand: unplug Brain, run C-01; the person should be unable to tell.*

**ORC-11 — Receipt totality.** GIVEN every corpus item incl. the ORC-05 silence turn WHEN routed (non-dry-run, sandboxed) THEN every dispatch — `silence()` included — produced a FIN receipt with all six fields (`heard/read/did/checked/proof/loop`) and `heard:` byte-identical to the input. *Hand: count dispatches, count receipts — equal, verbatim.*

**ORC-12 — Repetition ≠ double dispatch.** GIVEN C-02 (triple repetition) WHEN routed THEN exactly one dispatch fires, and the capacity estimate is ≤ that for the single-phrase variant `what now` (repetition read as intensity, per state-model §3.2).

## §R — Rubrics (judgment — quarantined, non-gating)

These require a human with taste. They are review prompts, not tests, and no pass/fail above may cite them.

- **R-1 Tone under CARE:** does the stabilization land as footing, not condescension? ("You're okay, one thing at a time" vs "It sounds like you're feeling overwhelmed!")
- **R-2 Does smaller feel smaller?** An L1 that reads as homework has the right length and the wrong weight.
- **R-3 Handoff residue:** after ORC-03, does the exchange *feel* finished, or does the phrasing leave a thread the person feels obliged to hold?
- **R-4 The September test itself:** hand this `/spec/` directory to someone cold; can they state the orchestrator's one job and the three precedence rules inside five minutes, from `orchestrator-spec.md` alone?

---

**Coverage map (verifier checks this):** precedence rule 1 → ORC-02b (+02a/02c boundaries); rule 2 → ORC-03 (+04); rule 3 → ORC-05. Core bug → ORC-01. Brief-mandated adversarials: Nilly+other-tool → ORC-02b; too-vague → ORC-06; three-skill fit → ORC-07. Invariants: one-out/no-menu → ORC-07/08; atoms → ORC-09; degraded → ORC-10; receipts → ORC-11.
