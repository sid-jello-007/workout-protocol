# Workout Protocol

**One place to set calorie targets, see your real bodyweight trend, and get a training plan that fits your week.**

[Live app](https://sid-jello-007.github.io/workout-protocol/) · [Product spec](docs/PRD.md) · [Decision log](docs/DECISIONS.md)


## The problem

Most people trying to change their body composition juggle three disconnected tools: a calorie calculator they used once, a notes app or spreadsheet for scale weight, and a workout plan copied from somewhere. The result is predictable:

- **Targets never get corrected.** Formula based maintenance estimates are often off by a few hundred calories, and nothing tells you.
- **Daily scale noise drives bad decisions.** A 1 kg water swing reads as failure and people abandon a plan that was working.
- **Training plans ignore constraints.** A 6 day split is useless if you have 3 evenings and a pair of dumbbells.

## Who it's for

Someone who trains 2 to 6 times a week, wants to lose, maintain or gain at a sensible pace, and will log a morning weight and a daily calorie total but does not want a full food diary app.

## What it does

| Step | What the user gets | Why it matters |
|---|---|---|
| 1. Targets | BMR, maintenance, daily calorie target, protein/carb/fat split, projected date to goal weight | A concrete number and a finish line |
| 2. Log and trend | Morning weight plus calories per day, a 7 day trend line, and an **observed maintenance** estimate from the user's own data after 14 days | Replaces the formula guess with reality and hides day to day noise |
| 3. Training plan | A split chosen from days per week (full body, upper/lower, or push/pull/legs), exercises matched to available equipment, sets and reps by experience | A plan the user can actually follow this week |

The three steps are connected: the goal (lose, gain, maintain) sets protein and cardio guidance in the plan, and the log feeds back into the target screen with a prompt when observed maintenance differs from the formula.

## Product decisions worth calling out

- **Guardrails over flexibility.** The weekly rate is capped at 1% of bodyweight, and a cut never goes below BMR. The UI says when a guardrail kicks in instead of silently changing the number.
- **Trend, not scale.** The headline number in the log is the 7 day average, not today's weigh in.
- **Adaptive, but only with enough data.** Observed maintenance appears only after 14 logged days, to avoid confident nonsense from a noisy week.
- **Zero friction, zero accounts.** No sign up, no backend. Data lives in the browser's local storage. That keeps it private and free to run, at the cost of no sync across devices (see roadmap).
- **Rules, not AI, for the plan.** A transparent rule set (split by days, exercise by equipment, volume by experience) is easier to trust and test than a generated plan. An LLM coach is on the roadmap, sitting on top of these rules rather than replacing them.

More in the [decision log](docs/DECISIONS.md).

## Success measures (if this were a live product)

- **Activation:** share of new users who complete targets and log at least 3 days in week 1
- **Retention:** share still logging on day 14, the point where observed maintenance unlocks
- **Outcome:** share of retained users whose trend moves in the goal direction by week 4
- **Trust:** share of users who accept the "adjust your target" prompt when it appears

## Roadmap

- **Now:** targets, trend, adaptive maintenance, rule based plans ✅
- **Next:** CSV export and import, weekly check in summary, progressive overload tracking per exercise
- **Later:** optional account with sync, LLM coach that explains plan changes in plain language, wearable step data

## How it's built

Plain HTML, CSS and JavaScript modules with no framework or build step, so it deploys to GitHub Pages as is.

```
index.html          UI shell
src/calc.js         energy, macro, projection and adaptive maintenance maths (pure functions)
src/plan.js         rule based training plan generator
src/app.js          UI wiring, local storage, SVG charts
tests/              unit tests for the maths and plan rules (Node built in test runner)
```

Run locally:

```bash
npm test            # 12 unit tests
npx serve .         # then open http://localhost:3000
```

I scoped, specified and tested this myself and built it with an AI coding assistant as a pair, which is how I work on prototypes day to day.

## References

- Mifflin MD, St Jeor ST et al. (1990). *A new predictive equation for resting energy expenditure in healthy individuals.* Am J Clin Nutr.
- 7,700 kcal per kg of body mass change is a common approximation. Real change varies, which is why the app learns maintenance from your data.

*Estimates only, not medical advice.*
