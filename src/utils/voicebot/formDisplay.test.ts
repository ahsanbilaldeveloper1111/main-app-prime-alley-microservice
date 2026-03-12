/**
 * Unit tests for voicebot form/display helpers.
 * Run with: npx ts-node --compiler-options '{"module":"CommonJS"}' src/utils/voicebot/formDisplay.test.ts
 * Or with Jest when configured: npx jest src/utils/voicebot/formDisplay.test.ts
 */
import assert from "node:assert";
import { toFormString, safeDisplayString, firstString } from "./formDisplay";

function runTests(): void {
  // toFormString
  assert.strictEqual(toFormString(null), "");
  assert.strictEqual(toFormString(undefined), "");
  assert.strictEqual(toFormString("hello"), "hello");
  assert.strictEqual(toFormString(42), "42");
  assert.strictEqual(toFormString(true), "true");
  const d = new Date("2025-01-15T12:00:00.000Z");
  assert.strictEqual(toFormString(d), "2025-01-15T12:00:00.000Z");
  assert.strictEqual(toFormString({}), "");
  assert.strictEqual(toFormString({ a: 1 }), "");

  // safeDisplayString
  assert.strictEqual(safeDisplayString(null), "—");
  assert.strictEqual(safeDisplayString(undefined), "—");
  assert.strictEqual(safeDisplayString(null, "N/A"), "N/A");
  assert.strictEqual(safeDisplayString("hello"), "hello");
  assert.strictEqual(safeDisplayString(42), "42");
  assert.strictEqual(safeDisplayString(false), "false");
  assert.strictEqual(safeDisplayString({}), "—");
  assert.strictEqual(safeDisplayString({}, "?"), "?");

  // firstString
  assert.strictEqual(firstString("a", "b", "c"), "a");
  assert.strictEqual(firstString(1, "b", 3), "b");
  assert.strictEqual(firstString(), "");
  assert.strictEqual(firstString(null, undefined, 1, {}), "");
}

runTests();
console.log("formDisplay.test.ts: all assertions passed.");
export { runTests };
