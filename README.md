# 🏋️ Fitness Tracker

A lightweight, zero-dependency fitness tracker that runs entirely in the browser. Track your lifts, runs, and daily calories — all data is saved locally in your browser via `localStorage`.

---

## Features

| Tab | What you can log |
|---|---|
| 💪 **Lifts** | Exercise name, sets, reps, weight (lbs) |
| 🏃 **Runs** | Distance (mi), duration (h:mm:ss), run type |
| 🥗 **Calories** | Food / meal name, calorie count, daily goal |

- Summary tiles (total entries, volume, distance, pace, etc.)
- Date filter on every log
- Delete any entry with one click
- Calorie progress bar with colour coding (green → yellow → red)
- All data persists across page reloads via `localStorage` — no server required

---

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/bhdeitz124/bhdeitz1.git
   cd bhdeitz1
   ```
2. Open `index.html` in any modern browser — no build step needed:
   ```bash
   # macOS
   open index.html
   # Linux
   xdg-open index.html
   # Windows
   start index.html
   ```

---

## Repository Structure

```
bhdeitz1/
├── index.html   ← app shell & UI markup
├── style.css    ← responsive styles
├── app.js       ← data layer (localStorage) + UI logic
└── README.md    ← this file
```

---

## Key Technologies

| Technology | Role |
|---|---|
| HTML5 | App structure and forms |
| CSS3 | Responsive layout, tabs, progress bar |
| Vanilla JavaScript (ES6+) | Business logic, localStorage persistence |

No frameworks, build tools, or external dependencies.

---

## Contributing

Pull requests and issues are welcome. Please open an issue first to discuss any major changes.
