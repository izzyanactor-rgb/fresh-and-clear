# FTC Orchestrator — Specification

**Start here.** Read order for a stranger (including me, September, load 8): this file → `reachability-audit.md` (what was actually reachable and what that changed) → `state-model.md` (re-derive §1 before building) → `routing-contract.md` (the mechanics) → `acceptance-tests.md` (what "working" means) → `.claude/agents/orchestrator-verifier.md` (the thing that says no).

**Placement:** Symbiosis grid. Not Knowledge (it stores almost nothing), not Operational (it does no domain work itself), not Harness (the Runbook Rig is the harness and this extends it). It is the membrane between the person and the six organs. That's the whole placement discussion.

**The bug it kills:** skills fire only when named, and naming fails exactly when it's needed most. **Success = skills fire without being named.** Any behavior that hands the retrieval burden back to the person — a menu, a "which did you mean?", a request to restate — is the bug rebuilt inside the fix.

This spec is structured as the seven surfaces, applied to the orchestrator itself. The surfaces are the schema, not headings decoration: if a fact about the orchestrator doesn't fit under one of the seven, it doesn't belong in the design.

---

## 1. Job

**Turn an unnamed arrival into exactly one fired skill, and close the loop with a receipt in FIN.**

One sentence, one job. Expanded only to make the boundaries sharp:

- *Unnamed*: the person never has to know a skill's name, or that skills exist. The utterance is mush; the orchestrator does the retrieval (state → skill, per `routing-contract.md`).
- *Exactly one*: never a menu (contract invariant, §1).
- *Fired*: dispatched through Ringer with a receipt — not described, not offered.
- *Closed*: the result lands back in FIN, and the FIN issue reaches `agent done` only on proof of an atom (surface 6).

**Non-jobs**, permanently: doing the domain work itself (skills, Symposium, Directory do that); doing logistics (Gemini's); being present with Nilly (Maya's); running on a timer (Morning Kickoff and Moon Playbook already fire reliably on time triggers — they are not the bug and this system does not touch them).

## 2. Diet

What it reads, in priority order — and the cutoff below which it reads nothing more:

| Reads | From | Why |
|---|---|---|
| The utterance, verbatim | Voice-to-text | The signal. Never pre-cleaned (`routing-contract.md` §1). |
| Exchange history + bounce count | Its own short-term buffer | Bounce detection, capacity estimate |
| Open FIN loops in the six agent statuses | Linear (WIRED) | Re-entry ramps, open-loop awareness, tie-break 4 |
| Skill manifest: names + `description:` frontmatter **only** | Open Skills | Routing. Bodies are never read — the orchestrator routes to skills, it does not learn to do their jobs. |
| Memory retrievals | Open Brain (**optional** — DEAD at audit) | Sharpens capacity baseline and tie-breaks. Absence changes nothing structural. |

**Refuses to eat:** skill bodies; Gmail/Calendar/Drive content (that's Gemini's diet — even though this session provably has the tools, see audit); Symposium/Directory internals; anything requiring the person to produce cleaner input than they arrived with.

## 3. Memory

What it retains, and where — written for a world where Open Brain has a bad valve (audit: DEAD):

| Retained | Primary home | Mirror |
|---|---|---|
| Every dispatch receipt (`routing-contract.md` §6) | **FIN comment** (WIRED — system of record) | Open Brain, when reachable |
| Bounce history per exchange | Short-term buffer, discarded at exchange end | Outcome summary in the receipt (`loop:` line) |
| Routing outcomes (state → skill → engaged/bounced) | FIN receipts (queryable via labels) | Brain, for baseline-sharpening |
| Verbatim `unrouted` arrivals | FIN issues labeled `unrouted` | — (these seed future skills and the growing corpus) |

**Rule: FIN first, Brain second, always both directions readable-from-FIN-alone.** If a retained fact exists only in Brain, the design has made a DEAD organ load-bearing — that's an audit violation.

**Deliberately not retained:** a running model of the person's mental state beyond the current exchange (capacity is re-estimated fresh each arrival — yesterday's load 8 must not haunt today's load 3); anything about Nilly's clinical state (CARE routes to skills and Maya; the orchestrator is not a care record).

## 4. Tools

| Tool | Status (audit) | Used for |
|---|---|---|
| Linear MCP (team FIN) | WIRED | Create/comment/status issues; the receipt anchor; the queue |
| Ringer dispatch | ASSUMED (behind contract) | Firing the selected skill with a receipt |
| Open Brain MCP | DEAD (optional) | Retrieval-sharpening when alive |
| Handoff emitters → Gemini, Maya | ASSUMED (behind contract) | The NOT-CLAUDE branch |
| Symposium v2, Care Directory | ASSUMED (dispatch targets) | Destinations a skill may route work to |

**Explicit non-tools:** Gmail, Google Calendar, Google Drive. Present in the environment; fenced off by `routing-contract.md` §4. The single permitted exception: *verifying* a handoff's atom (e.g., confirming a calendar event exists at loop-close) — read-only, verification only, never task execution.

## 5. Reach

What it may touch **without asking**:
- FIN: create issues, comment, move between the six agent statuses.
- Ringer: dispatch skills.
- Brain: read and write memory entries.
- The person: at most one message per dispatch, at the capacity-appropriate ask size — and at L0, not even that.

What **always requires explicit go-ahead** (a yes from the person or a standing FIN authorization on the issue):
- Anything outward-facing: sending email/messages to other humans, posting publicly, anything another person will see.
- Anything touching Nilly's care arrangements, records, or facility communications.
- Spending money, booking, canceling, or committing the person to anything.
- Modifying skills, the two shipped sites, timers (Morning Kickoff, Moon Playbook), or the Runbook Rig — permanent fence, not even with permission through this system.

The asymmetry is the design: unlimited reach *inward* (queue, receipts, memory), near-zero reach *outward*. The orchestrator is a membrane, and membranes that push outward unsupervised are how a helper becomes a liability at exactly the moment supervision capacity is lowest.

## 6. Proof

**The hard constraint: atoms over bytes.** A loop that reads memory, picks a skill, and produces a nicely formatted answer has *not closed*. Closure means something happened in the physical world.

**An atom is an externally verifiable state change outside the conversation.** For this system, the atom classes:
- A calendar event that exists (verifiable by id) — created via Gemini handoff.
- A message actually delivered to a real recipient (send receipt), person-authorized per surface 5.
- A physical-world action completed and confirmed (med pickup done, ride booked, form submitted, thing signed) — usually the person does the atom; the system's proof is the confirmation captured in FIN.
- A scheduled commitment to an atom (the booked slot in which the atom will happen) — a *deferred* atom, acceptable only with the check-back that verifies it landed.

**The mechanism** (binds to `routing-contract.md` §6): every dispatch produces a receipt; a receipt's `proof:` field must contain an atom reference for the FIN issue to reach `agent done`. Bytes-only outcomes (a summary, a plan, a draft) park at `agent review` with `loop: OPEN(<the atom that would close it>)` — visible, honest, and nagging. **`agent done` without an atom in the receipt is a contract violation** (test ORC-09), and the verifier treats it as a NO.

Grounding dispatches (L1) and silence (L0) are exempt from the atom requirement — they are stabilization, not loops — but still produce receipts. Exemption is by ask size, not by convenience: an L3 task never gets to claim the exemption.

## 7. Value

What breaks if it disappears — the test of whether it was worth building:

- **The retrieval burden lands back on the person at load 8.** Skills return to firing only when named, and naming fails exactly when needed. This is the pre-orchestrator world, verbatim; it is the failure mode being paid for.
- **The six organs disconnect again.** Memory that nothing reads, skills that nothing fires, a queue that nothing feeds, receipts that nothing emits. Six organs, no circulation — the system reverts to requiring its owner to be the circulatory system, which is precisely the job the owner cannot reliably do.
- **Loops stop closing in atoms.** Work degenerates back into well-formatted bytes: plans about plans, summaries of summaries. FIN fills with `agent done` issues where nothing in the world actually changed.
- **The bounce data disappears.** Without receipts recording engaged-vs-bounced, there is no ground truth about what ask sizes actually land at what capacity — the one dataset that makes the system *this person's* orchestrator rather than a generic one.

What does **not** break: the skills (they work standalone), the shipped sites, the timers, the queue itself. The organs survive; only the circulation dies. That is exactly the right blast radius for a v1 membrane — removable without organ damage.
