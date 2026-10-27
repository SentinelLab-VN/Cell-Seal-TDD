# Cell Seal: Open Items

> The list of things the design assumes but has not yet proven (V-n, verified by prototype), the
> decisions still open (D-n), and the test strategy the implementation must follow. Other documents
> reference these ids; this is the master list. Leak paths (L-n) are in [`security.md`](security.md)
> §3; cryptographic review items (R-n) are in [`cryptography.md`](cryptography.md) §10.

## 1. What must be verified by prototype

The last column records the result of the spike on testnet, 2026-10-09. Items marked "Not yet"
are still open.

| # | Question | How to check | If the answer is "no" | Result |
|---|---|---|---|---|
| V-1 | How long does proving take on real devices, and what does on-chain verification cost in fees and resources? | Spike on three device classes | Too slow on phones: the investor app states a desktop requirement for order creation | Verifying one proof is about 90-97 M instructions, 0.10-0.17 XLM; proving about 1 s on a laptop. Phones not measured yet |
| V-2 | Does `settlement.require_auth()` called from the `seal-token` hook succeed when `settlement` is the direct caller? | Contract test | Use a *settling* flag set by `settlement` through a function only it can call | **Yes.** The `require_auth` hook for the settlement contract works; calling the wrapper directly is rejected even when the sender signed. No flag needed |
| V-3 | Do two UltraHonk proofs fit within the resource limits of one Soroban transaction? | Measure `settle_dvp` on testnet | DvP with the fund falls back to DoP with sealed stablecoin; secondary transfer moves past the first release | Two transfer proofs are about 188 M against the 400 M ceiling: they fit, with room. Summed from two single calls; `settle_dvp` in one transaction not measured yet |
| V-4 | Which set of nargo, bb and verifier versions works together? | Spike | Pin to the upstream PR #820 branch, where the demo runs | `nargo 1.0.0-beta.11` + `bb 0.87.0` + upstream `5ffda91` (Nethermind verifier with a real body); the 6 vk rebuild byte-identical |
| V-5 | What does the non-zk proof flavour leak about the witness? Does upstream plan to enable zk? | Ask upstream, read their analysis | Keep the pilot cap until there is an answer | Not yet |
| V-6 | Which generator does the auditor key use in `ECDH(r_e, K_aud)`? | Read the circuit `lib.nr` | Adjust the DKG to the right generator | `H`, the same generator as `PVK`; the auditor can only open if `K_aud = k * H` |
| V-7 | Does Freighter sign SEP-0053 messages, and deterministically? | Spike | Raw root becomes the default path, with a mandatory backup step | Not yet |
| V-8 | Can two-party authorization entries for `settle_pair`, and `from.require_auth()` nested through `settlement`, be signed with existing wallets? | Spike | `settle_pair` moves past the first release | **Yes.** The settlement account signs the authorization entry with the SDK's `authorizeEntry`, the issuer signs the envelope, one transaction. `stellar tx sign` cannot sign a non-root entry |
| V-9 | Storage and TTL cost per sealed account | Measure on testnet | Put the extension fee into the operating cost model | Not yet (rent is visible: the first `close_window` cost 0.40 XLM, mostly new entries) |
| V-10 | How long does the window-close transaction chain (close + N share deliveries + M DvP) take with N + M = 50? | Load test on testnet | Batch; show progress per batch | Not yet |
| V-11 | Case 2: can the existing wrapper wrap the SAC of an existing classic asset, with holders calling `deposit` themselves and the settlement account calling `withdraw`, with and without `AUTH_REQUIRED`? | Testnet: create a classic asset with an ordinary issuer, deploy a wrapper pointing at its SAC, do not touch `settlement` | Case 2 falls back to: the platform issues a new Soroban token and swaps 1:1 | Not yet |
| V-12 | Can "issuer funds `net`" and `close_window` be combined into one transaction, so there is no interval with public tokens waiting in the settlement account? | Try on testnet with a SAC and with the sample token | Two transactions, run back to back by the SDK, which refuses to close when the public balance differs from `net` | Not yet |

## 2. Open decisions

| # | Decision | Leaning | Blocks |
|---|---|---|---|
| D-1 | Which upstream commit to pin | Head of `v0.9.0`, plus the verifier wiring from PR #820 | Every contract and SDK build |
| D-2 | Who pays network fees for investors | The platform sponsors them with fee-bump through a relayer; investors need no XLM | Investor app order flow |
| D-3 | Which `auditor_id` an investor's cash account carries when investing in several funds | The `auditor_id` of the first fund that approved the investor. Every fund still sees the cash legs where its settlement account is a party, through the recipient's auditor channel | Cash wrapper, DvP |
| D-4 | KYC source | First release: the issuer attests `kyc_expiry` itself. A human.tech adapter once their attestation model fits | `fund-policy` |
| D-5 | Several pending DvP orders for the same wrapper | First release: one order per wrapper per investor; a new order waits or cancels the old one | DvP order flow |
| D-6 | Clawback with a threshold viewing key | A controlled key-reconstruction ceremony, followed immediately by `rotate_key`. MPC proving is the long-term direction | Clawback procedure |
| D-7 | Enforcing the opening after a secondary transfer | Flag and reconcile periodically; automatic freeze is a per-fund option | Secondary transfer, register |
| D-8 | Where `ops_root` lives in production | A signer hosted by the fund itself. Sandbox: envelopes for a small number of `signer`s | Production deployment |
| D-9 | Anchor the fund's `box_pk` on chain | Add a field to `FundInfo` so the client does not have to trust the backend | `fund-registry`, backend |
| D-10 | How the target platform controls fund token transfers: SEP-8, asset flags plus its own whitelist, or a custom Soroban token? | Ask the platform before committing to Case 2. SEP-8 is a blocker ([`integration.md`](integration.md) §3): the sealed part moves control to `fund-policy`, the public part keeps SEP-8 | Case 2 onboarding |

## 3. Test strategy

| Layer | Tooling | Runs when |
|---|---|---|
| Contracts: unit, property, fuzz | `cargo test`, `proptest`, `cargo-fuzz` | Every commit |
| Contracts: integration with real proofs | `local` network in a container | Every pull request |
| SDK: vectors, property, compatibility | Vitest | Every commit |
| Backend: API, state machine | `cargo test` with a real Postgres | Every commit |
| End to end | Playwright on the `local` network | Every pull request into the main branch |
| Amount leaks | Schema, log and network scans | Every pull request |
| Load | Window-close script with 50 orders | Before every release |
| Rehearsals | Clawback, `ops_root` compromise, indexer losing events | Before mainnet |

Mock verifiers are forbidden at every layer from integration upwards: a green test with a fake
verifier says nothing about the real system.
