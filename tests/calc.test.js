// Run with: npm test
import test from "node:test";
import assert from "node:assert/strict";
import { bmr, tdee, calorieTarget, macros, projectWeight, rollingAverage, observedMaintenance } from "../src/calc.js";
import { buildPlan, chooseSplit } from "../src/plan.js";

const p = { sex: "male", age: 30, heightCm: 175, weightKg: 80, activity: "moderate" };

test("BMR matches Mifflin-St Jeor", () => {
  assert.equal(bmr(p), 1749); // 800 + 1093.75 - 150 + 5
  assert.equal(bmr({ ...p, sex: "female" }), 1583);
});

test("TDEE applies activity factor", () => {
  assert.equal(tdee(p), Math.round(1749 * 1.55));
});

test("cut target is capped at 1% bodyweight per week", () => {
  const t = calorieTarget(p, -2);
  assert.equal(t.appliedRate, -0.8);
  assert.equal(t.rateWasCapped, true);
});

test("cut target never drops below BMR", () => {
  const small = { ...p, activity: "sedentary", weightKg: 50, heightCm: 155 };
  const t = calorieTarget(small, -0.5);
  assert.ok(t.target >= bmr(small));
});

test("macros add up to roughly the calorie target", () => {
  const m = macros(2200, 80, "lose");
  const kcal = m.protein * 4 + m.carbs * 4 + m.fat * 9;
  assert.ok(Math.abs(kcal - 2200) < 10);
  assert.equal(m.protein, 176);
});

test("projection reaches goal and stops", () => {
  const r = projectWeight(80, 78, -0.5);
  assert.equal(r.weeks, 4);
  assert.equal(r.points.at(-1).kg, 78);
});

test("projection returns null when rate points away from goal", () => {
  assert.equal(projectWeight(80, 75, 0.25).weeks, null);
});

test("rolling average smooths values", () => {
  assert.deepEqual(rollingAverage([1, 2, 3], 2), [1, 1.5, 2.5]);
});

test("observed maintenance needs 14 days, then recovers the true value", () => {
  assert.equal(observedMaintenance([]), null);
  // Eat 2000/day while losing 0.1 kg/day => true maintenance ~ 2000 + 770 = 2770
  const log = Array.from({ length: 28 }, (_, i) => ({
    date: new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10),
    weightKg: 90 - 0.1 * i,
    kcal: 2000,
  }));
  const est = observedMaintenance(log);
  assert.ok(Math.abs(est - 2770) < 30, `got ${est}`);
});

test("split selection by training days", () => {
  assert.equal(chooseSplit(3), "full");
  assert.equal(chooseSplit(4), "upperLower");
  assert.equal(chooseSplit(6), "ppl");
});

test("plan respects equipment", () => {
  const plan = buildPlan({ daysPerWeek: 3, experience: "beginner", equipment: "bodyweight" });
  assert.equal(plan.days.length, 3);
  assert.ok(plan.days[0].exercises.some((x) => x.name === "Push up"));
});

test("when BMR floor applies, reported rate reflects the real deficit", () => {
  const sed = { ...p, activity: "sedentary" };
  const t = calorieTarget(sed, -0.5);
  assert.equal(t.hitFloor, true);
  assert.ok(t.appliedRate > -0.5 && t.appliedRate < 0);
});
