---
layout: home
title: Cell Seal
hero:
  name: Cell Seal
  image:
    src: /logo.svg
    alt: Cell
  text: Confidential settlement for tokenized fund shares on Stellar
  tagline: The amount of every transaction is sealed on the public ledger. The issuer, the transfer agent and the regulator can still read everything.
  actions:
    - theme: brand
      text: Overview
      link: /seal/overview
    - theme: alt
      text: Technical Architecture Document
      link: /seal/architecture
    - theme: alt
      text: Contracts
      link: /seal/contracts
features:
  - title: Sealed
    details: Every amount on chain is a Pedersen commitment, not a readable number. Addresses, timestamps and order references stay public.
  - title: Proven
    details: Every transaction carries an UltraHonk proof of conservation, range and policy, verified on Soroban. The chain rejects a wrong number without reading it.
  - title: Disclosed
    details: The viewing key is split k-of-n between issuer, transfer agent and regulator. They rebuild 100% of the register. Cell Seal holds no key.
---

## How to read

Start with the [Overview](/seal/overview), which says what the product does, for whom and what it
does not do, and keep the [Glossary](/seal/glossary) at hand. Then read the **Technical
Architecture Document**, the summary of the whole design: components, Stellar integration, order
flow, security, infrastructure, what exists on testnet. The documents after it are the **design in
detail**, and each is the specification of its part. Every section of the summary links to the
detailed document that covers it.

| Read | Scope | Documents |
|---|---|---|
| First | Both | [Overview](/seal/overview), [Glossary](/seal/glossary), [Technical Architecture Document](/seal/architecture) |
| Product, what a platform receives | Contracts, SDK, onboarding | [Flows](/seal/flows), [Integration](/seal/integration), [Onboarding a fund](/seal/onboarding), [Primitives](/seal/primitives) |
| Design in detail | How it is built | [System architecture](/seal/system-architecture), [Contracts](/seal/contracts), [Cryptography](/seal/cryptography), [Keys](/seal/keys), [SDK](/seal/sdk), [Security](/seal/security) |
| Sandbox, the reference platform | Not the product. For evaluation | [Backend](/seal/backend), [Frontend](/seal/frontend) |
