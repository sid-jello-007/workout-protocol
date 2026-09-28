// Core calculations for Workout Protocol.
// Pure functions only, so they can be unit tested without a browser.

export const KCAL_PER_KG = 7700; // widely used approximation for 1 kg of body mass change

export const ACTIVITY = {
  sedentary: { label: "Sedentary (desk job, little exercise)", factor: 1.2 },
  light: { label: "Light (1 to 3 sessions a week)", factor: 1.375 },
  moderate: { label: "Moderate (3 to 5 sessions a week)", factor: 1.55 },
  high: { label: "High (6 to 7 sessions a week)", factor: 1.725 },
  athlete: { label: "Very high (physical job plus training)", factor: 1.9 },
};

// Mifflin-St Jeor resting energy estimate.
export function bmr({ sex, age, heightCm, weightKg }) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(sex === "female" ? base - 161 : base + 5);
}

export function tdee(profile) {
  const factor = ACTIVITY[profile.activity]?.factor ?? 1.2;
  return Math.round(bmr(profile) * factor);
}

// rateKgPerWeek: negative to lose, positive to gain, 0 to maintain.
// Guardrails: never go below BMR on a cut, cap weekly change at 1% of bodyweight.
export function calorieTarget(profile, rateKgPerWeek) {
  const maintenance = tdee(profile);
  const cap = profile.weightKg * 0.01;
  const rate = Math.max(-cap, Math.min(cap, rateKgPerWeek));
  const dailyDelta = (rate * KCAL_PER_KG) / 7;
  const floor = bmr(profile);
  const raw = Math.round(maintenance + dailyDelta);
  const target = rate < 0 ? Math.max(raw, floor) : raw;
  // If the BMR floor kicks in, the real rate is slower than requested. Report the real one.
  const effectiveRate = +(((target - maintenance) * 7) / KCAL_PER_KG).toFixed(2);
  return {
    maintenance,
    target,
    appliedRate: rate < 0 && raw < floor ? effectiveRate : rate,
    rateWasCapped: rate !== rateKgPerWeek,
    hitFloor: rate < 0 && raw < floor,
  };
}

// Protein scales with bodyweight; fat is a share of calories; carbs fill the rest.
export function macros(targetKcal, weightKg, goal) {
  const proteinPerKg = goal === "lose" ? 2.2 : goal === "gain" ? 1.8 : 2.0;
  const protein = Math.round(weightKg * proteinPerKg);
  const fat = Math.round((targetKcal * 0.25) / 9);
  const carbs = Math.max(0, Math.round((targetKcal - protein * 4 - fat * 9) / 4));
  return { protein, fat, carbs };
}

// Week by week projection of bodyweight toward a goal.
export function projectWeight(startKg, goalKg, rateKgPerWeek, maxWeeks = 104) {
  const points = [{ week: 0, kg: startKg }];
  if (rateKgPerWeek === 0 || Math.sign(goalKg - startKg) !== Math.sign(rateKgPerWeek)) {
    return { points, weeks: null };
  }
  let kg = startKg;
  for (let w = 1; w <= maxWeeks; w++) {
    kg += rateKgPerWeek;
    const reached = rateKgPerWeek < 0 ? kg <= goalKg : kg >= goalKg;
    points.push({ week: w, kg: reached ? goalKg : +kg.toFixed(2) });
    if (reached) return { points, weeks: w };
  }
  return { points, weeks: null };
}

// 7 entry rolling average smooths daily water swings in scale weight.
export function rollingAverage(values, window = 7) {
  return values.map((_, i) => {
    const slice = values.slice(Math.max(0, i - window + 1), i + 1).filter((v) => v != null);
    return slice.length ? +(slice.reduce((a, b) => a + b, 0) / slice.length).toFixed(2) : null;
  });
}

// Adaptive maintenance estimate from the user's own log:
// average intake minus the energy implied by the trend change.
// Needs at least 14 days with both weight and calories logged.
export function observedMaintenance(log) {
  const days = log.filter((d) => d.weightKg != null && d.kcal != null);
  if (days.length < 14) return null;
  const trend = rollingAverage(days.map((d) => d.weightKg));
  const spanDays = (new Date(days.at(-1).date) - new Date(days[0].date)) / 86400000;
  if (spanDays < 13) return null;
  const avgIntake = days.reduce((a, d) => a + d.kcal, 0) / days.length;
  const kgChange = trend.at(-1) - trend[6];
  const dailyEnergyFromChange = (kgChange * KCAL_PER_KG) / Math.max(1, spanDays - 6);
  return Math.round(avgIntake - dailyEnergyFromChange);
}
