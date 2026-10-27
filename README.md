# Cell Seal: Technical Design

Cell Seal is the settlement layer for tokenized RWA funds on Stellar. The amount of every
transaction is sealed on the public ledger, while the issuer, the transfer agent and the regulator
can still read everything. It is sold to tokenization platforms as a contract set plus an SDK; the
platform keeps its fund token, its mint and burn rights, KYC and the order lifecycle.

This repository is the technical design document (TDD). It holds no application code.

## Reading order

| # | Document | For | Answers |
|---|---|---|---|
| 1 | [`docs/overview.md`](docs/overview.md) | Everyone | What the product does, for whom, what it does not do |
| 2 | [`docs/glossary.md`](docs/glossary.md) | Everyone | What each term means, and what the UI calls it |
| 3 | [`docs/flows.md`](docs/flows.md) | Everyone | Each business flow: who does what, what goes on chain, what the market sees |
| 4 | [`docs/integration.md`](docs/integration.md) | Everyone | What the platform owns, what Cell Seal provides; fund token conditions; who mints, who burns; reconciliation |
| 5 | [`docs/onboarding.md`](docs/onboarding.md) | Everyone | Bringing a fund onto the rail: Case 1 (no token yet) and Case 2 (existing token), step by step |
| 6 | [`docs/design/`](docs/design/README.md) | Product, frontend | Sandbox apps: fund console (11 screens) and investor app (7 screens) |
| 7 | [`docs/primitives.md`](docs/primitives.md) | Engineering | The OpenZeppelin Confidential Token: what is reused, what is built |
| 8 | [`docs/architecture.md`](docs/architecture.md) | Engineering | Components, trust boundaries, data classification, data flows |
| 9 | [`docs/contracts.md`](docs/contracts.md) | Soroban | Each contract: functions, events, errors, permissions, invariants |
| 10 | [`docs/cryptography.md`](docs/cryptography.md) | Cryptography, SDK | Anatomy of a transfer, sealed box, DvP, threshold viewing key, openings |
| 11 | [`docs/keys.md`](docs/keys.md) | All engineering | Every key: generation, storage, recovery, rotation, loss |
| 12 | [`docs/sdk.md`](docs/sdk.md) | Frontend, integrators | The `@cell-seal/sdk` API |
| 13 | [`docs/backend.md`](docs/backend.md) | Backend | Services, API, state machine, indexer, data model |
| 14 | [`docs/frontend.md`](docs/frontend.md) | Frontend | Routes, data handling, amounts, browser security |
| 15 | [`docs/security.md`](docs/security.md) | Everyone, auditors | Threat model, leak catalogue, invariants, assurance plan |
| 16 | [`docs/open-items.md`](docs/open-items.md) | All engineering | What must be verified by prototype (V-n), open decisions (D-n), test strategy |

## Four principles

1. **Cell Seal reads no amount.** The backend is amount-blind; encryption, decryption and proof
   generation happen only in the browser of an authorized party.
2. **The chain is the source of truth.** State changes only on final events or on signed
   attestations.
3. **The rail knows nothing about fund business.** NAV, cut-off and dealing days live in the
   tokenization platform's system; in the sandbox, in the backend and the fund console.
4. **Compose, do not rewrite.** The underlying cryptography belongs to the primitive; Cell Seal
   writes the parts nobody has built.

## Product boundary

| Layer | What | Form |
|---|---|---|
| Settlement contracts | `seal-token` wrapper, `settlement`, `fund-policy`, `seal-verifier`, `seal-auditor`, `fund-registry` | Product. One contract set per platform, one wrapper per fund |
| SDK and indexer | `@cell-seal/sdk`; an indexer that stores events permanently | Product. Integrated into the platform's own apps |
| Sandbox | Fund console and investor app | For platforms to try the rail. Not sold, not operated as a service for real funds |

`settlement` never mints or burns the fund token. It wraps the net of a window when `net > 0` and
unwraps it when `net < 0`; the issuer mints and burns on the platform's own rail. Two onboarding
cases share the same contracts: a fund with no token yet (Case 1) and a fund with an existing
token and public holders (Case 2). See [`docs/onboarding.md`](docs/onboarding.md).

## Status

| Part | Status |
|---|---|
| Product model | Decided 2026-10-24: contracts plus SDK sold to tokenization platforms; `settlement` does not mint or burn. The testnet prototype predates this decision; the required changes are in [`docs/integration.md`](docs/integration.md) §8 |
| Overview, glossary, flows, onboarding, design | Written |
| Primitive survey | Read from the upstream `v0.9.0` code on 2026-09-20; later verified by a testnet spike on 2026-10-09 ([`docs/open-items.md`](docs/open-items.md) §1) |
| Technical design | First design. The V-n items in [`docs/open-items.md`](docs/open-items.md) §1 are verified by prototype before product code is written; results may change the design |
| Code | Contracts, circuits and scripts exist as a testnet prototype that has completed one full cycle. SDK, backend and apps: not started |

## Conventions

- English throughout. Technical terms follow [`docs/glossary.md`](docs/glossary.md).
- **V-n**: must be verified by prototype. **D-n**: open decision. **L-n**: an amount leak path.
  **R-n**: an item for independent cryptographic review. The master lists are in
  `docs/open-items.md` and `docs/security.md`.
- Primitive signatures are copied from the upstream spec at the pinned commit. When the commit is
  bumped, re-check `docs/contracts.md` §3 to §4 and `docs/cryptography.md` §1 to §3.
- Diagrams are Mermaid fenced blocks. Stellar accounts are `G...`, contracts are `C...`.
- Amounts in prose are illustrative. The only public figure the design produces per window is
  `net`.
