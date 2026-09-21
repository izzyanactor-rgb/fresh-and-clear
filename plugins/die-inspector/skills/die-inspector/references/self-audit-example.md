# DIE Self-Audit — running the rubric against itself

**Subject under audit:** DIE Framework v1.0 (the "Encrypted Execution" build — USB key + AES-256-GCM wrapper)
**Audit ID:** `AUD-20260918-002`   ·   **Auditor:** DIE Inspector (master rubric)

> Dogfood run: we point DIE at DIE. The methodology (phases/gates) is the thing being trusted, so it should survive its own audit — and it should *catch* the flaw in its earlier packaging.

---

## PHASE D — DIAGNOSE

- **Specified invariant (expected):** *The framework protects the proprietary rubric from disclosure to whoever holds the distributed package.*
- **Observed deviation:** *Any holder of the package can recover the rubric in full.* The 256-bit decryption key is printed in **Section 2.1** of the same document that carries the ciphertext (Section 3).
- **Grounding evidence (primary):**
  - Section 2.1 → `Key (Hex): 2f9bd8fed0758ba1…1bf5e2e7`
  - Section 3 → `ciphertext_b64: x9QJMgUNzUV…` + matching `nonce_b64`
  - Section 4 `unlock_framework()` → `AESGCM(key).decrypt(nonce, ciphertext, None)` succeeds with that published key.
- **Blast radius:** Affects **every distributed copy** of the framework and the USB-delivery business model. Does **NOT** affect the DIE *methodology* (phases, gates, ledgers) — that logic is sound and is not implicated.

**Exit Gate D**
- [x] **D1** grounded — all three symptom claims cite verbatim primary artifacts (sections + code line)
- [x] **D2** invariants differentiated — both are falsifiable and distinct
- [x] **D3** blast radius bounded — inclusion + explicit exclusion stated
- [x] **D4** remediation withheld — no fix proposed yet
**→ GATE D PASSED · Diagnostic Ledger sealed**

---

## PHASE I — ISOLATE

- **Isolated component:** the key-provisioning + payload design (Sections 2–3). *Not* the cipher, *not* the phase logic.
- **Causal mechanism (trigger → propagation → failure):**
  AES-256-GCM provides **authenticity + secrecy only while the key is secret** → the key is published beside the ciphertext → so secrecy collapses to zero → "hardware/USB gating" and "volatile memory" become decorative, because they guard the *medium*, not the *secret* → rubric is trivially recoverable.
- **MRE:** `python3 -c "from cryptography.hazmat.primitives.ciphers.aead import AESGCM; import base64; print(AESGCM(bytes.fromhex(PUBLISHED_KEY)).decrypt(base64.b64decode(NONCE), base64.b64decode(CT), None)[:80])"` → prints plaintext rubric. **3/3 deterministic.**

**Exit Gate I**
- [x] **I1** reproduced 3/3 on the minimal case
- [x] **I2** single point of failure — secrecy depends on key secrecy, and the key is not secret
- [x] **I3** competing hypotheses falsified:
  - *"USB gating protects it"* → ✗ the key **value** is what matters, not the storage medium
  - *"Volatile / RAM-only execution protects it"* → ✗ plaintext still reaches memory and the screen (menu option 3 prints it)
  - *"Obfuscation deters copying"* → ✗ one-line, fully reversible
**→ GATE I PASSED · Isolation Report sealed**

---

## PHASE E — EXECUTE

- **Atomic remediation (one change):** Stop distributing the rubric. Move it **server-side**; ship only the **outcomes dashboard** (redacted). Customers send workflow → server runs the private rubric → returns verdict + sealed ledgers. No key, no ciphertext, no rubric ever leaves your infrastructure.
- **Rollback (verified before change):** Revert to **private-local-only** mode — rubric stays on your machine, nothing distributed at all. This is the *current* state, so rollback is trivially available and confirmed.
- **MRE re-test:** With the rubric held server-side, the customer artifact contains **zero rubric text** → the decrypt-the-package attack has nothing to decrypt → invariant *"holder cannot recover the rubric"* now **holds.**
- **Regression check:** Methodology unchanged; dashboard still shows verdicts; DIE phases/gates untouched. **0 regressions.**

**Exit Gate E**
- [x] **E1** invariant restored (nothing to extract from the shipped artifact)
- [x] **E2** zero regressions (methodology + dashboard intact)
- [x] **E3** rollback verified (private-only mode is the current, restorable state)
**→ GATE E PASSED · Remediation Certificate CERTIFIED**

---

## Verdict

| | |
|---|---|
| **Integrity Index** | **95 / 100** — sealed (−5: v1 shipped a change, the USB wrapper, before its protection invariant was verified — law 4) |
| **Methodology (D/I/E logic)** | **Sound** — survived its own audit |
| **v1 packaging (encryption wrapper)** | **Rejected** — protection invariant violated; remediated to server-side + redacted dashboard |
| **Result** | The rubric is trustworthy. The *costume* was the bug — and DIE caught it. |

*This is the honest proof the encryption theater couldn't give you: the discipline holds up when you turn it on itself.*
