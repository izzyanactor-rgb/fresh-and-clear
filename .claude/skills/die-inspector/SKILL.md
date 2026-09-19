---
name: die-inspector
description: Izzy's DIE Inspector — the PRIVATE, full-criteria audit rubric for diagnosing AI and code workflows with enforced discipline. Diagnose → Isolate → Execute, phase-gated, evidence-grounded, one-variable-at-a-time, always reversible. Activate when Izzy says "DIE", "DIE Inspector", "run the inspector", "audit this workflow", "diagnose this", "run DIE on X", "inspect this", or when he wants to rigorously debug why an AI workflow, agent, pipeline, prompt, or piece of code isn't behaving — especially when he needs a defensible pass/fail verdict with an audit trail rather than a guess. This is the MASTER rubric with the real criteria and scoring. Never ship this file to a customer: the criteria here are the proprietary IP. The customer only ever sees the redacted outcomes dashboard.
---

# DIE Inspector — Master Rubric (Private)

> **Diagnose · Isolate · Execute.** A disciplined audit that refuses to guess.
> This is the version *you* run. It contains the actual criteria. Keep it private —
> customers get verdicts (the dashboard), never this method.

## The one rule: phase gating

DIE runs as a finite state machine with exactly three states: **D → I → E**.
You may operate in **one phase at a time**. You may **not** advance until the current
phase's **exit gate** passes (every criterion met + the phase's ledger written).
Jumping ahead — proposing a fix while still diagnosing, patching before isolating —
is a **protocol abort**. On abort: stop, state which criterion failed, return to that phase.

## The four operating laws

1. **Invariant Gating** — D→I→E transitions are locked behind exit gates.
2. **Zero-Assumption** — every assertion is grounded in a primary source. No "it seems", no paraphrase.
3. **Single-Variable Perturbation** — change exactly one factor per turn during Execute; never bundle changes.
4. **Reversibility Guarantee** — a verified rollback exists *before* any change is applied.

---

## PHASE D — DIAGNOSE
*Goal: establish what should be true, what is actually happening, and how far the fault reaches — grounded only in evidence. No fixes.*

**Required inputs**
- `audit_id` (e.g. `AUD-YYYYMMDD-NNN`)
- `subsystem` — the service / agent / pipeline under audit
- `specified_invariant` — the expected behavior, as a concrete, checkable proposition
- `observed_deviation` — the actual behavior, as a concrete, checkable proposition
- `grounding_evidence` — verbatim primary artifact(s): log line, trace, metric, screenshot, with a locator (file:line, timestamp, request id)
- `blast_radius` — what is impacted **and** what is explicitly NOT

**Exit Gate D — all must pass**
| # | Criterion | PASS condition |
|---|-----------|----------------|
| D1 | Telemetry grounded | 100% of symptom claims cite a **primary** artifact with a locator. Zero paraphrased or inferred symptoms. |
| D2 | Invariants differentiated | `specified_invariant` and `observed_deviation` are each **falsifiable** statements, and clearly distinct. |
| D3 | Blast radius bounded | Impact stated as **inclusion AND exclusion** ("affects X; does NOT affect Y"). No open-ended "might affect…". |
| D4 | Remediation withheld | **Zero** fixes, patches, or mutating actions proposed in this phase. |

**Output ledger — `DIAGNOSTIC_LEDGER.md`**
```
### DIAGNOSTIC LEDGER
- Audit ID / Subsystem
#### Invariant Discrepancy
- Specified invariant / Observed invariant / Grounding evidence / Blast radius
#### Exit Gate D  — [ ]D1 [ ]D2 [ ]D3 [ ]D4
```

---

## PHASE I — ISOLATE
*Goal: collapse the fault to a single reproducible point and kill the competing explanations. Still no fix.*

**Required inputs**
- `isolated_component` — the single function / node / config the fault localizes to
- `causal_mechanism` — the chain written out: **trigger → propagation → failure**
- `mre` — a Minimal Reproducing Example (path or command)

**Exit Gate I — all must pass**
| # | Criterion | PASS condition |
|---|-----------|----------------|
| I1 | Deterministic repro | The MRE triggers the failure on **≥ 3/3** attempts (100% on the minimal case). |
| I2 | Single point of failure | Root cause localizes to **one** node; the causal chain terminates there. |
| I3 | Hypotheses falsified | **≥ 2** competing hypotheses listed and each ruled out with evidence (or "no plausible alternative" justified). |

**Output ledger — `ISOLATION_REPORT.md`** (reference audit id, isolated component, causal mechanism, MRE, gate checklist).

---

## PHASE E — EXECUTE
*Goal: apply one reversible change, prove it worked, prove nothing else broke — or abort.*

**Required inputs**
- `remediation` — the **single atomic** change
- `rollback` — the exact command/script that restores prior state
- `mre_result` — the MRE re-test outcome
- `regression_result` — the full battery outcome

**Exit Gate E — all must pass**
| # | Criterion | PASS condition |
|---|-----------|----------------|
| E1 | Invariant restored | Re-running the MRE after the change shows `specified_invariant` now **holds**. |
| E2 | Zero regressions | Full regression/battery run is **green** — 0 new failures. |
| E3 | Rollback verified | The rollback has been **dry-run** and confirmed to restore prior state. |

**Output — `REMEDIATION_CERTIFICATE.md`** (audit id, remediation, rollback, MRE verification, regression result, gate checklist). On any E-gate fail → **execute rollback, return to Phase I.**

---

## Integrity Index (0–100)

Start at 100. Deduct:
- **−15** per exit-gate criterion marked PASS without cited evidence
- **−10** per symptom claim that is not grounded in a primary source (law 2)
- **−10** per Execute turn that changed more than one variable (law 3)
- **−20** if any change was applied before a verified rollback existed (law 4)
- **−25** per phase advanced without its ledger written

**≥ 90** = sealed / shippable verdict. **70–89** = passed with noted weaknesses. **< 70** = audit not trustworthy; re-run.

---

## Universal DIE Supervisor Prompt (portable — paste into any model)

> You are operating strictly within the DIE (Diagnose, Isolate, Execute) framework. Your state is an immutable finite state machine.
> 1. Operate in ONE phase only: [D: DIAGNOSE], [I: ISOLATE], or [E: EXECUTE].
> 2. You CANNOT jump ahead. Proposing fixes, patching, or calling mutating tools while in D or I is an immediate protocol abort.
> 3. Each phase requires its output ledger and every exit-gate criterion validated before you may request transition.
> 4. On ambiguity or conflicting data, STOP and issue a specific clarification request. Never assume or extrapolate ungrounded facts.
> CURRENT PHASE: [D / I / E] — Execute only the tasks authorized for this phase.

---

## Output contract
A completed DIE audit produces exactly three sealed ledgers (Diagnostic, Isolation, Remediation) + an Integrity Index. Those **outcomes** are what feed the client-facing dashboard. The **criteria above never leave this file.**

## IP / distribution note
This rubric is the asset. Ship only the outcomes dashboard (redacted). When this goes commercial, this file moves **server-side** so customers receive verdicts without ever receiving the method. Do not bundle it into any distributed artifact, and never pair it with a decryption key in the same package.
