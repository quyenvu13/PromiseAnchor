# Testing guide and runtime evidence

## Automated project checks

Run:

```bash
pnpm verify
pnpm lint
pnpm build
```

These checks cover the shipped frontend, exact source artifact, configured deployment, and production method wiring. They do not pretend that a local JavaScript test can reproduce GenLayer validator consensus.

## Completed Project runtime proof

The following flow was completed on September 21, 2026 against the Project contract `0x87Ec1A70241F68587268505730f682434A03D062`.

| Check | Observed result |
| --- | --- |
| `create_promise` | GenVM `SUCCESS`; consensus `Accepted`; promise `1` created |
| `propose_exception` | GenVM `SUCCESS`; consensus `Accepted`; transaction finalized |
| Semantic output | `PROMISE_REMAINS_MEANINGFUL` |
| `acknowledge_exception` | GenVM `SUCCESS`; consensus `Accepted`; transaction finalized |
| Promise counters | attempts `1`; accepted `1`; active `1`; blocked `0` |
| Contract totals | promises `1`; exceptions `1`; limit per promise `3` |

Test data:

- Promise: `The lessor will replace any unit that fails inspection before the next rental period.`
- Proposed exception: `Replacement is not owed for damage caused by the renter's own modifications.`

The promisor submitted the exception, and a separate promisee wallet acknowledged it. The final Ledger state confirms that the accepted exception became active.

## Exact reviewer path

No wallet or new transaction is required to inspect the completed state.

1. Open https://promise-anchor.vercel.app/.
2. Confirm the header shows Studionet chain ID `61999`.
3. Confirm Live Contract State points to `0x87Ec1A70241F68587268505730f682434A03D062`.
4. Confirm the totals show `1` promise, `1` exception, and a limit of `3` per promise.
5. Select **Ledger — Inspect live state**.
6. Enter promise ID `1` and select **Load promise**.
7. Confirm the promise text matches the test data above.
8. Confirm the Ledger reports attempts `1`, accepted `1`, active `1`, and blocked `0`.
9. Confirm exception `#1` reports `PROMISE REMAINS MEANINGFUL` and is active.
10. Open the contract in Explorer and verify the deploy, `create_promise`, `propose_exception`, and `acknowledge_exception` entries.
11. Open the proposal transaction and verify GenVM `SUCCESS`, consensus `Accepted`, and the semantic output.
12. Open the acknowledgement transaction and verify GenVM `SUCCESS`, consensus `Accepted`, and finalized execution.

## Extended guard coverage

The exact v1.3 source was also exercised on the earlier contract deployment `0x654CeedeE5B9dEB926ec8b95f7A84098A7005B98`. That separate matrix covered role authorization, invalid promise IDs, identical exceptions, the maximum proposal limit, acknowledgement gating, and repeat acknowledgement rejection. This extended evidence is separate from the completed Project flow above.
