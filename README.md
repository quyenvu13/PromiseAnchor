# PromiseAnchor

PromiseAnchor is a GenLayer dApp for recording immutable promises and testing proposed exceptions through decentralized semantic consensus. The product name is intentionally different from the Intelligent Contract class (`ExceptionSwallowGuard`).

## Live deployment

- Network: GenLayer Studionet
- Chain ID: `61999`
- Contract: `0x87Ec1A70241F68587268505730f682434A03D062`
- Deploy transaction: `0xb2a0347a9d8097f4d77e64d49aaaf8b8176cb6482b53ae544764f50a193c25a4`
- Explorer: https://explorer-studio.genlayer.com/address/0x87Ec1A70241F68587268505730f682434A03D062
- Contract version: `1.3`
- Project contract file: `contracts/PromiseAnchor.py`
- Source SHA-256: `9c6b21c82fde7002e06966b2cfafccb0488c310e060fba200a151b7cb8524e13`

## Product flow

1. Any connected wallet can create a promise and becomes its on-chain promisor.
2. The promisor can propose up to three unique exceptions.
3. GenLayer validators classify whether the original promise remains meaningful.
4. The promisee can acknowledge an accepted exception, making it active.
5. Anyone can inspect promise and exception state without connecting a wallet.

No user role is hardcoded in the frontend. The contract derives authorization from stored promise state and rejects unauthorized calls.

## Local development

```bash
pnpm install
pnpm dev
```

Then open the local URL, connect an EIP-1193 wallet, and approve switching to Studionet when prompted.

## Verification

```bash
pnpm verify
pnpm lint
pnpm build
```

`pnpm verify` freezes the exact contract source hash, fresh deployment address, production method set, and absence of the old qualification address from the UI.

## Stack

- React 19 / Next.js 16
- TypeScript
- Tailwind CSS
- `genlayer-js` 1.1.x
- GenLayer Studionet RPC: `https://studio.genlayer.com/api`

See [TESTING.md](./TESTING.md) for the runtime test boundary and [SUBMISSION.md](./SUBMISSION.md) for reviewer-facing deployment evidence.
