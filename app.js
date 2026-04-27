// ── Storage helpers ──────────────────────────────────────────────────────────
const store = {
  get: (key) => JSON.parse(localStorage.getItem(key) || '[]'),
  set: (key, val) => localStorage.setItem(key, JSON.stringify(val)),
};

const KEYS = {
  lifts:    'ft_lifts',
  runs:     'ft_runs',
  calories: 'ft_calories',
  goals:    'ft_goals',
};

const DEFAULT_GOALS = { calories: 2000, protein: 150, carbs: 200, fat: 65 };

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

// Escape user-supplied content before inserting into innerHTML
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
// LIFTS — Workout-based logging
// ══════════════════════════════════════════════════════════════════════════════
const exerciseBuilder = document.getElementById('exercise-builder');
const workoutNameInput = document.getElementById('workout-name');
const workoutDateInput = document.getElementById('workout-date');
const addExerciseBtn   = document.getElementById('add-exercise-btn');
const saveWorkoutBtn   = document.getElementById('save-workout-btn');
const liftList         = document.getElementById('lift-list');
const liftFilter       = document.getElementById('lift-filter-date');

function addExerciseRow(data) {
  if (!exerciseBuilder) return;
  const row = document.createElement('div');
  row.className = 'exercise-row';
  row.innerHTML = `
    <input type="text"   class="ex-name"   placeholder="Exercise (e.g. Squat)" value="${esc(data ? data.exercise : '')}" />
    <input type="number" class="ex-sets"   placeholder="Sets"   min="1" step="1"   value="${esc(data ? data.sets   : 3)}" />
    <input type="number" class="ex-reps"   placeholder="Reps"   min="1" step="1"   value="${esc(data ? data.reps   : 8)}" />
    <input type="number" class="ex-weight" placeholder="Weight" min="0" step="2.5" value="${esc(data ? data.weight : 135)}" />
    <button type="button" class="rm-ex-btn" title="Remove exercise">&times;</button>`;
  row.querySelector('.rm-ex-btn').addEventListener('click', () => row.remove());
  exerciseBuilder.appendChild(row);
}

function collectExercises() {
  if (!exerciseBuilder) return [];
  return [...exerciseBuilder.querySelectorAll('.exercise-row')].map((row) => ({
    exercise: row.querySelector('.ex-name').value.trim(),
    sets:     row.querySelector('.ex-sets').value,
    reps:     row.querySelector('.ex-reps').value,
    weight:   row.querySelector('.ex-weight').value,
  })).filter((e) => e.exercise);
}

if (addExerciseBtn) {
  addExerciseBtn.addEventListener('click', () => addExerciseRow(null));
}

if (saveWorkoutBtn) {
  saveWorkoutBtn.addEventListener('click', () => {
    const name = workoutNameInput ? workoutNameInput.value.trim() : '';
    if (!name) { alert('Please enter a workout name.'); return; }
    const exercises = collectExercises();
    if (exercises.length === 0) { alert('Add at least one exercise.'); return; }
    const workout = {
      id:        uid(),
      date:      (workoutDateInput && workoutDateInput.value) || todayISO(),
      name,
      exercises,
    };
    const lifts = store.get(KEYS.lifts);
    lifts.push(workout);
    store.set(KEYS.lifts, lifts);
    if (workoutNameInput) workoutNameInput.value = '';
    if (exerciseBuilder) exerciseBuilder.innerHTML = '';
    addExerciseRow(null); // start fresh with one blank row
    renderLifts(liftFilter ? liftFilter.value || null : null);
  });
}

function renderLifts(filterDate) {
  if (!liftList) return;
  let workouts = store.get(KEYS.lifts);
  if (filterDate) workouts = workouts.filter((w) => w.date === filterDate);

  const liftTotal = document.getElementById('lift-total');
  const liftSets  = document.getElementById('lift-sets');
  const liftVol   = document.getElementById('lift-vol');

  const totalSets = workouts.reduce((s, w) =>
    s + (w.exercises || []).reduce((s2, e) => s2 + Number(e.sets), 0), 0);
  const totalVol = workouts.reduce((s, w) =>
    s + (w.exercises || []).reduce((s2, e) =>
      s2 + Number(e.sets) * Number(e.reps) * Number(e.weight), 0), 0);

  if (liftTotal) liftTotal.textContent = workouts.length;
  if (liftSets)  liftSets.textContent  = totalSets;
  if (liftVol)   liftVol.textContent   = totalVol.toLocaleString() + ' lbs';

  liftList.innerHTML = '';
  if (workouts.length === 0) {
    liftList.innerHTML = '<p class="empty">No workouts logged yet.</p>';
    return;
  }
  [...workouts].reverse().forEach((w) => {
    const card = document.createElement('div');
    card.className = 'workout-card';
    const exRows = (w.exercises || []).map((e) =>
      `<tr>
        <td>${esc(e.exercise)}</td>
        <td>${esc(e.sets)}</td>
        <td>${esc(e.reps)}</td>
        <td>${esc(e.weight)} lbs</td>
      </tr>`
    ).join('');
    card.innerHTML = `
      <div class="workout-card-header">
        <div>
          <strong>${esc(w.name)}</strong>
          <span class="meta">${fmtDate(w.date)}</span>
        </div>
        <button class="del-btn" data-key="lifts" data-id="${esc(w.id)}" title="Delete workout">&times;</button>
      </div>
      <table class="exercise-table">
        <thead><tr><th>Exercise</th><th>Sets</th><th>Reps</th><th>Weight</th></tr></thead>
        <tbody>${exRows}</tbody>
      </table>`;
    liftList.appendChild(card);
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
// RUNS — with Strava sync
// ══════════════════════════════════════════════════════════════════════════════
const runForm   = document.getElementById('run-form');
const runList   = document.getElementById('run-list');
const runFilter = document.getElementById('run-filter-date');

function renderRuns(filterDate) {
  if (!runList) return;
  let runs = store.get(KEYS.runs);
  if (filterDate) runs = runs.filter((r) => r.date === filterDate);

  const runTotal = document.getElementById('run-total');
  const runDist  = document.getElementById('run-dist');
  const runPace  = document.getElementById('run-pace');
  if (runTotal) runTotal.textContent = runs.length;
  const dist = runs.reduce((s, r) => s + Number(r.distance), 0);
  if (runDist) runDist.textContent = dist.toFixed(2) + ' mi';

  const withPace = runs.filter((r) => r.duration && Number(r.distance) > 0);
  let avgPace = '—';
  if (withPace.length) {
    const totalMins = withPace.reduce((s, r) => {
      const parts = (r.duration || '0:0:0').split(':').map(Number);
      return s + (parts[0] || 0) * 60 + (parts[1] || 0) + (parts[2] || 0) / 60;
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
    const stravaBadge = r.source === 'strava'
      ? ' <span class="strava-tag">Strava</span>' : '';
    li.innerHTML = `
      <div>
        <strong>${esc(r.distance)} mi</strong>${stravaBadge}
        <span class="meta"> &mdash; ${esc(r.duration || '—')} &mdash; ${esc(r.type || 'Run')}</span>
        ${r.name ? `<span class="meta"> &mdash; ${esc(r.name)}</span>` : ''}
        <div class="meta">${fmtDate(r.date)}</div>
      </div>
      <button class="del-btn" title="Delete" data-key="runs" data-id="${esc(r.id)}">&times;</button>`;
    runList.appendChild(li);
  });
}

// ── Strava integration ────────────────────────────────────────────────────────
const stravaTokenInput = document.getElementById('strava-token');
const stravaFetchBtn   = document.getElementById('strava-fetch-btn');
const stravaStatus     = document.getElementById('strava-status');
const stravaTokenClear = document.getElementById('strava-clear-btn');

function secsToHMS(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function mToMi(meters) {
  return (meters / 1609.344).toFixed(2);
}

if (stravaTokenClear) {
  stravaTokenClear.addEventListener('click', () => {
    if (stravaTokenInput) stravaTokenInput.value = '';
    localStorage.removeItem('ft_strava_token');
    if (stravaStatus) stravaStatus.innerHTML = '';
  });
}

if (stravaFetchBtn) {
  stravaFetchBtn.addEventListener('click', async () => {
    const token = stravaTokenInput ? stravaTokenInput.value.trim() : '';
    if (!token) {
      if (stravaStatus) stravaStatus.innerHTML =
        '<span class="strava-error">Please enter a Strava Access Token.</span>';
      return;
    }
    // Persist token for convenience
    localStorage.setItem('ft_strava_token', token);
    if (stravaStatus) stravaStatus.innerHTML = '<span class="strava-info">Fetching activities…</span>';
    stravaFetchBtn.disabled = true;

    try {
      const resp = await fetch(
        'https://www.strava.com/api/v3/athlete/activities?per_page=30&page=1',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${resp.status}`);
      }
      const activities = await resp.json();
      const stravaRuns = activities.filter((a) => a.type === 'Run');

      const existing = store.get(KEYS.runs);
      const existingStravaIds = new Set(
        existing.filter((r) => r.stravaId).map((r) => r.stravaId)
      );

      const newRuns = stravaRuns
        .filter((a) => !existingStravaIds.has(String(a.id)))
        .map((a) => ({
          id:       uid(),
          stravaId: String(a.id),
          source:   'strava',
          date:     a.start_date_local.slice(0, 10),
          name:     a.name,
          distance: mToMi(a.distance),
          duration: secsToHMS(a.moving_time),
          type:     'Run',
        }));

      if (newRuns.length === 0) {
        if (stravaStatus) stravaStatus.innerHTML =
          '<span class="strava-info">No new runs to import (all already synced).</span>';
      } else {
        store.set(KEYS.runs, [...existing, ...newRuns]);
        renderRuns(runFilter ? runFilter.value || null : null);
        if (stravaStatus) stravaStatus.innerHTML =
          `<span class="strava-ok">&#10003; Imported ${newRuns.length} run${newRuns.length > 1 ? 's' : ''}!</span>`;
      }
    } catch (err) {
      let msg = esc(err.message);
      if (err instanceof TypeError) {
        msg = 'Could not reach Strava. If opening as a local file, try hosting on GitHub Pages or a web server.';
      }
      if (stravaStatus) stravaStatus.innerHTML = `<span class="strava-error">Error: ${msg}</span>`;
    } finally {
      stravaFetchBtn.disabled = false;
    }
  });
}

if (runForm) {
  runForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(runForm);
    const entry = {
      id:       uid(),
      date:     fd.get('date') || todayISO(),
      distance: fd.get('distance'),
      duration: fd.get('duration'),
      type:     fd.get('type'),
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
// CALORIES — food search + macro tracking
// ══════════════════════════════════════════════════════════════════════════════
const calForm          = document.getElementById('cal-form');
const calList          = document.getElementById('cal-list');
const calFilter        = document.getElementById('cal-filter-date');
const goalInput        = document.getElementById('cal-goal');
const proteinGoalInput = document.getElementById('macro-protein-goal');
const carbsGoalInput   = document.getElementById('macro-carbs-goal');
const fatGoalInput     = document.getElementById('macro-fat-goal');

// ── Goal helpers ───────────────────────────────────────────────────────────
function getGoals() {
  return Object.assign(
    { ...DEFAULT_GOALS },
    JSON.parse(localStorage.getItem(KEYS.goals) || 'null')
  );
}

function saveGoals() {
  const goals = {
    calories: Number(goalInput        ? goalInput.value        : DEFAULT_GOALS.calories) || DEFAULT_GOALS.calories,
    protein:  Number(proteinGoalInput ? proteinGoalInput.value : DEFAULT_GOALS.protein)  || DEFAULT_GOALS.protein,
    carbs:    Number(carbsGoalInput   ? carbsGoalInput.value   : DEFAULT_GOALS.carbs)    || DEFAULT_GOALS.carbs,
    fat:      Number(fatGoalInput     ? fatGoalInput.value     : DEFAULT_GOALS.fat)      || DEFAULT_GOALS.fat,
  };
  localStorage.setItem(KEYS.goals, JSON.stringify(goals));
  return goals;
}

function setBar(id, pct, extraClass) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.width = Math.min(100, pct) + '%';
  el.className = 'prog-bar' + (extraClass ? ' ' + extraClass : '');
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function renderCalories(filterDate) {
  if (!calList) return;
  const date = filterDate || todayISO();
  const all = store.get(KEYS.calories);
  const dayEntries = all.filter((c) => c.date === date);

  const total        = dayEntries.reduce((s, c) => s + Number(c.calories || 0), 0);
  const totalProtein = dayEntries.reduce((s, c) => s + Number(c.protein  || 0), 0);
  const totalCarbs   = dayEntries.reduce((s, c) => s + Number(c.carbs    || 0), 0);
  const totalFat     = dayEntries.reduce((s, c) => s + Number(c.fat      || 0), 0);

  const goals = getGoals();

  setText('cal-total',         total);
  setText('cal-goal-disp',     goals.calories);
  setText('cal-remain',        Math.max(0, goals.calories - total));
  setText('protein-total',     totalProtein.toFixed(1));
  setText('protein-goal-disp', goals.protein);
  setText('carbs-total',       totalCarbs.toFixed(1));
  setText('carbs-goal-disp',   goals.carbs);
  setText('fat-total',         totalFat.toFixed(1));
  setText('fat-goal-disp',     goals.fat);

  const calPct = goals.calories > 0 ? (total / goals.calories) * 100 : 0;
  setBar('cal-prog',     calPct,                               calPct >= 100 ? '' : calPct >= 80 ? 'warn' : 'ok');
  setBar('protein-prog', goals.protein > 0 ? (totalProtein / goals.protein) * 100 : 0, 'protein-bar');
  setBar('carbs-prog',   goals.carbs   > 0 ? (totalCarbs   / goals.carbs)   * 100 : 0, 'carbs-bar');
  setBar('fat-prog',     goals.fat     > 0 ? (totalFat     / goals.fat)     * 100 : 0, 'fat-bar');

  const display = filterDate ? all.filter((c) => c.date === filterDate) : dayEntries;
  calList.innerHTML = '';
  if (display.length === 0) {
    calList.innerHTML = '<li class="empty">No entries for this day.</li>';
    return;
  }
  [...display].reverse().forEach((c) => {
    const macroParts = [
      Number(c.protein) ? `P:${Number(c.protein).toFixed(0)}g` : null,
      Number(c.carbs)   ? `C:${Number(c.carbs).toFixed(0)}g`   : null,
      Number(c.fat)     ? `F:${Number(c.fat).toFixed(0)}g`     : null,
    ].filter(Boolean).join(' · ');
    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <strong>${esc(c.food)}</strong>
        <span class="meta"> &mdash; ${esc(c.calories)} kcal${macroParts ? ' &mdash; ' + esc(macroParts) : ''}</span>
        <div class="meta">${fmtDate(c.date)}</div>
      </div>
      <button class="del-btn" title="Delete" data-key="calories" data-id="${esc(c.id)}">&times;</button>`;
    calList.appendChild(li);
  });
}

[goalInput, proteinGoalInput, carbsGoalInput, fatGoalInput].forEach((inp) => {
  if (!inp) return;
  inp.addEventListener('change', () => {
    saveGoals();
    renderCalories(calFilter ? calFilter.value || null : null);
  });
});

// ── Food search (USDA FoodData Central) ───────────────────────────────────────
const USDA_KEY = 'DEMO_KEY'; // free public key; users can replace with their own
// Nutrient IDs used by SR Legacy / Foundation / Survey data types
const NID = { kcal: 1008, protein: 1003, carbs: 1005, fat: 1004 };

function getNutrient(nutrients, id) {
  const n = (nutrients || []).find((n) => n.nutrientId === id);
  return n ? Number(n.value) : 0;
}

const foodSearch     = document.getElementById('food-search');
const foodSearchBtn  = document.getElementById('food-search-btn');
const foodResults    = document.getElementById('food-results');
const calFoodName    = document.getElementById('cal-food-name');
const calFoodCals    = document.getElementById('cal-food-cals');
const calFoodProtein = document.getElementById('cal-food-protein');
const calFoodCarbs   = document.getElementById('cal-food-carbs');
const calFoodFat     = document.getElementById('cal-food-fat');

function fillFoodForm(name, kcal, protein, carbs, fat) {
  if (calFoodName)    calFoodName.value    = name;
  if (calFoodCals)    calFoodCals.value    = Math.round(kcal);
  if (calFoodProtein) calFoodProtein.value = protein.toFixed(1);
  if (calFoodCarbs)   calFoodCarbs.value   = carbs.toFixed(1);
  if (calFoodFat)     calFoodFat.value     = fat.toFixed(1);
  // Highlight selected result and scroll to the add-to-log form
  document.querySelectorAll('.food-result-item').forEach((el) => el.classList.remove('selected'));
  const addCard = document.getElementById('food-add-card');
  if (addCard) addCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function doFoodSearch() {
  const q = foodSearch ? foodSearch.value.trim() : '';
  if (!q) return;
  if (foodResults) foodResults.innerHTML = '<p class="search-loading">Searching…</p>';
  try {
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(q)}&api_key=${USDA_KEY}&pageSize=8&dataType=SR%20Legacy,Foundation,Survey%20(FNDDS)`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`USDA API error ${resp.status}`);
    const data = await resp.json();
    const foods = data.foods || [];
    if (foods.length === 0) {
      if (foodResults) foodResults.innerHTML = '<p class="empty">No results found. Try a different term.</p>';
      return;
    }
    if (foodResults) {
      foodResults.innerHTML = '';
      const ul = document.createElement('ul');
      ul.className = 'food-result-list';
      foods.forEach((f) => {
        const kcal    = getNutrient(f.foodNutrients, NID.kcal);
        const protein = getNutrient(f.foodNutrients, NID.protein);
        const carbs   = getNutrient(f.foodNutrients, NID.carbs);
        const fat     = getNutrient(f.foodNutrients, NID.fat);
        const li = document.createElement('li');
        li.className = 'food-result-item';
        li.innerHTML = `
          <div class="food-result-name">${esc(f.description)}</div>
          <div class="food-result-macros">
            ${kcal.toFixed(0)} kcal &bull;
            P:${protein.toFixed(0)}g &bull;
            C:${carbs.toFixed(0)}g &bull;
            F:${fat.toFixed(0)}g
            <span class="food-result-note">per 100g</span>
          </div>`;
        li.addEventListener('click', () => {
          document.querySelectorAll('.food-result-item').forEach((el) => el.classList.remove('selected'));
          li.classList.add('selected');
          fillFoodForm(f.description, kcal, protein, carbs, fat);
        });
        ul.appendChild(li);
      });
      foodResults.appendChild(ul);
    }
  } catch (err) {
    let msg = esc(err.message);
    if (err instanceof TypeError) {
      msg = 'Network error. Check your internet connection.';
    }
    if (foodResults) foodResults.innerHTML = `<p class="empty">Search failed: ${msg}</p>`;
  }
}

if (foodSearchBtn) foodSearchBtn.addEventListener('click', doFoodSearch);
if (foodSearch) {
  foodSearch.addEventListener('keydown', (e) => { if (e.key === 'Enter') doFoodSearch(); });
}

if (calForm) {
  calForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(calForm);
    const entry = {
      id:       uid(),
      date:     fd.get('date') || todayISO(),
      food:     (fd.get('food') || '').trim(),
      calories: Number(fd.get('calories')) || 0,
      protein:  Number(fd.get('protein'))  || 0,
      carbs:    Number(fd.get('carbs'))    || 0,
      fat:      Number(fd.get('fat'))      || 0,
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
  if (workoutDateInput) workoutDateInput.value = today;
  document.querySelectorAll('input[name=date]').forEach((i) => { i.value = today; });

  // Restore macro goals
  const goals = getGoals();
  if (goalInput        && goals.calories) goalInput.value        = goals.calories;
  if (proteinGoalInput && goals.protein)  proteinGoalInput.value = goals.protein;
  if (carbsGoalInput   && goals.carbs)    carbsGoalInput.value   = goals.carbs;
  if (fatGoalInput     && goals.fat)      fatGoalInput.value     = goals.fat;

  // Restore saved Strava token
  const savedToken = localStorage.getItem('ft_strava_token');
  if (savedToken && stravaTokenInput) stravaTokenInput.value = savedToken;

  // Start workout builder with one blank exercise row
  addExerciseRow(null);

  renderLifts(null);
  renderRuns(null);
  renderCalories(null);
})();

