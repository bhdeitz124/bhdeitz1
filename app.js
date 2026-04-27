// ── Storage helpers ──────────────────────────────────────────────────────────
const store = {
  get: (key) => JSON.parse(localStorage.getItem(key) || '[]'),
  set: (key, val) => localStorage.setItem(key, JSON.stringify(val)),
};

const KEYS = { lifts: 'ft_lifts', runs: 'ft_runs', calories: 'ft_calories', goal: 'ft_cal_goal' };

// ── Utility ───────────────────────────────────────────────────────────────────
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function fmtDate(iso) {
  const [y, m, d] = iso.split('-');
  return `${m}/${d}/${y}`;
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ── Tab switching ─────────────────────────────────────────────────────────────
document.querySelectorAll('nav button[data-tab]').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('nav button').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    const panel = document.getElementById(btn.dataset.tab);
    if (panel) panel.classList.add('active');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// LIFTS
// ══════════════════════════════════════════════════════════════════════════════
const liftForm   = document.getElementById('lift-form');
const liftList   = document.getElementById('lift-list');
const liftFilter = document.getElementById('lift-filter-date');

function renderLifts(filterDate) {
  if (!liftList) return;
  let lifts = store.get(KEYS.lifts);
  if (filterDate) lifts = lifts.filter((l) => l.date === filterDate);

  // summary
  const liftTotal = document.getElementById('lift-total');
  const liftSets  = document.getElementById('lift-sets');
  const liftVol   = document.getElementById('lift-vol');
  if (liftTotal) liftTotal.textContent = lifts.length;
  const sets = lifts.reduce((s, l) => s + Number(l.sets), 0);
  if (liftSets) liftSets.textContent = sets;
  const vol = lifts.reduce((s, l) => s + Number(l.sets) * Number(l.reps) * Number(l.weight), 0);
  if (liftVol) liftVol.textContent = vol.toLocaleString() + ' lbs';

  liftList.innerHTML = '';
  if (lifts.length === 0) {
    liftList.innerHTML = '<li class="empty">No lifts logged yet.</li>';
    return;
  }
  // most-recent first
  [...lifts].reverse().forEach((l) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <strong>${l.exercise}</strong>
        <span class="meta"> &mdash; ${l.sets} sets &times; ${l.reps} reps @ ${l.weight} lbs</span>
        <div class="meta">${fmtDate(l.date)}</div>
      </div>
      <button class="del-btn" title="Delete" data-key="lifts" data-id="${l.id}">&times;</button>`;
    liftList.appendChild(li);
  });
}

if (liftForm) {
  liftForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(liftForm);
    const entry = {
      id: uid(),
      date: fd.get('date') || todayISO(),
      exercise: (fd.get('exercise') || '').trim(),
      sets: fd.get('sets'),
      reps: fd.get('reps'),
      weight: fd.get('weight'),
    };
    if (!entry.exercise) return;
    const lifts = store.get(KEYS.lifts);
    lifts.push(entry);
    store.set(KEYS.lifts, lifts);
    liftForm.reset();
    const dateField = liftForm.querySelector('[name=date]');
    if (dateField) dateField.value = todayISO();
    renderLifts(liftFilter ? liftFilter.value || null : null);
  });
}

if (liftFilter) {
  liftFilter.addEventListener('change', () => renderLifts(liftFilter.value || null));
}
const liftFilterClear = document.getElementById('lift-filter-clear');
if (liftFilterClear) {
  liftFilterClear.addEventListener('click', () => {
    if (liftFilter) liftFilter.value = '';
    renderLifts(null);
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// RUNS
// ══════════════════════════════════════════════════════════════════════════════
const runForm   = document.getElementById('run-form');
const runList   = document.getElementById('run-list');
const runFilter = document.getElementById('run-filter-date');

function renderRuns(filterDate) {
  if (!runList) return;
  let runs = store.get(KEYS.runs);
  if (filterDate) runs = runs.filter((r) => r.date === filterDate);

  // summary
  const runTotal = document.getElementById('run-total');
  const runDist  = document.getElementById('run-dist');
  const runPace  = document.getElementById('run-pace');
  if (runTotal) runTotal.textContent = runs.length;
  const dist = runs.reduce((s, r) => s + Number(r.distance), 0);
  if (runDist) runDist.textContent = dist.toFixed(2) + ' mi';

  // average pace (min/mi)
  const withPace = runs.filter((r) => r.duration && Number(r.distance) > 0);
  let avgPace = '—';
  if (withPace.length) {
    const totalMins = withPace.reduce((s, r) => {
      const parts = (r.duration || '0:0:0').split(':').map(Number);
      const h = parts[0] || 0;
      const m = parts[1] || 0;
      const sec = parts[2] || 0;
      return s + h * 60 + m + sec / 60;
    }, 0);
    const totalDist = withPace.reduce((s, r) => s + Number(r.distance), 0);
    const mins = totalMins / totalDist;
    const mm = Math.floor(mins);
    const ss = Math.round((mins - mm) * 60).toString().padStart(2, '0');
    avgPace = `${mm}:${ss} /mi`;
  }
  if (runPace) runPace.textContent = avgPace;

  runList.innerHTML = '';
  if (runs.length === 0) {
    runList.innerHTML = '<li class="empty">No runs logged yet.</li>';
    return;
  }
  [...runs].reverse().forEach((r) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <strong>${r.distance} mi</strong>
        <span class="meta"> &mdash; ${r.duration || '—'} &mdash; ${r.type || 'Run'}</span>
        <div class="meta">${fmtDate(r.date)}</div>
      </div>
      <button class="del-btn" title="Delete" data-key="runs" data-id="${r.id}">&times;</button>`;
    runList.appendChild(li);
  });
}

if (runForm) {
  runForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(runForm);
    const entry = {
      id: uid(),
      date: fd.get('date') || todayISO(),
      distance: fd.get('distance'),
      duration: fd.get('duration'),
      type: fd.get('type'),
    };
    const runs = store.get(KEYS.runs);
    runs.push(entry);
    store.set(KEYS.runs, runs);
    runForm.reset();
    const dateField = runForm.querySelector('[name=date]');
    if (dateField) dateField.value = todayISO();
    renderRuns(runFilter ? runFilter.value || null : null);
  });
}

if (runFilter) {
  runFilter.addEventListener('change', () => renderRuns(runFilter.value || null));
}
const runFilterClear = document.getElementById('run-filter-clear');
if (runFilterClear) {
  runFilterClear.addEventListener('click', () => {
    if (runFilter) runFilter.value = '';
    renderRuns(null);
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// CALORIES
// ══════════════════════════════════════════════════════════════════════════════
const calForm   = document.getElementById('cal-form');
const calList   = document.getElementById('cal-list');
const calFilter = document.getElementById('cal-filter-date');
const goalInput = document.getElementById('cal-goal');

function renderCalories(filterDate) {
  if (!calList) return;
  const date = filterDate || todayISO();
  const all = store.get(KEYS.calories);
  const dayEntries = all.filter((c) => c.date === date);
  const total = dayEntries.reduce((s, c) => s + Number(c.calories), 0);
  const goal  = Number(localStorage.getItem(KEYS.goal) || 2000);

  const calTotal    = document.getElementById('cal-total');
  const calGoalDisp = document.getElementById('cal-goal-disp');
  const calRemain   = document.getElementById('cal-remain');
  const calProg     = document.getElementById('cal-prog');

  if (calTotal)    calTotal.textContent    = total;
  if (calGoalDisp) calGoalDisp.textContent = goal;
  if (calRemain)   calRemain.textContent   = Math.max(0, goal - total);

  // progress bar
  if (calProg) {
    const pct = Math.min(100, (total / goal) * 100);
    calProg.style.width = pct + '%';
    calProg.className = 'prog-bar' + (pct >= 100 ? '' : pct >= 80 ? ' warn' : ' ok');
  }

  // list entries for selected date
  const display = filterDate ? all.filter((c) => c.date === filterDate) : dayEntries;

  calList.innerHTML = '';
  if (display.length === 0) {
    calList.innerHTML = '<li class="empty">No entries for this day.</li>';
    return;
  }
  [...display].reverse().forEach((c) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <strong>${c.food}</strong>
        <span class="meta"> &mdash; ${c.calories} kcal</span>
        <div class="meta">${fmtDate(c.date)}</div>
      </div>
      <button class="del-btn" title="Delete" data-key="calories" data-id="${c.id}">&times;</button>`;
    calList.appendChild(li);
  });
}

if (calForm) {
  calForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(calForm);
    const entry = {
      id: uid(),
      date: fd.get('date') || todayISO(),
      food: (fd.get('food') || '').trim(),
      calories: fd.get('calories'),
    };
    if (!entry.food || !entry.calories) return;
    const all = store.get(KEYS.calories);
    all.push(entry);
    store.set(KEYS.calories, all);
    calForm.reset();
    const dateField = calForm.querySelector('[name=date]');
    if (dateField) dateField.value = todayISO();
    renderCalories(calFilter ? calFilter.value || null : null);
  });
}

if (calFilter) {
  calFilter.addEventListener('change', () => renderCalories(calFilter.value || null));
}
const calFilterClear = document.getElementById('cal-filter-clear');
if (calFilterClear) {
  calFilterClear.addEventListener('click', () => {
    if (calFilter) calFilter.value = '';
    renderCalories(null);
  });
}

if (goalInput) {
  goalInput.addEventListener('change', () => {
    const val = Number(goalInput.value);
    if (val > 0) {
      localStorage.setItem(KEYS.goal, val);
      renderCalories(calFilter ? calFilter.value || null : null);
    }
  });
}

// ── Global delete handler ─────────────────────────────────────────────────────
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.del-btn');
  if (!btn) return;
  const { key, id } = btn.dataset;
  const storeKey = KEYS[key];
  if (!storeKey) return;
  const items = store.get(storeKey).filter((item) => item.id !== id);
  store.set(storeKey, items);
  if (key === 'lifts')    renderLifts(liftFilter ? liftFilter.value || null : null);
  if (key === 'runs')     renderRuns(runFilter ? runFilter.value || null : null);
  if (key === 'calories') renderCalories(calFilter ? calFilter.value || null : null);
});

// ── Boot ──────────────────────────────────────────────────────────────────────
(function init() {
  const today = todayISO();
  // pre-fill date fields
  document.querySelectorAll('input[name=date]').forEach((i) => { i.value = today; });
  // restore saved calorie goal
  const savedGoal = localStorage.getItem(KEYS.goal);
  if (savedGoal && goalInput) goalInput.value = savedGoal;

  renderLifts(null);
  renderRuns(null);
  renderCalories(null);
})();
