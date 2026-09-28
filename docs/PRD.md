# Workout Protocol: product spec

## Problem statement
People changing their body composition lose momentum because their targets are wrong and never corrected, daily scale noise looks like failure, and their training plan doesn't fit their real week.

## Goals
1. Give a new user a calorie target, macro split and training plan in under 2 minutes.
2. Replace the formula estimate with the user's observed maintenance after 2 weeks of logging.
3. Keep the user focused on trend, not daily noise.

## Non goals (v1)
- Food diary or barcode scanning. Users log a daily total from whatever they already use.
- Accounts, sync or social features.
- Medical or clinical use.

## Users
- **Primary:** recreational lifter, 2 to 6 sessions a week, comfortable weighing daily.
- **Secondary:** beginner returning to training who needs a simple plan and a sensible target.

## Requirements

| # | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| R1 | Calculate BMR and maintenance from sex, age, height, weight, activity | P0 | Matches Mifflin-St Jeor to the calorie (unit tested) |
| R2 | Daily calorie target from a chosen weekly rate | P0 | Rate capped at 1% bodyweight per week; cut target never below BMR; UI states when a cap applies |
| R3 | Macro split | P0 | Protein 2.2 / 2.0 / 1.8 g per kg for lose / maintain / gain; fat 25% of calories; carbs fill the remainder |
| R4 | Projected weeks to goal | P1 | Returns "n/a" when goal and rate point in opposite directions |
| R5 | Daily log of weight and calories | P0 | One entry per date, editable by re-saving, deletable |
| R6 | 7 day trend line | P0 | Chart shows raw weights as dots and trend as a line |
| R7 | Observed maintenance | P1 | Shown only with 14 or more complete days spanning at least 13 calendar days; recovers a known synthetic value within 30 kcal (unit tested) |
| R8 | Training plan | P0 | Split by days (2 to 3 full body, 4 upper/lower, 5 to 6 PPL); exercises match equipment; volume by experience |
| R9 | Privacy | P0 | No network calls; data stored only in the browser |

## Open questions
- Should the "adjust your target" prompt auto apply after user confirmation, or stay advisory?
- Is 14 days the right unlock threshold, or should confidence be shown as a range earlier?
