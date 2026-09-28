# Decision log

| Decision | Options considered | Chosen | Why |
|---|---|---|---|
| Energy equation | Harris-Benedict, Katch-McArdle, Mifflin-St Jeor | Mifflin-St Jeor | Widely used, needs no body fat input, which most users don't know |
| Rate limits | Free choice vs capped | Cap at 1% bodyweight per week, floor at BMR | Faster rates raise muscle loss and drop off risk; making the guardrail visible builds trust |
| Headline weight | Latest weigh in vs rolling average | 7 day rolling average | Daily swings of 1 kg or more are normal and cause people to quit working plans |
| Adaptive maintenance | Show from day 1 vs wait | Wait for 14 days | A number from 5 noisy days is confidently wrong; better to show nothing |
| Plan generation | LLM generated vs rules | Rules | Transparent, testable, free to run. An LLM layer can explain and adapt later |
| Storage | Backend with accounts vs browser storage | Browser storage | Zero onboarding friction, zero cost, private by default. Sync deferred to "Later" |
| Tech stack | React/Vite vs plain JS | Plain JS modules, no build | Deploys to GitHub Pages as is, easy for anyone to read and fork |
