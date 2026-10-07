# SolarScope India — Architecture

## Frontend
- HTML5 semantic sections
- Responsive CSS with cinematic solar visuals
- Vanilla JavaScript (no external CDN dependency)
- Canvas ambient animation
- Interactive regional assessment
- State ranking chart
- Installed-capacity SVG donut
- Solar generation calculator
- Presentation Mode for classroom demos
- Offline fallback dataset

## Backend
- Node.js built-in HTTP server — no third-party package required
- Serves frontend files
- REST-style JSON API
- Server-side calculator validation and calculation

## API
- `GET /api/health`
- `GET /api/overview`
- `GET /api/regions`
- `GET /api/states`
- `GET /api/capacity`
- `GET /api/sources`
- `POST /api/calculate`

## Reliability design
The frontend first requests the backend API. If the API is unavailable (for example, if the user double-clicks the HTML file), it uses the same embedded fallback dataset so all main sections continue to work.
