import test from "node:test";
import assert from "node:assert";
import { getProvider } from "../src/payments/registry";
test("mock bloqueado fora do emulador", () => {
  delete process.env.FUNCTIONS_EMULATOR; process.env.PAYMENT_PROVIDER = "mock";
  assert.throws(() => getProvider(), /PAYMENT_UNAVAILABLE/);
});
test("mock permitido no emulador", () => {
  process.env.FUNCTIONS_EMULATOR = "true";
  assert.equal(getProvider().name, "mock");
});
