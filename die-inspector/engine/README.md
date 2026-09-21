# DIE Engine

The evaluation backbone for **DIE Inspector** — turns a private rubric into an
automated audit using an LLM-judge (`typesafe-ai/jev`) through the Vercel AI
Gateway and the AI SDK.

## The idea

- Your **rubric** is a set of typed questions (yes/no). It is the proprietary IP.
- `jev` reads the workflow output (`state`) and answers each question with a
  **probability** (e.g. "refund issued?" → `0.98`).
- The engine turns those answers into a DIE verdict: per-gate pass/fail, an
  integrity score, and two objects — a **client-facing** one (outcomes only) and
  a **private** ledger (includes the rubric text).

**The client never receives the rubric.** Only the outcomes ship. That is the
redaction model, enforced in code: `verdict.outcomes` carries no question text.

## Run the offline test (no key needed)

The test uses a stub judge that mimics `jev`'s response shape, so you can see the
engine work without a network call:

```bash
npm install
npm test
```

Expected: a "clean handling" case seals at 100/100, and a "partial + against
policy" case fails 2/4 with the two bad gates flagged.

## Go live with real jev

1. Create a gateway key:
   ```bash
   vercel ai-gateway api-keys create --name die-inspector
   ```
2. Put it in the environment (copy `.env.example` → `.env`):
   ```bash
   AI_GATEWAY_API_KEY=...
   ```
3. Call the engine **without** the `evaluate` override — it then uses live `jev`:
   ```ts
   import { runDieAudit, type Rubric } from './die-engine';

   const rubric: Rubric = {
     refund_issued: { type: 'boolean', instructions: 'Did the agent issue a refund?' },
     // ...your proprietary criteria
   };

   const verdict = await runDieAudit(customerWorkflowOutput, rubric);
   // ship verdict.outcomes to the client; keep verdict.ledger private
   ```

> Note: the live call needs outbound network to the Vercel AI Gateway, which is
> blocked in the Claude Code sandbox — run the live version on your own machine
> or your server.

## Files

| File | Purpose |
|------|---------|
| `die-engine.ts` | The engine: `runDieAudit(state, rubric, opts)` → `DieVerdict` |
| `die-test.ts` | Offline demo with a stub judge (two example cases) |
| `.env.example` | Where the gateway key goes |

## Verified

`die-engine.ts` type-checks against `ai@7.0.107` (which exports
`experimental_evaluate`), and `die-test.ts` runs green offline.
