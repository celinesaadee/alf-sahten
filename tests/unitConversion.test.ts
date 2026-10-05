import assert from "node:assert/strict";
import test from "node:test";
import { convertMeasurement } from "../src/lib/unitConversion.ts";
test("compatible weights and language aliases", () => {
  assert.deepEqual(convertMeasurement(2, "lbs", "metric"), { quantity: 907.18474, unit: "g" });
  assert.deepEqual(convertMeasurement(1000, "grammes", "metric"), { quantity: 1, unit: "kg" });
  assert.equal(convertMeasurement(500, "g", "us")?.unit, "lb");
  assert.equal(convertMeasurement(1, "كغ", "us")?.unit, "lb");
});
test("explicit US volumes and metric conversions", () => {
  assert.deepEqual(convertMeasurement(2, "litres", "metric"), { quantity: 2, unit: "l" });
  assert.deepEqual(convertMeasurement(1, "US fl oz", "metric"), { quantity: 29.5735295625, unit: "ml" });
  assert.equal(convertMeasurement(250, "مل", "us")?.unit, "usFluidOunces");
});
test("original and ambiguous units and invalid quantities stay unchanged", () => {
  for (const unit of ["cup", "tasses", "أكواب", "tbsp", "fl oz", "eggs", "pinch", ""])
    assert.equal(convertMeasurement(2, unit, "metric"), null, unit);
  assert.equal(convertMeasurement(2, "g", "original"), null);
  for (const invalid of [NaN, Infinity, -1]) assert.equal(convertMeasurement(invalid, "g", "us"), null);
});
test("scale before conversion; no round-trip drift", () => {
  const doubled = convertMeasurement(100 * 2, "g", "us");
  assert.ok(doubled);
  assert.ok(Math.abs(doubled.quantity * 28.349523125 - 200) < 1e-8);
  assert.deepEqual(convertMeasurement(100 * 2, "g", "metric"), { quantity: 200, unit: "g" });
});
