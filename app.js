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

function round1(n) { return Math.round(n * 10) / 10; }

// Escape HTML to prevent XSS when inserting values into innerHTML
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Compute totals from grams served and per-100g nutritional values
function computeMacros(grams, cal100, pro100, carb100, fat100) {
  const factor = (Number(grams) || 0) / 100;
  return {
    calories: Math.round((Number(cal100)  || 0) * factor),
    protein:  round1((Number(pro100)  || 0) * factor),
    carbs:    round1((Number(carb100) || 0) * factor),
    fat:      round1((Number(fat100)  || 0) * factor),
  };
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
const liftForm   = document.getElementById('lift-form');
const liftList   = document.getElementById('lift-list');
const liftFilter = document.getElementById('lift-filter-date');

function renderLifts(filterDate) {
  let lifts = store.get(KEYS.lifts);
  if (filterDate) lifts = lifts.filter((l) => l.date === filterDate);

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
  [...lifts].reverse().forEach((l) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <strong>${esc(l.exercise)}</strong>
        <span class="meta"> &mdash; ${esc(l.sets)} sets × ${esc(l.reps)} reps @ ${esc(l.weight)} lbs</span>
        <div class="meta">${fmtDate(l.date)}</div>
      </div>
      <button class="del-btn" title="Delete" data-key="lifts" data-id="${esc(l.id)}">✕</button>`;
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

  document.getElementById('run-total').textContent = runs.length;
  const dist = runs.reduce((s, r) => s + Number(r.distance), 0);
  document.getElementById('run-dist').textContent = dist.toFixed(2) + ' mi';
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
        <strong>${esc(r.distance)} mi</strong>
        <span class="meta"> &mdash; ${esc(r.duration || '—')} &mdash; ${esc(r.type || 'Run')}</span>
        <div class="meta">${fmtDate(r.date)}</div>
      </div>
      <button class="del-btn" title="Delete" data-key="runs" data-id="${esc(r.id)}">✕</button>`;
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
const calForm   = document.getElementById('cal-form');
const calList   = document.getElementById('cal-list');
const calFilter = document.getElementById('cal-filter-date');
const goalInput = document.getElementById('cal-goal');

// ── Live macro preview ────────────────────────────────────────────────────────
function updateCalPreview() {
  const grams   = document.getElementById('cal-grams').value;
  const cal100  = document.getElementById('cal-per100').value;
  const pro100  = document.getElementById('protein-per100').value;
  const carb100 = document.getElementById('carbs-per100').value;
  const fat100  = document.getElementById('fat-per100').value;

  const preview = document.getElementById('cal-preview');
  if (!grams) { preview.style.display = 'none'; return; }

  const m = computeMacros(grams, cal100, pro100, carb100, fat100);
  document.getElementById('prev-kcal').textContent    = m.calories + ' kcal';
  document.getElementById('prev-protein').textContent = m.protein + 'g';
  document.getElementById('prev-carbs').textContent   = m.carbs + 'g';
  document.getElementById('prev-fat').textContent     = m.fat + 'g';
  preview.style.display = 'flex';
}

['cal-grams', 'cal-per100', 'protein-per100', 'carbs-per100', 'fat-per100'].forEach((id) => {
  document.getElementById(id).addEventListener('input', updateCalPreview);
});

// ── Render calories ───────────────────────────────────────────────────────────
function renderCalories(filterDate) {
  const date       = filterDate || todayISO();
  const all        = store.get(KEYS.calories);
  const dayEntries = all.filter((c) => c.date === date);
  const goal       = Number(localStorage.getItem(KEYS.goal) || 2000);

  const total   = dayEntries.reduce((s, c) => s + Number(c.calories || 0), 0);
  const protein = dayEntries.reduce((s, c) => s + Number(c.protein  || 0), 0);
  const carbs   = dayEntries.reduce((s, c) => s + Number(c.carbs    || 0), 0);
  const fat     = dayEntries.reduce((s, c) => s + Number(c.fat      || 0), 0);

  // summary tiles
  document.getElementById('cal-today-total').textContent = total;
  document.getElementById('macro-protein').textContent   = round1(protein) + 'g';
  document.getElementById('macro-carbs').textContent     = round1(carbs) + 'g';
  document.getElementById('macro-fat').textContent       = round1(fat) + 'g';

  // progress bar card
  document.getElementById('cal-total').textContent    = total;
  document.getElementById('cal-goal-disp').textContent = goal;
  document.getElementById('cal-remain').textContent   = Math.max(0, goal - total);
  const pct = Math.min(100, (total / goal) * 100);
  const bar = document.getElementById('cal-prog');
  bar.style.width = pct + '%';
  bar.className = 'prog-bar' + (pct >= 100 ? '' : pct >= 80 ? ' warn' : ' ok');

  // food log list
  const display = filterDate ? all.filter((c) => c.date === filterDate) : dayEntries;
  calList.innerHTML = '';
  if (display.length === 0) {
    calList.innerHTML = '<li class="empty">No entries for this day.</li>';
    return;
  }
  [...display].reverse().forEach((c) => {
    const li = document.createElement('li');
    const hasMacros = c.protein || c.carbs || c.fat;
    const macroStr  = hasMacros
      ? `<span class="macro-pill protein">P:${esc(String(c.protein || 0))}g</span>`
      + `<span class="macro-pill carbs">C:${esc(String(c.carbs   || 0))}g</span>`
      + `<span class="macro-pill fat">F:${esc(String(c.fat     || 0))}g</span>`
      : '';
    const gramsStr = c.grams ? ` &mdash; ${esc(String(c.grams))}g` : '';
    li.innerHTML = `
      <div>
        <strong>${esc(c.food)}</strong>${gramsStr}
        <span class="meta"> &mdash; ${esc(String(c.calories))} kcal</span>
        ${hasMacros ? `<div class="macro-row">${macroStr}</div>` : ''}
        <div class="meta">${fmtDate(c.date)}</div>
      </div>
      <button class="del-btn" title="Delete" data-key="calories" data-id="${esc(c.id)}">✕</button>`;
    calList.appendChild(li);
  });
}

calForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const fd      = new FormData(calForm);
  const grams   = fd.get('grams');
  const cal100  = fd.get('cal_per100');
  const pro100  = fd.get('protein_per100');
  const carb100 = fd.get('carbs_per100');
  const fat100  = fd.get('fat_per100');
  const m       = computeMacros(grams, cal100, pro100, carb100, fat100);

  const entry = {
    id:             uid(),
    date:           fd.get('date') || todayISO(),
    food:           fd.get('food').trim(),
    grams:          grams   ? Number(grams)   : null,
    cal_per100:     cal100  ? Number(cal100)  : null,
    protein_per100: pro100  ? Number(pro100)  : null,
    carbs_per100:   carb100 ? Number(carb100) : null,
    fat_per100:     fat100  ? Number(fat100)  : null,
    calories:       m.calories,
    protein:        m.protein,
    carbs:          m.carbs,
    fat:            m.fat,
  };

  if (!entry.food || !entry.grams) return;

  const all = store.get(KEYS.calories);
  all.push(entry);
  store.set(KEYS.calories, all);
  calForm.reset();
  document.querySelector('#cal-form [name=date]').value = todayISO();
  document.getElementById('cal-preview').style.display = 'none';
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

// ══════════════════════════════════════════════════════════════════════════════
// BARCODE SCANNER
// ══════════════════════════════════════════════════════════════════════════════
const scannerModal  = document.getElementById('scanner-modal');
const scannerVideo  = document.getElementById('scanner-video');
const scannerStatus = document.getElementById('scanner-status');
const scanBtn       = document.getElementById('scan-btn');
const scannerClose  = document.getElementById('scanner-close');

let scannerControls = null;

function openScanner() {
  scannerModal.style.display = 'flex';
  scannerStatus.textContent  = 'Starting camera…';

  if (typeof ZXingBrowser === 'undefined') {
    scannerStatus.textContent = '⚠ Scanner library not loaded. Check your internet connection.';
    return;
  }

  const codeReader = new ZXingBrowser.BrowserMultiFormatReader();
  codeReader.decodeFromVideoDevice(null, scannerVideo, (result, err, controls) => {
    scannerControls = controls;
    if (result) {
      controls.stop();
      closeScanner();
      lookupBarcode(result.getText());
    } else if (err && err.name !== 'NotFoundException') {
      scannerStatus.textContent = '⚠ Camera error: ' + err.message;
    } else {
      scannerStatus.textContent = 'Point camera at barcode…';
    }
  }).catch((err) => {
    scannerStatus.textContent = '⚠ Camera access denied. Please allow camera permission and try again.';
    console.error('Scanner error:', err);
  });
}

function closeScanner() {
  if (scannerControls) {
    scannerControls.stop();
    scannerControls = null;
  }
  scannerModal.style.display = 'none';
}

async function lookupBarcode(barcode) {
  scannerStatus.textContent = 'Looking up product…';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}?fields=product_name,nutriments`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!res.ok) throw new Error('Network error');
    const data = await res.json();

    if (data.status === 0 || !data.product) {
      alert('Product not found in Open Food Facts database. Please enter details manually.');
      return;
    }

    const p = data.product;
    const n = p.nutriments || {};

    if (p.product_name) {
      document.getElementById('cal-food').value = p.product_name;
    }
    document.getElementById('cal-per100').value     = Math.round(n['energy-kcal_100g'] || 0);
    document.getElementById('protein-per100').value = round1(n['proteins_100g']      || 0);
    document.getElementById('carbs-per100').value   = round1(n['carbohydrates_100g'] || 0);
    document.getElementById('fat-per100').value     = round1(n['fat_100g']           || 0);

    // Default serving to 100g if empty
    if (!document.getElementById('cal-grams').value) {
      document.getElementById('cal-grams').value = 100;
    }
    updateCalPreview();
  } catch (err) {
    if (err.name === 'AbortError') {
      alert('Request timed out. Check your internet connection and try again.');
    } else {
      alert('Could not look up barcode. Check your internet connection and try again.');
    }
  }
}

scanBtn.addEventListener('click', openScanner);
scannerClose.addEventListener('click', closeScanner);
// Close modal when clicking the dark backdrop
scannerModal.addEventListener('click', (e) => {
  if (e.target === scannerModal) closeScanner();
});
// Close modal with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && scannerModal.style.display !== 'none') closeScanner();
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
  if (key === 'lifts')    renderLifts(liftFilter.value || null);
  if (key === 'runs')     renderRuns(runFilter.value || null);
  if (key === 'calories') renderCalories(calFilter.value || null);
});

// ── Boot ──────────────────────────────────────────────────────────────────────
(function init() {
  const today = todayISO();
  document.querySelectorAll('input[name=date]').forEach((i) => { i.value = today; });
  const savedGoal = localStorage.getItem(KEYS.goal);
  if (savedGoal) goalInput.value = savedGoal;

  renderLifts(null);
  renderRuns(null);
  renderCalories(null);
})();
