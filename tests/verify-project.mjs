import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { strict as assert } from "node:assert";

const source = await readFile(new URL("../contracts/PromiseAnchor.py", import.meta.url));
const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const digest = createHash("sha256").update(source).digest("hex");

assert.equal(digest, "9c6b21c82fde7002e06966b2cfafccb0488c310e060fba200a151b7cb8524e13", "contract source hash changed");
assert.match(page, /0x87Ec1A70241F68587268505730f682434A03D062/, "fresh contract address missing");
assert.doesNotMatch(page, /0x654CeedeE5B9dEB926ec8b95f7A84098A7005B98/i, "qualification address leaked into production UI");
for (const method of ["create_promise", "propose_exception", "acknowledge_exception", "get_config", "get_promise", "get_attempts"]) {
  assert.ok(page.includes(method), `missing production method: ${method}`);
}
assert.equal(source.toString("utf8").split("\n").length, 635, "unexpected source line count");
console.log("PASS PromiseAnchor project verification");
console.log(`PASS source SHA-256 ${digest}`);
console.log("PASS fresh deployment address only");
console.log("PASS production read/write method coverage");
