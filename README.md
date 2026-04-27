# Fitness Tracker

A simple single-page fitness tracker app. Track your lifts, runs, and calorie intake — all stored locally in your browser.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Main page — open this in your browser |
| `app.js` | App logic (localStorage CRUD, tab switching, form handling) |
| `style.css` | Styling |

## How to open

Double-click `index.html` (or right-click → Open with → your browser). No server required — works via `file://` on Windows, Mac, or Linux.

## Features

- **Lifts tab** — Log exercises with sets, reps, and weight; see total entries, sets, and volume
- **Runs tab** — Log runs with distance, duration, and type; see totals and average pace
- **Calories tab** — Log food with calorie counts; set a daily goal with a progress bar
- Filter any log by date; delete individual entries
- All data stored in browser `localStorage` (persists between sessions)