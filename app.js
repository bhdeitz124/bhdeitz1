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
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// LIFTS
// ══════════════════════════════════════════════════════════════════════════════
const liftForm  = document.getElementById('lift-form');
const liftList  = document.getElementById('lift-list');
const liftFilter = document.getElementById('lift-filter-date');

function renderLifts(filterDate) {
  let lifts = store.get(KEYS.lifts);
  if (filterDate) lifts = lifts.filter((l) => l.date === filterDate);

  // summary
  document.getElementById('lift-total').textContent = lifts.length;
  const sets = lifts.reduce((s, l) => s + Number(l.sets), 0);
  document.getElementById('lift-sets').textContent = sets;
  const vol = lifts.reduce((s, l) => s + Number(l.sets) * Number(l.reps) * Number(l.weight), 0);
  document.getElementById('lift-vol').textContent = vol.toLocaleString() + ' lbs';

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
        <span class="meta"> &mdash; ${l.sets} sets × ${l.reps} reps @ ${l.weight} lbs</span>
        <div class="meta">${fmtDate(l.date)}</div>
      </div>
      <button class="del-btn" title="Delete" data-key="lifts" data-id="${l.id}">✕</button>`;
    liftList.appendChild(li);
  });
}

liftForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const fd = new FormData(liftForm);
  const entry = {
    id: uid(),
    date: fd.get('date') || todayISO(),
    exercise: fd.get('exercise').trim(),
    sets: fd.get('sets'),
    reps: fd.get('reps'),
    weight: fd.get('weight'),
  };
  if (!entry.exercise) return;
  const lifts = store.get(KEYS.lifts);
  lifts.push(entry);
  store.set(KEYS.lifts, lifts);
  liftForm.reset();
  document.querySelector('#lift-form [name=date]').value = todayISO();
  renderLifts(liftFilter.value || null);
});

liftFilter.addEventListener('change', () => renderLifts(liftFilter.value || null));
document.getElementById('lift-filter-clear').addEventListener('click', () => {
  liftFilter.value = '';
  renderLifts(null);
});

// ══════════════════════════════════════════════════════════════════════════════
// RUNS
// ══════════════════════════════════════════════════════════════════════════════
const runForm   = document.getElementById('run-form');
const runList   = document.getElementById('run-list');
const runFilter = document.getElementById('run-filter-date');

function renderRuns(filterDate) {
  let runs = store.get(KEYS.runs);
  if (filterDate) runs = runs.filter((r) => r.date === filterDate);

  // summary
  document.getElementById('run-total').textContent = runs.length;
  const dist = runs.reduce((s, r) => s + Number(r.distance), 0);
  document.getElementById('run-dist').textContent = dist.toFixed(2) + ' mi';
  // average pace  (min/mi)
  const withPace = runs.filter((r) => r.duration && r.distance > 0);
  let avgPace = '—';
  if (withPace.length) {
    const totalMins = withPace.reduce((s, r) => {
      const [h, m, sec] = r.duration.split(':').map(Number);
      return s + h * 60 + m + (sec || 0) / 60;
    }, 0);
    const totalDist = withPace.reduce((s, r) => s + Number(r.distance), 0);
    const mins = totalMins / totalDist;
    const mm = Math.floor(mins);
    const ss = Math.round((mins - mm) * 60).toString().padStart(2, '0');
    avgPace = `${mm}:${ss} /mi`;
  }
  document.getElementById('run-pace').textContent = avgPace;

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
      <button class="del-btn" title="Delete" data-key="runs" data-id="${r.id}">✕</button>`;
    runList.appendChild(li);
  });
}

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
  document.querySelector('#run-form [name=date]').value = todayISO();
  renderRuns(runFilter.value || null);
});

runFilter.addEventListener('change', () => renderRuns(runFilter.value || null));
document.getElementById('run-filter-clear').addEventListener('click', () => {
  runFilter.value = '';
  renderRuns(null);
});

// ══════════════════════════════════════════════════════════════════════════════
// CALORIES
// ══════════════════════════════════════════════════════════════════════════════
const calForm    = document.getElementById('cal-form');
const calList    = document.getElementById('cal-list');
const calFilter  = document.getElementById('cal-filter-date');
const goalInput  = document.getElementById('cal-goal');

function renderCalories(filterDate) {
  const date = filterDate || todayISO();
  let all = store.get(KEYS.calories);
  const dayEntries = all.filter((c) => c.date === date);
  const total = dayEntries.reduce((s, c) => s + Number(c.calories), 0);
  const goal  = Number(localStorage.getItem(KEYS.goal) || 2000);

  document.getElementById('cal-total').textContent = total;
  document.getElementById('cal-goal-disp').textContent = goal;
  document.getElementById('cal-remain').textContent = Math.max(0, goal - total);

  // progress bar
  const pct = Math.min(100, (total / goal) * 100);
  const bar = document.getElementById('cal-prog');
  bar.style.width = pct + '%';
  bar.className = 'prog-bar' + (pct >= 100 ? '' : pct >= 80 ? ' warn' : ' ok');

  // list all entries for selected date
  let display = filterDate ? all.filter((c) => c.date === filterDate) : dayEntries;

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
      <button class="del-btn" title="Delete" data-key="calories" data-id="${c.id}">✕</button>`;
    calList.appendChild(li);
  });
}

calForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const fd = new FormData(calForm);
  const entry = {
    id: uid(),
    date: fd.get('date') || todayISO(),
    food: fd.get('food').trim(),
    calories: fd.get('calories'),
  };
  if (!entry.food || !entry.calories) return;
  const all = store.get(KEYS.calories);
  all.push(entry);
  store.set(KEYS.calories, all);
  calForm.reset();
  document.querySelector('#cal-form [name=date]').value = todayISO();
  renderCalories(calFilter.value || null);
});

calFilter.addEventListener('change', () => renderCalories(calFilter.value || null));
document.getElementById('cal-filter-clear').addEventListener('click', () => {
  calFilter.value = '';
  renderCalories(null);
});

goalInput.addEventListener('change', () => {
  const val = Number(goalInput.value);
  if (val > 0) {
    localStorage.setItem(KEYS.goal, val);
    renderCalories(calFilter.value || null);
  }
});

// ── Global delete handler ─────────────────────────────────────────────────────
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.del-btn');
  if (!btn) return;
  const { key, id } = btn.dataset;
  const storeKey = KEYS[key];
  if (!storeKey) return;
  const items = store.get(storeKey).filter((item) => item.id !== id);
  store.set(storeKey, items);
  if (key === 'lifts') renderLifts(liftFilter.value || null);
  if (key === 'runs')  renderRuns(runFilter.value || null);
  if (key === 'calories') renderCalories(calFilter.value || null);
});

// ── Boot ──────────────────────────────────────────────────────────────────────
(function init() {
  const today = todayISO();
  // pre-fill date fields
  document.querySelectorAll('input[name=date]').forEach((i) => { i.value = today; });
  // restore goal
  const savedGoal = localStorage.getItem(KEYS.goal);
  if (savedGoal) goalInput.value = savedGoal;

  renderLifts(null);
  renderRuns(null);
  renderCalories(null);
})();
