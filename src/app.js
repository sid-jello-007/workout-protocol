import { ACTIVITY, bmr, calorieTarget, macros, projectWeight, rollingAverage, observedMaintenance } from "./calc.js";
import { buildPlan } from "./plan.js";

const $ = (s) => document.querySelector(s);
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem("wp:" + k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem("wp:" + k, JSON.stringify(v)); } catch {} },
};

// ---------- tabs ----------
document.querySelectorAll("[data-tab]").forEach((b) =>
  b.addEventListener("click", () => {
    document.querySelectorAll("[data-tab]").forEach((x) => x.setAttribute("aria-selected", x === b));
    document.querySelectorAll(".panel").forEach((p) => (p.hidden = p.id !== b.dataset.tab));
    store.set("tab", b.dataset.tab);
  })
);
const lastTab = store.get("tab");
if (lastTab) document.querySelector(`[data-tab="${lastTab}"]`)?.click();

// ---------- chart (tiny SVG line chart, no dependencies) ----------
function lineChart(el, series, { yLabel = "kg" } = {}) {
  const all = series.flatMap((s) => s.points.map((p) => p.y)).filter((v) => v != null);
  if (!all.length) { el.innerHTML = '<p class="note">Nothing to plot yet.</p>'; return; }
  const W = 640, H = 220, P = { l: 44, r: 12, t: 12, b: 28 };
  const xs = series.flatMap((s) => s.points.map((p) => p.x));
  const [x0, x1] = [Math.min(...xs), Math.max(...xs) || 1];
  let [y0, y1] = [Math.min(...all), Math.max(...all)];
  if (y1 - y0 < 1) { y0 -= 0.5; y1 += 0.5; }
  const sx = (x) => P.l + ((x - x0) / (x1 - x0 || 1)) * (W - P.l - P.r);
  const sy = (y) => H - P.b - ((y - y0) / (y1 - y0)) * (H - P.t - P.b);
  const ticks = [y0, (y0 + y1) / 2, y1];
  const grid = ticks.map((t) => `<line x1="${P.l}" x2="${W - P.r}" y1="${sy(t)}" y2="${sy(t)}" class="grid"/><text x="${P.l - 6}" y="${sy(t) + 4}" text-anchor="end">${t.toFixed(1)}</text>`).join("");
  const paths = series.map((s) => {
    const pts = s.points.filter((p) => p.y != null);
    if (s.dots) return pts.map((p) => `<circle cx="${sx(p.x)}" cy="${sy(p.y)}" r="2.5" class="${s.cls}"/>`).join("");
    return `<path d="${pts.map((p, i) => `${i ? "L" : "M"}${sx(p.x)},${sy(p.y)}`).join("")}" class="${s.cls}" fill="none"/>`;
  }).join("");
  const legend = series.map((s) => `<span class="key ${s.cls}">${s.name}</span>`).join("");
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${yLabel} chart">${grid}${paths}</svg><div class="legend">${legend}</div>`;
}

// ---------- targets ----------
const profileForm = $("#profile");
profileForm.activity.innerHTML = Object.entries(ACTIVITY).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join("");
profileForm.activity.value = "moderate";
Object.entries(store.get("profile", {})).forEach(([k, v]) => { if (profileForm[k]) profileForm[k].value = v; });

function readProfile() {
  const f = new FormData(profileForm);
  const p = Object.fromEntries(f);
  ["age", "heightCm", "weightKg", "goalKg", "rate"].forEach((k) => (p[k] = parseFloat(p[k])));
  return p;
}

function card(label, value, hint = "") {
  return `<div class="card"><div class="label">${label}</div><div class="value">${value}</div><div class="hint">${hint}</div></div>`;
}

function renderTargets() {
  const p = readProfile();
  if ([p.age, p.heightCm, p.weightKg].some(isNaN)) return;
  store.set("profile", Object.fromEntries(new FormData(profileForm)));
  const goal = p.rate < 0 ? "lose" : p.rate > 0 ? "gain" : "maintain";
  const t = calorieTarget(p, p.rate);
  const m = macros(t.target, p.weightKg, goal);
  const proj = projectWeight(p.weightKg, p.goalKg, t.appliedRate);
  $("#targetCards").innerHTML =
    card("Resting energy (BMR)", `${bmr(p)} kcal`, "Mifflin-St Jeor") +
    card("Estimated maintenance", `${t.maintenance} kcal`, "BMR x activity") +
    card("Daily target", `${t.target} kcal`, goal === "maintain" ? "Hold weight" : `${t.appliedRate > 0 ? "+" : ""}${t.appliedRate.toFixed(2)} kg per week`) +
    card("Macros", `${m.protein} / ${m.carbs} / ${m.fat}`, "protein / carbs / fat, g per day") +
    card("Time to goal", proj.weeks ? `${proj.weeks} weeks` : "n/a", proj.weeks ? `about ${new Date(Date.now() + proj.weeks * 6048e5).toLocaleDateString(undefined, { month: "short", year: "numeric" })}` : "Goal and rate point different ways");
  const notes = [];
  if (t.rateWasCapped) notes.push("Rate capped at 1% of bodyweight per week to protect muscle and adherence.");
  if (t.hitFloor) notes.push(`Target held at your BMR, so the real rate is ${t.appliedRate} kg per week. Eating below BMR is not recommended without supervision.`);
  const obs = observedMaintenance(store.get("log", []));
  if (obs) notes.push(`Your log suggests real maintenance is about ${obs} kcal (${obs - t.maintenance >= 0 ? "+" : ""}${obs - t.maintenance} vs the formula). Consider adjusting your target.`);
  $("#guardrail").textContent = notes.join(" ");
  lineChart($("#projection"), [{ name: "Projected", cls: "s1", points: proj.points.map((q) => ({ x: q.week, y: q.kg })) }]);
}
profileForm.addEventListener("input", renderTargets);

// ---------- log ----------
const logForm = $("#logForm");
logForm.date.valueAsDate = new Date();

function renderLog() {
  const log = store.get("log", []).sort((a, b) => a.date.localeCompare(b.date));
  const weights = log.map((d) => d.weightKg ?? null);
  const trend = rollingAverage(weights);
  const x = (d) => (new Date(d.date) - new Date(log[0]?.date)) / 86400000;
  lineChart($("#trend"), [
    { name: "Scale weight", cls: "s2", dots: true, points: log.map((d, i) => ({ x: x(d), y: weights[i] })) },
    { name: "7 day trend", cls: "s1", points: log.map((d, i) => ({ x: x(d), y: weights[i] == null ? null : trend[i] })) },
  ]);
  const withKcal = log.filter((d) => d.kcal);
  const last7 = withKcal.slice(-7);
  const obs = observedMaintenance(log);
  const tr = trend.filter((v) => v != null);
  $("#logCards").innerHTML =
    card("Current trend", tr.length ? `${tr.at(-1)} kg` : "n/a", "smoothed, ignore daily noise") +
    card("Trend change", tr.length > 7 ? `${(tr.at(-1) - tr.at(-8)).toFixed(2)} kg` : "n/a", "vs 7 entries ago") +
    card("Avg intake (7 d)", last7.length ? `${Math.round(last7.reduce((a, d) => a + d.kcal, 0) / last7.length)} kcal` : "n/a") +
    card("Observed maintenance", obs ? `${obs} kcal` : "need 14 days", "from your own data");
  $("#count").textContent = log.length;
  $("#entries tbody").innerHTML = log.slice().reverse().map((d) =>
    `<tr><td>${d.date}</td><td>${d.weightKg ?? ""}</td><td>${d.kcal ?? ""}</td><td><button data-del="${d.date}" aria-label="Delete ${d.date}">x</button></td></tr>`).join("");
  renderTargets();
}

logForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(logForm));
  const entry = { date: f.date, weightKg: f.weightKg ? +f.weightKg : null, kcal: f.kcal ? +f.kcal : null };
  const log = store.get("log", []).filter((d) => d.date !== entry.date);
  store.set("log", [...log, entry]);
  renderLog();
});
$("#entries").addEventListener("click", (e) => {
  const d = e.target.dataset.del;
  if (!d) return;
  store.set("log", store.get("log", []).filter((x) => x.date !== d));
  renderLog();
});
$("#clear").addEventListener("click", () => { store.set("log", []); renderLog(); });
$("#demo").addEventListener("click", () => {
  const start = readProfile().weightKg || 80;
  const out = [];
  for (let i = 27; i >= 0; i--) {
    const day = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    const drift = (27 - i) * -0.07;
    const noise = Math.sin(i * 1.7) * 0.6;
    out.push({ date: day, weightKg: +(start + drift + noise).toFixed(1), kcal: 2100 + Math.round(Math.cos(i) * 180) });
  }
  store.set("log", out);
  renderLog();
});

// ---------- training ----------
const planForm = $("#planForm");
Object.entries(store.get("plan", {})).forEach(([k, v]) => { if (planForm[k]) planForm[k].value = v; });
function renderPlan() {
  const f = Object.fromEntries(new FormData(planForm));
  store.set("plan", f);
  const rate = readProfile().rate;
  const plan = buildPlan({ ...f, daysPerWeek: +f.daysPerWeek, goal: rate < 0 ? "lose" : rate > 0 ? "gain" : "maintain" });
  $("#plan").innerHTML = `
    <div class="cards">${card("Split", plan.split)}${card("Effort", plan.effort)}</div>
    <p class="note">${plan.progression} ${plan.cardio}</p>
    <div class="days">${plan.days.map((d, i) => `
      <article class="day"><h4>Day ${i + 1}: ${d.title}</h4>
        <ol>${d.exercises.map((x) => `<li><span>${x.name}</span><span class="sets">${x.sets} x ${x.reps}</span></li>`).join("")}</ol>
      </article>`).join("")}</div>`;
}
planForm.addEventListener("input", renderPlan);

renderLog();
renderPlan();
