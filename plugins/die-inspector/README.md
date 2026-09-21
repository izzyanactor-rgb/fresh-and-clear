# DIE Inspector (plugin)

Diagnose → Isolate → Execute: a disciplined audit for AI and code workflows,
packaged as an installable Claude Code / Codex plugin.

## What you get when you install it
- **The `die-inspector` skill** — the phase-gated audit rubric. Say "run DIE on
  this" / "audit this workflow" and it activates.
- **The `/die-inspector:audit` command** — run an audit on demand:
  ```
  /die-inspector:audit the refund step in my support agent keeps double-charging
  ```

## The evaluation engine
The automated scoring engine (calls `typesafe-ai/jev` through the Vercel AI
Gateway) lives alongside this repo at `die-inspector/engine/`. It runs on your
own machine/server with your `AI_GATEWAY_API_KEY` — see that folder's README.
The engine is intentionally kept out of the distributed plugin: the rubric it
scores against is your proprietary IP and stays private / server-side.

## Install
1. Add the marketplace (once):
   ```
   /plugin marketplace add izzyanactor-rgb/fresh-and-clear
   ```
2. Install:
   ```
   /plugin install die-inspector@izzy-tools
   ```
3. Reload:
   ```
   /reload-plugins
   ```

## What's inside
| Path | What it is |
|------|-----------|
| `.claude-plugin/plugin.json` | plugin manifest |
| `skills/die-inspector/` | the DIE rubric skill (private criteria) |
| `commands/audit.md` | the `/die-inspector:audit` command |
