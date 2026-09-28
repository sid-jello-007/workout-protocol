// Rule based workout plan generator.
// Picks a split from training days, then fills each day from an exercise library
// filtered by available equipment, with volume set by experience level.

const LIB = {
  squat: { gym: "Back squat", dumbbells: "Goblet squat", bodyweight: "Bulgarian split squat" },
  hinge: { gym: "Romanian deadlift", dumbbells: "Dumbbell Romanian deadlift", bodyweight: "Single leg hip hinge" },
  lunge: { gym: "Walking lunge", dumbbells: "Dumbbell reverse lunge", bodyweight: "Reverse lunge" },
  push_h: { gym: "Bench press", dumbbells: "Dumbbell bench press", bodyweight: "Push up" },
  push_v: { gym: "Overhead press", dumbbells: "Dumbbell shoulder press", bodyweight: "Pike push up" },
  pull_h: { gym: "Seated cable row", dumbbells: "One arm dumbbell row", bodyweight: "Inverted row (table or bar)" },
  pull_v: { gym: "Lat pulldown", dumbbells: "Dumbbell pullover", bodyweight: "Pull up or band assisted pull up" },
  arms: { gym: "Cable curl and triceps pushdown", dumbbells: "Dumbbell curl and overhead extension", bodyweight: "Close grip push up" },
  calves: { gym: "Standing calf raise", dumbbells: "Dumbbell calf raise", bodyweight: "Single leg calf raise" },
  core: { gym: "Cable crunch", dumbbells: "Weighted dead bug", bodyweight: "Plank" },
  carry: { gym: "Farmer carry", dumbbells: "Farmer carry", bodyweight: "Hollow body hold" },
};

const TEMPLATES = {
  full: {
    name: "Full body",
    days: [
      { title: "Full body A", slots: ["squat", "push_h", "pull_h", "core"] },
      { title: "Full body B", slots: ["hinge", "push_v", "pull_v", "carry"] },
      { title: "Full body C", slots: ["lunge", "push_h", "pull_v", "calves"] },
    ],
  },
  upperLower: {
    name: "Upper / lower",
    days: [
      { title: "Upper A", slots: ["push_h", "pull_h", "push_v", "pull_v", "arms"] },
      { title: "Lower A", slots: ["squat", "hinge", "calves", "core"] },
      { title: "Upper B", slots: ["push_v", "pull_v", "push_h", "pull_h", "arms"] },
      { title: "Lower B", slots: ["hinge", "lunge", "calves", "carry"] },
    ],
  },
  ppl: {
    name: "Push / pull / legs",
    days: [
      { title: "Push", slots: ["push_h", "push_v", "arms", "core"] },
      { title: "Pull", slots: ["pull_v", "pull_h", "arms", "carry"] },
      { title: "Legs", slots: ["squat", "hinge", "lunge", "calves"] },
    ],
  },
};

const VOLUME = {
  beginner: { sets: 2, reps: "8 to 12", rir: "3 reps in reserve" },
  intermediate: { sets: 3, reps: "6 to 12", rir: "2 reps in reserve" },
  advanced: { sets: 4, reps: "5 to 12", rir: "1 to 2 reps in reserve" },
};

export function chooseSplit(daysPerWeek) {
  if (daysPerWeek <= 3) return "full";
  if (daysPerWeek <= 4) return "upperLower";
  return "ppl";
}

export function buildPlan({ daysPerWeek = 3, experience = "beginner", equipment = "gym", goal = "maintain" }) {
  const d = Math.min(6, Math.max(2, daysPerWeek));
  const splitKey = chooseSplit(d);
  const template = TEMPLATES[splitKey];
  const vol = VOLUME[experience] ?? VOLUME.beginner;
  const days = [];
  for (let i = 0; i < d; i++) {
    const t = template.days[i % template.days.length];
    days.push({
      title: t.title,
      exercises: t.slots.map((slot, idx) => ({
        name: LIB[slot][equipment] ?? LIB[slot].bodyweight,
        sets: idx === 0 ? vol.sets + (experience === "beginner" ? 1 : 0) : vol.sets,
        reps: vol.reps,
      })),
    });
  }
  const cardio =
    goal === "lose"
      ? "Add 2 to 3 sessions of 20 to 30 min low intensity cardio, or 8 to 10k steps daily."
      : "Keep 7 to 8k steps daily for general health.";
  return {
    split: template.name,
    effort: vol.rir,
    progression: "When you hit the top of the rep range on all sets, add the smallest available load next session.",
    cardio,
    days,
  };
}
