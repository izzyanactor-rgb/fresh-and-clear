# Reachability Audit — FTC Orchestrator

**Phase 0 gate artifact.** No design decision below `/spec/` is valid unless it is consistent with this table.

- **Audited:** 2026-07-12, from a Claude Code remote session attached to `izzyanactor-rgb/fresh-and-clear`, branch `claude/ftc-orchestrator-design-sgdnuv`.
- **Marks:** `WIRED` = reach confirmed by a live probe this session. `ASSUMED` = could not confirm; the design depends on it anyway. `DEAD` = unreachable from here; the design routes around it.
- **Rule inherited from the brief:** a spec that silently assumes a broken dependency is worse than no spec. Every ASSUMED below is therefore *loud*: each one names the design consequence and the re-probe command.

---

## The verdict table

| # | Asset | Mark | Evidence (this session) | Design consequence |
|---|-------|------|------------------------|--------------------|
| 1 | **Open Brain** (Supabase + pgvector + MCP) | **DEAD** | No Supabase/pgvector/Open Brain MCP tools are exposed in this session at all — a tool search for supabase/postgres/pgvector/memory returned nothing related. Consistent with the brief's own report of unreliable MCP auth. | Memory is **optional, never load-bearing**. The orchestrator must route correctly memory-blind, and treat Brain reads as an enhancement that sharpens routing when available. All state the loop *requires* is mirrored to FIN (the one WIRED organ). See `orchestrator-spec.md` → Memory, and test ORC-10. |
| 2 | **Open Skills** (35+ `SKILL.md`) | **DEAD** | Zero `SKILL.md` files exist in this repo (`glob **/SKILL.md` → none). The repo contains exactly three HTML files. `list_repos` for this account shows **only** `fresh-and-clear` — no skills repo is reachable from this session. | The Phase 1 ground-truth corpus (skill `description:` frontmatter) is unreachable. `state-model.md` therefore ships as **(a) a deterministic re-derivation procedure + (b) a provisional model** seeded only from the arrival phrases quoted in the design brief. The provisional model is marked non-final and MUST be re-derived against the real corpus before implementation. Do not treat the provisional clusters as ground truth. |
| 3 | **Open Engine** (Linear, team `FIN`) | **WIRED** | Live MCP probes succeeded: team "Finely Tuned Copilot" exists; issue keys confirm prefix `FIN` (FIN-1…FIN-6); the six custom statuses exist verbatim — `agent todo`, `agent working`, `agent review`, `agent needs input`, `agent done`, `standing`; project "Personal Agent Engine" exists; FIN-5/FIN-6 show a tested queue-runner protocol (AGENT CLAIMED / AGENT DONE comments, completed 2026-07-02). | FIN is the **spine**. Because it is the only confirmed-reachable organ, the design makes it the system of record for everything the loop cannot afford to lose: dispatch receipts, bounce history, open-loop status. Anything the spec says goes "to memory" also goes to FIN as a comment. |
| 4 | **Ringer / Ringside** (dispatch + receipts dashboard) | **ASSUMED** | No URL, repo, config, or reference to Ringer/Ringside exists anywhere reachable: not in this repo (grep negative), not in Linear issues or documents. Cannot probe what cannot be named. | The design depends on the **Ringside receipt pattern** (not "done" — "here is how it was checked, and here is the proof") and on Ringer as the dispatch mechanism. Both are specified as *contracts* (`routing-contract.md` §6, verifier receipt format), so any dispatcher that honors the contract can substitute. Degraded mode if Ringer is down at implementation time: dispatch instructions are logged verbatim to the FIN issue and the issue sits in `agent needs input`. |
| 5 | **Doctor's Symposium v2** (Netlify, thinker agent) | **ASSUMED** | Shipped per the brief; no URL discoverable from this session, so liveness unconfirmed. (Guessing URLs is not verification.) | Treated purely as a **dispatch target** — a place the router can send deep-thinking work. Its internals are out of scope by the scope fence anyway. If it is down in September, the router falls back to logging the thinking task to FIN. |
| 6 | **Dementia Care Directory** (clerk agent) | **ASSUMED** | Same as #5: shipped per the brief, unverifiable from here. The `docs/index.html` in this repo is a small static care dashboard ("Share a memory") and contains no link to it. | Same treatment as #5: dispatch target behind a contract, with FIN fallback. |

### Also audited (not one of the six, but load-bearing)

| Dependency | Mark | Evidence | Design consequence |
|---|---|---|---|
| **FTC Runbook Rig** (nine stages, thirteen acceptance tests) | **ASSUMED** | Named as existing by the brief; no copy is reachable from this session. | `acceptance-tests.md` **extends** it without colliding: orchestrator tests use their own `ORC-nn` numbering and never renumber, restate, or depend on the internals of the existing thirteen. |
| **Gemini / Maya handoff targets** | **ASSUMED** | Cannot probe Gemini or Maya from here. Notable environment fact: Gmail, Google Calendar, and Google Drive MCP tools **are wired into this Claude session** — which is precisely the temptation the NOT-CLAUDE branch exists to refuse. | The routing contract's NOT-CLAUDE branch (§4 of `routing-contract.md`) is written as a hard fence: having the tools is not permission to use them for logistics. The handoff is the deliverable; shutting up is part of the handoff. |

---

## What this audit changes about the design (summary for September-me)

1. **FIN is the spine.** It is the only organ confirmed alive. Every loop-critical write lands there, whatever else is also written elsewhere.
2. **Memory is a sharpener, not a foundation.** Routing works blind; Brain, when it answers, improves tie-breaks and capacity estimates. If any spec sentence makes routing *require* Brain, that sentence is a bug.
3. **The state model is provisional.** The real corpus (skill descriptions) was unreachable. `state-model.md` §1 is a procedure to re-derive it; run that procedure before building the router.
4. **Everything ASSUMED sits behind a contract.** Ringer, Symposium, Directory, Gemini, Maya are all reached through interfaces defined in `routing-contract.md`, so a dead one degrades to a FIN log entry instead of a crash.

---

## Re-probe checklist (run before implementing — under 5 minutes)

Re-run these and update the marks. If any mark changes, re-check the consequence column before building.

| Asset | Probe |
|---|---|
| Open Brain | From a session with the Open Brain MCP configured: call any read tool (e.g. a vector search for the word "test"). Auth error or missing tool → still DEAD. |
| Open Skills | From the machine/repo that holds the skills: `grep -r "^description:" --include=SKILL.md \| wc -l` — expect ≥ 35. Then run the derivation procedure in `state-model.md` §1. |
| Open Engine | Linear MCP: list teams; confirm team key `FIN` and the six custom statuses by name. (Passed 2026-07-12.) |
| Ringer/Ringside | Open the Ringside dashboard URL; confirm it renders live receipts. Dispatch a no-op job through Ringer and watch the receipt appear. |
| Symposium v2 | Load the Netlify URL; confirm it responds. |
| Care Directory | Load its URL; confirm it responds. |
| Runbook Rig | Locate the rig; confirm its thirteen tests still pass; confirm `ORC-nn` numbering does not collide with anything added since. |
