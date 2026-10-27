# Cell Seal: Glossary

Every term has exactly one meaning across all documents and in the Cell Seal code. The **In the
UI** column is the wording the user sees: the UI never uses technical terms.

## 1. Product and parties

| Term | Meaning | In the UI |
|---|---|---|
| **Cell Seal** | The settlement layer that makes the amount of a fund transaction unreadable on the public ledger | Cell Seal |
| **Rail** | The core of Cell Seal: wrapper, settlement, disclosure. Contains no fund business logic | - |
| **Tokenization platform** | A third-party fund management platform: holds the fund token, the mint and burn rights, KYC, the order lifecycle, the apps. The customer of Cell Seal: buys contracts + SDK and integrates them into its own system | - |
| **Sandbox** | Fund console and investor app: two apps running on the SDK so that a tokenization platform can try the rail and go through a full cycle before integrating. Not a product, not operated as a service for real funds | - |
| **Fund console** | The fund-side sandbox app: create a fund with a sample token, process orders, set the price, settlement | Fund console |
| **Investor app** | The investor-side sandbox app: browse funds, invest, redeem, portfolio | - |
| **Case 1 / Case 2** | The two ways a fund is onboarded: the fund has no token yet and the token is created together with the wrapper / the fund already has a token with public holders. Procedures: [`onboarding.md`](onboarding.md); boundary and rules: [`integration.md`](integration.md) | - |
| **Issuer** | The legal entity that issues the fund's shares. Owns the token contract and the issuer account | Fund manager |
| **Fund ops** | The people who run the fund day to day on the issuer side | user name |
| **Transfer agent (TA)** | The party that keeps the fund's register. One of the key holders | Transfer agent |
| **Investor** | A party that passed KYC and was approved by the issuer, allowed to hold shares. Same as *holder* when speaking about on-chain state | Investor |
| **Auditor / regulator** | A party granted the right to read amounts within a scope and for a period | Auditor, Regulator |

## 2. Fund

| Term | Meaning | In the UI |
|---|---|---|
| **Fund** | An open-ended fund priced by NAV. One fund maps to exactly one share token | Fund |
| **Share** | The unit of ownership of the fund. One share = one unit of the share token | Share |
| **NAV** | Net asset value per share, published by the issuer every dealing day. **Always public** | Price per share |
| **Dealing day** | The day the fund prices and processes the orders received before cut-off | Dealing day / "Price set on" |
| **Cut-off** | The deadline for orders to be included in a dealing day. Orders arriving later fall into the next period | Order cut-off |
| **NAV strike** | The moment the NAV of a dealing day is fixed and published. Every pending order is priced from it | "Set price" / "Publish price" |
| **Forward pricing** | An order is placed before the price is known; the price is the NAV of the next dealing day. The reason every order has two legs separated in time | - |
| **Subscription** | The investor pays money to receive shares | Investment / "Invest" |
| **Redemption** | The investor returns shares to receive money | Redemption / "Redeem" |
| **Secondary transfer** | Transfer of shares between two investors, without the issuer | Transfer |
| **Fee** | Subscription or redemption fee, deducted when the payout is computed | Fee |
| **Register** | The record of who holds how many shares. With Cell Seal the register is rebuilt from decrypted data, not read from public balances | Register |

## 3. Orders and settlement

| Term | Meaning | In the UI |
|---|---|---|
| **Order** | A subscription, redemption or secondary transfer request. Always has two legs | Order |
| **Order reference** | The human-readable code of an order (`SB-0410`, `RD-0412`), used in the UI and in bank transfer descriptions. **Never carries an amount** | Order / Reference |
| **`order_id`** | The 32-byte identifier of an order, generated on the client. The only thing of an order that appears on chain, in the events of `settlement` | - |
| **Leg** | One half of an order. Each leg has its own status | - |
| **Share leg** | The leg that moves shares. Always on-chain, always sealed | "Shares received", "Shares issued" |
| **Cash leg** | The leg that moves money. Off-chain (fiat) or on-chain sealed (stablecoin) | "Money received", "Pay the investor" |
| **Leg status** | `pending` then `delivered` then `confirmed`. Changes only when the chain has confirmed, or when fund ops attest for an off-chain leg | the steps of an order |
| **Attest** | Fund ops manually confirm an off-chain event: fiat has arrived, or money has been paid | "Confirm money received", "Mark as paid" |
| **DoP** | *Delivery on Payment.* The two legs settle separately; the second leg is triggered only when the first is `confirmed`. Default for a fiat cash leg | Bank transfer |
| **DvP** | *Delivery versus Payment.* Both legs in one transaction, all-or-nothing; each side decrypts and checks the other side's amount before signing. The cash leg must be a sealed stablecoin | EURC |
| **Strike** | The moment the NAV of a dealing day is published and every pending order is *priced*. Nothing changes hands | "Price set on" |
| **Settlement** | When the settlement window closes: the net is wrapped or unwrapped, subscription shares are delivered, DvP legs are executed. The issuer mints or burns the public part on the platform's rail, before or after | Settlement day |
| **Settlement window** | A fixed period (for example weekly) at the end of which the issuer brings the supply change to the public ledger. Runs even when there are no orders | Settlement |
| **Net** | Total subscriptions minus total redemptions of one settlement window. The only number that becomes public | Net |
| **Cover** | How well the net of a window hides the individual orders inside it. Low when the window has too few orders or one order makes up almost all of it | Privacy: Good / Low |

## 4. Privacy

| Term | Meaning | In the UI |
|---|---|---|
| **Sealed** | An amount that sits on chain in unreadable form. Opposite: *public* | "Only you can see this" |
| **Public** | Readable by anyone from the chain or published by the fund: addresses, timestamps, transaction type, NAV, total supply, the net of a window | - |
| **Confidentiality** | Hiding *how much*, not *who*. This is what Cell Seal does | - |
| **Anonymity** | Hiding *who*. Cell Seal does **not** do this; holder addresses are always public | - |
| **Commitment** | An on-chain value that stands for an amount without revealing it. It can be added and subtracted, so the chain can check conservation | - |
| **Proof** | A zero-knowledge proof attached to a sealed transaction. Proves the transaction is valid without revealing the amount | "Preparing the order takes a few seconds" |
| **Conservation** | A proven property: total in = total out, no share is created or destroyed | - |
| **Range** | A proven property: the amount and the balance after the transaction are not negative | - |
| **Amount-blind** | A property of the backend: it only stores and forwards ciphertext and has no key to read any amount | - |
| **Order secret** | The secret part of an order (amount, bank details), sealed in a sealed box to the fund and to the investor | - |
| **Opening** | The pair `(v, r)` that opens a commitment. Whoever has the opening can check `v*G + r*H` against the on-chain commitment | - |
| **Leak** | Any path by which a sealed amount can be inferred from public data. List: [`flows.md`](flows.md) §8 | - |

## 5. Keys and disclosure

| Term | Meaning | In the UI |
|---|---|---|
| **Stellar key** | The user's wallet key. Signs transactions | Wallet |
| **Privacy key** | The investor's key pair inside a wrapper: a spending key to build proofs, a viewing key (derived from the spending key) to decrypt their own balance and amounts. **Derived deterministically from one signature of the Stellar wallet**: no separate seed phrase, never sent to Cell Seal, registered on chain once and not rotatable | "Sign to create your privacy key" |
| **Viewing key** | The fund's key to decrypt every amount in the fund. It is the primitive's *auditor key*: one key per `auditor_id`, and every investor of the fund is forced to use that `auditor_id`. Distinct from the key the issuer uses day to day as a party to an order | - |
| **Ops root** | 32 random bytes per fund, the root of the privacy key of the settlement account and of the fund's box key. Handed to fund ops through an envelope | - |
| **Box key** | An X25519 key for encrypting off-chain data (order secret, envelope). Each user and each fund has one | - |
| **Envelope** | A secret (ops root, viewing key share) sealed to the recipient's box key and stored in the backend | - |
| **Key share** | One part of the viewing key, held by one key holder | Approval |
| **Key holder** | A party holding a key share: typically issuer, transfer agent, regulator | Party |
| **Key epoch** | One generation of the viewing key. `rotate_key` opens a new epoch; the old epoch is still needed to read its history | - |
| **k-of-n** | `k` of the `n` key holders must take part to open the viewing key. Cell Seal is never one of the `n` | "2 of 3" |
| **Disclosure** | Opening amounts to a party, within a defined scope and period | Audit access |
| **Disclosure request** | A request to open: who reads, what, which period, when it expires. Needs `k` approvals | Request |
| **Unlock log** | The log of every use of the viewing key | History |

## 6. On-chain

| Term | Meaning |
|---|---|
| **Share token** / **fund token** | The platform's SEP-41 token representing the fund's shares. The platform's issuer mints and burns it; Cell Seal has no rights on it. Its supply is public |
| **Wrapper** | The contract that holds the share token and issues sealed balances 1:1 against it. Every sealed transfer happens inside it |
| **Share wrapper / cash wrapper** | The wrapper of the share token / of a stablecoin. DvP needs both |
| **Wrap / unwrap** | Moving tokens into / out of the wrapper. **The amount of a wrap or unwrap is public**, which is why a redemption never unwraps per order |
| **Confidential transfer** | A transfer inside the wrapper: public addresses, sealed amount |
| **Settlement account** | The issuer's account inside the wrapper: receives shares when investors redeem, holds shares awaiting delivery for subscriptions. At the end of a window the net is wrapped into or unwrapped out of this account; the issuer funds or retires the public part on the platform's rail |
| **Receiving / spendable balance** | The two compartments of an account's balance inside the wrapper. Newly received shares sit in *receiving*; only *spendable* can be transferred out |
| **Merge** | Folding receiving into spendable. No proof needed, no amount revealed. The investor app does it automatically before building an order |
| **Spender / allowance** | Delegating to another address the right to move part of the sealed shares. The delegated part is split off from spendable. Used for orders awaiting NAV |
| **`settlement`** | The Cell Seal contract that every sealed transfer must go through: attaches the `order_id`, executes DvP, closes the settlement window |
| **Hook** | The wrapper's extension point, run before every operation. Cell Seal uses it to enforce the anti-leak rules |
| **Policy** | The rules checked before every confidential transfer: whitelist, KYC, freeze |
| **Whitelist** | The list of addresses approved by the issuer. Addresses outside the list cannot receive shares |
| **Freeze** | The issuer blocks an address from sending and receiving |
| **Position limit** | The maximum share of total supply one investor may hold. Checked on sealed numbers, so it must be done by proof |
| **Clawback** | The issuer takes shares back from a frozen address without the holder's signature, under a court order or sanction. **The amount of a clawback is public** |
| **Indexer** | The service that reads on-chain events and builds the read model. Never sees a plaintext amount |

## 7. Pairs that are easy to confuse

| Do not confuse | With | Difference |
|---|---|---|
| Settlement window | Dealing day | The dealing day is when orders are *priced*. The settlement window is when *supply changes publicly*. One window can contain several dealing days |
| Privacy key | Viewing key | The privacy key reads the numbers of *one investor*. The viewing key reads the numbers of *the whole fund* and needs k-of-n |
| Viewing key | The issuer's day-to-day key | The issuer is a party to every subscription and redemption, so it reads amounts with its own privacy key. The viewing key is needed only for audit, for the regulator and for secondary transfers |
| Sealed | Off-chain | Sealed still sits on chain and is checked by the chain. Off-chain means the chain knows nothing |
| DoP | "Not safe" | DoP only carries counterparty risk between an investor and a licensed issuer, a risk the fund industry already accepts |
| Register | Share token balance | After wrapping, the public balance only shows that the wrapper holds everything. The register is what is rebuilt from decrypted data |
| Sealed supply | Total supply | `supply_after` is `balance(token, wrapper)`, the wrapped part. In Case 2 the total supply also contains the public part that is not yet wrapped |
