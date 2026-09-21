# Submission note

## Project identity

- Product / repository name: **PromiseAnchor**
- Intelligent Contract class: **ExceptionSwallowGuard**
- Project source filename: **PromiseAnchor.py**
- Contract version: **1.3**

## Deployment proof

- Live demo: https://promise-anchor.vercel.app/
- Studionet contract: `0x87Ec1A70241F68587268505730f682434A03D062`
- Deploy transaction: `0xb2a0347a9d8097f4d77e64d49aaaf8b8176cb6482b53ae544764f50a193c25a4`
- Explorer: https://explorer-studio.genlayer.com/address/0x87Ec1A70241F68587268505730f682434A03D062
- Source SHA-256: `9c6b21c82fde7002e06966b2cfafccb0488c310e060fba200a151b7cb8524e13`
- Source parity: exact, 20,982 bytes and 634 lines

The renamed project file does not alter the deployed source bytes. The class name and `get_config().name` remain `ExceptionSwallowGuard`, while the public product is presented as PromiseAnchor.

## Completed runtime result

- Methods: `create_promise` → `propose_exception` → `acknowledge_exception`
- GenVM result: `SUCCESS` for all three calls
- Consensus result: `Accepted`
- Semantic verdict: `PROMISE_REMAINS_MEANINGFUL`
- Final state: promises `1`; exceptions `1`; attempts `1`; accepted `1`; active `1`; blocked `0`

## Paste-ready description

PromiseAnchor records an immutable promise between two wallets and tests proposed exceptions through GenLayer semantic consensus. The contract asks whether an exception still leaves at least one realistic failure situation protected by the original promise. Only the on-chain promisor may propose an exception, and only the on-chain promisee may acknowledge an accepted result. The live Project flow was completed on Studionet: promise creation, semantic proposal, and promisee acknowledgement all returned GenVM SUCCESS with Accepted consensus. The exception received `PROMISE_REMAINS_MEANINGFUL`, then became active. The read-only Ledger now reports one attempt, one accepted exception, one active exception, and zero blocked acknowledgements. All displayed state is read from the deployed contract; the frontend contains no mocked activity or hardcoded user roles.
