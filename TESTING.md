# Testing guide

## Automated project checks

Run:

```bash
pnpm verify
pnpm lint
pnpm build
```

These checks cover the shipped frontend, exact source artifact, configured deployment, and production method wiring. They do not pretend that a local JavaScript test can reproduce GenLayer validator consensus.

## Existing Intelligent Contract evidence

The byte-identical v1.3 source was exercised on the qualification deployment `0x654CeedeE5B9dEB926ec8b95f7A84098A7005B98`. The previously completed matrix covered the core K1–K4 path plus negative cases N1–N7, including role authorization, invalid IDs, duplicate exceptions, proposal limit enforcement, acknowledgement gating, and repeat acknowledgement rejection.

## Fresh project smoke test

Use the deployed Project contract `0x87Ec1A70241F68587268505730f682434A03D062`.

1. Open PromiseAnchor and verify the header shows Studionet `61999`.
2. Confirm the live counters begin from the contract state shown in Explorer.
3. Connect wallet A, create a promise to wallet B, and retain the returned transaction hash.
4. As wallet A, propose one exception and wait for its consensus verdict.
5. Load the promise in Ledger and verify counts and verdict match the contract.
6. If accepted, connect wallet B and acknowledge the exception.
7. Reload Ledger and verify the exception is active.
8. Try proposing from wallet B and acknowledging from wallet A; both must be rejected by the contract.

Record Project transaction hashes separately from the qualification test evidence.
