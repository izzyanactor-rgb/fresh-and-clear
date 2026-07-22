# Codex plugin — the whole thing on one card

**Prereqs (have these once):** Node.js 18.18+, the Codex CLI, and a ChatGPT
subscription (Free works) *or* an OpenAI API key.

## One-time setup (do these once, ever)

1. **Add the marketplace** — ✅ already done: it's committed in
   `.claude/settings.json`. (Equivalent command: `/plugin marketplace add openai/codex-plugin-cc`)
2. **Install the plugin:** `/plugin install codex@openai-codex`
3. **Reload plugins:** `/reload-plugins`
4. **Verify setup:** `/codex:setup`  ← checks Codex is ready, installs it if needed
5. **Log in (only if step 4 says you're not):** `!codex login`

## The payoff — the only line you type from now on

```
/codex:review
```

That reviews your current work with Codex. No code changes. That's the whole point.

## Ignore until later

`rescue`, `transfer`, `adversarial`, the gate, `--background` / `status` / `result`.
Run `/codex:review` a few times first, then explore if you want more.
