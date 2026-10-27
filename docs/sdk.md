# Cell Seal: Client SDK

> Package `@cell-seal/sdk`, TypeScript. It is the only place in the system that touches private
> keys and plaintext amounts. OpenZeppelin ships a spec for an SDK (`docs/sdk/` on `v0.9.0`) but
> does not ship an SDK; this package implements that spec and adds the Cell Seal layer. It is a
> **product**: a tokenization platform integrates this package into its own app
> ([`integration.md`](integration.md) §7).

## 1. Goals

| Goal | Meaning |
|---|---|
| Compatible with the primitive | Passes the test vectors in the upstream `docs/sdk/conformance.md`. Another wallet built on the same primitive can read an account created by this SDK, and the other way round |
| Keys never leave the Web Worker | The main thread only sees opaque handles, never `sk`, `vk` or a root |
| Usable outside Cell Seal | The `core` and `token` layers do not depend on the Cell Seal backend or contracts. This is the public-good part |
| Refuse rather than guess | Artifact hash mismatch, opening not matching the commitment, non-deterministic signature: throw a coded error, never self-correct |

## 2. Layers

```
@cell-seal/sdk
|-- core/        Grumpkin, Poseidon2, Pedersen, ECDH, address-to-field, scalar sampling
|-- keys/        signer root, raw root, derivation of sk, vk, dvk, box key
|-- prover/      bb.js in a Web Worker, artifact management, proof queue
|-- wallet/      openings, event replay, checkpoints, merge, wallet lock while work is pending
|-- token/       seal-token client: register, transfer, set_spender, withdraw, merge
|-- box/         sealed box: OrderSecret, envelopes
|-- threshold/   DKG, partial decrypt, DLEQ, combine
|-- seal/        Cell Seal specific: settlement, fund-registry, orders, openings
`-- rpc/         Stellar RPC plus indexer, stitched at the seam
```

`core`, `keys`, `prover`, `wallet` and `token` implement the upstream spec. `box`, `threshold` and
`seal` belong to Cell Seal.

## 3. Worker model

```mermaid
flowchart LR
    UI["React, main thread"] -- "postMessage: command + handle" --> W["SealWorker"]
    W -- "result: transaction XDR, decrypted numbers" --> UI
    W --- K["keys, wallet, prover"]
    UI -- "sign transaction" --> F["Wallet (Freighter)"]
```

The main thread cannot import the modules that hold keys; `SealWorker` is the single entry point
and exposes only a message-based API. Decrypted amounts *are* returned to the main thread because
the UI has to display them; keys are not.

## 4. API

### 4.1 Session

```ts
const seal = await SealClient.connect({
  network: "testnet",
  rpcUrl, indexerUrl, apiUrl,
  registry: "C...",
  wallet: freighterAdapter,
});

await seal.unlock();
await seal.lock();
seal.on("locked" | "synced" | "proofProgress", handler);
```

`unlock()` requests the root signature from the wallet (twice, and compares), checks the signature
against the expected public key, derives the keys inside the worker, then overwrites the signature.
It throws `E_NONDETERMINISTIC_SIGNER` if the two signatures differ and `E_SIGNER_MISMATCH` if the
signature does not belong to the selected account.

### 4.2 Accounts and balances

```ts
await seal.token(wrapper).register({ auditorId });
const bal = await seal.token(wrapper).balance();
// { spendable: bigint, receiving: bigint, pendingAllowances: [...], syncedLedger: number }
await seal.token(wrapper).merge();
```

`balance()` syncs first: it reads the event tail from RPC and the older part from the indexer,
stitches them at the seam, replays them into the openings, then checks `v*G + r*H` against the
on-chain `confidential_balance()`. On a mismatch it throws `E_STATE_DIVERGED` and forces a rebuild
from the checkpoint.

### 4.3 Orders

```ts
const order = await seal.orders.createSubscription({
  fundId, amount: "12400000.00", currency: "EUR", pay: "bank",
});
// -> { orderId, reference, wire: { iban, bic, beneficiary } }

const order = await seal.orders.createSubscription({ fundId, amount, pay: "cash:EURC" });
// SDK: merge if needed -> set_spender(cash wrapper, settlement account, allowance = amount)

const order = await seal.orders.createRedemption({ fundId, shares: "47952431.18", receive: "bank" });
// SDK: merge if needed -> submit_leg(order_id, Share, investor -> settlement account)

const order = await seal.orders.createRedemption({ fundId, shares, receive: "cash:EURC" });
// SDK: set_spender(share wrapper, settlement account, allowance = shares)

await seal.orders.cancel(orderId);
const list = await seal.orders.list({ fundId });
```

Every `create*` call runs the same chain of work: generate `order_id`, build the `OrderSecret`,
seal two copies, send metadata and ciphertext to the backend, and, if there is an on-chain leg,
build the transaction, generate the proof, hand it to the wallet to sign, submit, and wait for the
indexer to confirm.

### 4.4 Fund side

```ts
const ops = await seal.fund(fundId).asOps();

const orders = await ops.orders.list({ status: "awaiting_price" });
await ops.orders.attest(orderId, "cash_received");
await ops.orders.attest(orderId, "cash_paid");

await ops.nav.publish({ dealingDay, nav: "1.0427" });
const priced = await ops.nav.priceOrders(dealingDay);

const plan = await ops.window.plan();
// { net: bigint, deliveries: [...], dvp: [...], cover: { orders, largestShare } }
await ops.window.close(plan);

const register = await ops.register.build();
await ops.register.verifyOpening(orderId, opening);
```

`window.close` does not mint and does not burn. With `net > 0` the SDK checks
`balance(token, settlement account) >= net` and refuses with `E_NET_NOT_FUNDED` if the issuer has
not funded the account; with `net < 0`, after closing, the SDK reports the public amount now
sitting in the settlement account so the issuer can retire it
([`integration.md`](integration.md) §4).

`window.close(plan)` runs in a fixed order: `close_window(net)`, then deliver shares to each DoP
subscription with `submit_leg`, then `settle_dvp` for each DvP order. The proofs depend on each
other through the settlement account's `C_spend`, so they are generated **sequentially**; the SDK
precomputes each `C_spend'` so the next proof can be built without waiting for the previous
transaction to confirm, then submits them one by one. If a transaction fails, it stops, resyncs,
and regenerates the remaining proofs.

### 4.5 Secondary transfer

```ts
const offer = await seal.pair.propose({ fundId, counterparty, shares, cash, cashWrapper });
const check = await seal.pair.inspect(incomingOffer);
// { theyDeliver: bigint, matchesAgreed: boolean }
await seal.pair.accept(incomingOffer);
```

`inspect` decrypts the amount of the leg this side receives and returns it for the UI to show;
`accept` signs only when `matchesAgreed`. After `settle_pair` is confirmed, the SDK of the side
receiving shares sends the opening to the fund automatically.

### 4.6 Key holder

```ts
const holder = await seal.keyHolder(fundId);
await holder.dkg.join(ceremonyId);
const requests = await holder.requests.list();
await holder.requests.approve(requestId);
const result = await seal.disclosure.open(requestId);
```

`approve` re-checks the scope of the request against the event list fetched from the indexer,
computes `D_i` with a DLEQ proof for every `R_e` in scope, and uploads them. `open` runs on the
reader's side: it collects `k_t` sets of partials, checks the DLEQ proofs, combines, decrypts, and
checks the opening against the commitment.

### 4.7 Platform onboarding

Calls the platform uses to put a fund on the rail ([`onboarding.md`](onboarding.md),
[`integration.md`](integration.md) §7):

| Step | Call |
|---|---|
| Deploy the fund's wrapper and register it with `settlement` and `fund-registry` | `seal.platform.deployFund(...)` |
| Register the settlement account in the share wrapper and cash wrappers | `seal.fund(id).asOps().register()` |
| Mirror an investor's KYC status into `fund-policy` | `ops.investors.set(account, status, kycExpiry)` |
| Holder self-wrap of an existing public balance (Case 2) | `wallet.register()`, then `wallet.wrap(amount)` |

## 5. Prover

| Topic | Rule |
|---|---|
| Artifacts | `{circuit}.json` (ACIR) and `{circuit}.vk`, lazily loaded, cached in Cache Storage by hash |
| Pinning | A `circuit -> sha256` table compiled into the SDK. On `connect`, the SDK compares the `vk` with `seal-verifier.get_verification_key`; on a mismatch it throws `E_VK_MISMATCH` and locks every proof-generating operation |
| Multithreading | Used when the page is cross-origin isolated. The SDK exposes `seal.capabilities.threads` so the UI can estimate durations |
| Queue | One proof at a time per account, because each proof depends on the `C_spend` produced by the previous one |
| Progress | `proofProgress` event by stage: `witness`, then `prove`, then `done` |
| Cancel | Cancellable in the `witness` stage; in `prove` it waits for completion and discards the result |

## 6. Wallet lock while work is pending

A proof is bound to `C_spend` at the time it is built. The SDK keeps one logical lock per
(wrapper, account) pair:

| State | Allowed |
|---|---|
| `idle` | Every operation |
| `proof_built`: proof generated, transaction not yet confirmed | No operation that changes `C_spend`, including `merge` |
| `pair_pending`: one leg of `settle_pair` signed, waiting for the counterparty | As above, until the authorization entry expires |

DvP orders with the fund do **not** lock the wallet: the allowance is already separated from
`C_spend`.

## 7. Error codes

| Code | Meaning | What the UI should do |
|---|---|---|
| `E_NONDETERMINISTIC_SIGNER` | The wallet returned two different signatures | Offer to create a raw root, with a mandatory backup step |
| `E_SIGNER_MISMATCH` | The signature does not belong to the selected account | Ask the user to select the right account in the wallet |
| `E_SIGNER_ROTATED` | The enrolled signer is no longer on the account | Warn and link to the recovery guidance |
| `E_STATE_DIVERGED` | Openings do not match the on-chain commitment | Rebuild from checkpoint; block proof generation |
| `E_VK_MISMATCH` | The on-chain verification key differs from the pinned one | Block; require an app update |
| `E_WALLET_LOCKED` | A proof or leg is pending | Show the pending work |
| `E_INSUFFICIENT_SPENDABLE` | Spendable is insufficient although the total is enough | `merge` automatically and retry once |
| `E_DELEGATION_EXISTS` | A DvP order is already pending on this wrapper | Show the pending order |
| `E_POLICY_DENIED` | Policy rejected `from` or `to` | Show KYC or whitelist status |
| `E_FROZEN` | The account is frozen | Show the fund's contact details |
| `E_BOX_OPEN_FAILED` | The sealed box could not be opened, or the `order_id` inside does not match | Flag the order as tampered |
| `E_DLEQ_INVALID` | A key holder's partial decryption is wrong | Drop that partial and name the key holder |
| `E_OPENING_INVALID` | The opening does not match `C_t` | Flag the secondary transfer as unverified |

## 8. Testing

| Layer | How |
|---|---|
| `core`, `keys` | Upstream test vectors; property tests for rejection sampling, address-to-field, canonical encoding |
| `wallet` | Replay randomly generated event sequences and compare openings with a reference model; fuzz event order within a ledger |
| `prover` | Real proofs against the real verifier on the `local` network; no mocks |
| `box`, `threshold` | Self-generated vectors with negative tests: tampered ciphertext, swapped `order_id`, wrong share, forged DLEQ |
| `seal` | End-to-end integration test on `local`: create fund, subscribe, strike, close window, redeem |
| Compatibility | An account created with this SDK is readable with the upstream demo SDK, and the other way round |

## 9. Release

`core`, `keys`, `prover`, `wallet` and `token` are released first, as a package usable
independently of Cell Seal. `box`, `threshold` and `seal` follow once the settlement contract
and the threshold protocol are stable. Each SDK version states the `stellar-contracts` commit and the nargo and bb
versions it is compatible with.
