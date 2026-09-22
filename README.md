# Bharati · Digital Twin — Remote Operations Console

Interactive MVP for **SIH Problem Statement 26060 — "Digital Twin for Remote
Management of India's Antarctic Stations"** (NCPOR, Ministry of Earth
Sciences). Scope: **Bharati station only**. All telemetry is simulated —
NCPOR does not publish operational figures.

## Run

```bash
npm install
npm run dev        # dev server on http://localhost:5173
```

Frontend: Vite + React 19 + TypeScript + Tailwind CSS v4 · Framer Motion ·
Recharts v3. No backend, no auth — single self-contained web app.

## Features

1. **Station module map** — clickable SVG regions (Main Building, Fuel Farm,
   Fuel Station, Sea-water Pump House, Summer Camp/Emergency Shelter, AGEOS
   ground station), colour-coded by live status; click to open a module detail
   panel with live bound metrics.
2. **Live simulated telemetry** — ambient temperature, generator load % and
   fuel reserve % update every ~2 s on a bounded random walk, rendered as live
   chart lines with monospace readouts.
3. **Threshold-driven alert feed** — fires on temperature/load/fuel band
   transitions, timestamped, severity-coloured, newest first. HQ Admin can
   acknowledge alerts (Station Leader cannot).
4. **Fuel-runway estimate** — simulated days of fuel computed live from
   reserve % ÷ current burn rate.
5. **Offline-first store-and-forward** — the header *Satellite link* control
   faults/restores the link. Offline: edge telemetry keeps updating and a
   queued-packet counter increments; restore: animated "syncing N packets"
   flush then reset.
6. **"Simulate generator failure"** — drops load to 0, flips Main Building to
   critical, fires a critical alert, engages backup-power burn and visibly
   shrinks the fuel runway; "Reset to nominal" restores.
7. **Role-based views** — HQ Admin / Station Leader / Scientist. Scientist
   genuinely hides the fuel, generator, what-if and alert panels and sees only
   environmental telemetry plus the station map (including role-restricted
   module details).

## Scripts

- `npm run dev` — dev server
- `npm run build` — type-check + production build to `dist/`
- `npm run preview` — serve the production build
- `npm run lint` — oxlint

## Structure

```
src/
  simulation/        reducer-driven sim engine + provider (tick, thresholds, store-and-forward)
  components/        map, telemetry, alerts, fuel runway, what-if, header, panel primitives
  constants.ts       simulation parameters and thresholds
  types.ts           domain types + module/role metadata
  App.tsx            role-aware dashboard composition
```