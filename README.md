# SolarScope India — Professional Full-Stack Build

## Recommended way to run (uses backend API)
1. Install Node.js if it is not already installed.
2. Open CMD/Terminal in this folder.
3. Run:
   `npm start`
4. Open:
   `http://localhost:3000`

No `npm install` is required — the backend uses only Node.js built-in modules.

## Easy offline preview
Open `public/index.html` directly in Chrome/Edge. The frontend contains a full fallback dataset, so the core website still works without the backend. API status will show `Offline-ready`.

## Backend endpoints
- `GET /api/health`
- `GET /api/overview`
- `GET /api/regions`
- `GET /api/states`
- `GET /api/capacity`
- `GET /api/sources`
- `POST /api/calculate`

Example calculator body:
```json
{"size":10,"sunHours":5.2,"performanceRatio":0.8}
```

## Before college submission
Edit the four placeholders in `public/index.html`:
- Your Name
- 000000
- Your Department
- Faculty Name

## Presentation Mode
Click `Present` in the top navigation. Use Left/Right arrow keys to move through sections and `Esc` to exit.
