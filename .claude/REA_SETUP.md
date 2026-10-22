# REA — the whole thing on one card

REA reverse-engineers shipped software: point it at an app and it explains how a
feature works, citing evidence from the real code. Useful when you want to
understand something you don't have the source for.

## Already done (committed to this repo)

- `.mcp.json` — registers the REA MCP server. Uses `npx -y`, so it fetches on
  demand. **No install needed.** Any session that opens this repo gets the tools.
- `.claude/skills/reverse-engineer-anything/` — REA's own usage guidance, so the
  methodology travels with the repo, not just the tools.

Nothing to run for this part. Open the repo, the tools are there.

## Do you actually need an analysis engine?

This is the question to answer before installing anything.

| Target | Engine needed? |
|---|---|
| Websites, web apps | No |
| Electron apps (Notion, Slack, Discord, VS Code) | No |
| JavaScript / TypeScript bundles | No |
| .NET assemblies | No |
| Native binaries (C, C++, Swift, Objective-C) | **Yes** |
| iOS / macOS app binaries | **Yes** |
| Android APKs | Yes — a JADX jar you supply |

Most things worth studying are Electron or web, which need nothing. Install an
engine only once you hit a native target.

## If you do need a native engine

Two options, and the free one is arguably better:

**Ghidra** — free, open source, actively developed. REA wants 12.1.x.
Needs a JDK. Set `GHIDRA_INSTALL_DIR` to the extracted release directory.

**Hopper** — commercial, with a limited free demo. `npx rea-agents@latest setup`
can install the demo for you after you approve it. Convenient, but the demo is
restricted; the full version is a paid licence.

Recommendation: start with Ghidra unless you specifically want Hopper's UI.

## Running setup on a machine (optional)

Only needed to register REA with an agent outside this repo, or to let REA
install Hopper.

1. `node --version` — needs 22.19+, 24.11+, or 26+
2. `npx rea-agents@latest setup`
3. Pick your agents, review the proposed changes, approve
4. Restart the agent

It writes an MCP entry to `~/.claude.json` and a skill to `~/.claude/skills/`,
backing up existing config first.

## Checking state

```
npx -y rea-agents@6.7.0 doctor
```

`missing_analysis_engine` for hopper/ghidra/ida is expected and fine if you are
only doing web or Electron work.

## Package provenance

`rea-agents`, MIT, github.com/morluto/rea. Published via GitHub Actions trusted
publishing. No npm install hooks. Version is pinned in `.mcp.json`; bump it
there deliberately rather than tracking `@latest`.
