---
description: Run a DIE audit (Diagnose → Isolate → Execute) on a workflow, bug, or AI output.
argument-hint: [what to audit]
---
Run the **DIE Inspector** protocol on the target below, using the `die-inspector` skill's rubric.

Enforce the discipline strictly:
- Operate in ONE phase at a time: **Diagnose → Isolate → Execute**.
- Do NOT propose or apply a fix before Isolate is complete.
- Ground every claim in a primary source (real log / trace / output). No assumptions.
- During Execute, change exactly one variable, and verify a rollback exists first.
- Validate each phase's exit gate before advancing.

Produce the three sealed ledgers (Diagnostic Ledger, Isolation Report, Remediation Certificate)
and an Integrity Index (0–100). Show only outcomes if a client-facing summary is requested;
keep the rubric criteria private.

Target to audit:
$ARGUMENTS
