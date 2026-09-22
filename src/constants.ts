// Simulation parameters and thresholds.
// All figures are simulated for demonstration — NCPOR does not publish
// operational telemetry, so nothing here reflects real Bharati data.

export const TICK_MS = 2000
export const TICK_DT_DAYS = 0.02 // one tick ≈ 29 sim-minutes of station ops
export const HISTORY_LEN = 90

// --- Ambient temperature (°C) — Bharati surf-air band ---------------------
export const TEMP_NOMINAL_HI = 0
export const TEMP_WARN_HI = 2
export const TEMP_NOMINAL_LO = -25
export const TEMP_WARN_LO = -28
export const TEMP_CRIT_LO = -35
export const TEMP_MIN = -38
export const TEMP_MAX = 6
export const TEMP_STEP = 0.4
export const TEMP_STORM_BIAS = -1.25
export const STORM_START_P = 0.05
export const STORM_TICKS_MIN = 7
export const STORM_TICKS_MAX = 18

// --- Generator load (%) ---------------------------------------------------
export const LOAD_STEP = 1.9
export const LOAD_MIN = 40
export const LOAD_MAX = 86
export const LOAD_NOMINAL_TARGET = 62
export const LOAD_WARN = 80
export const LOAD_CRIT = 90
// Occasional heating-load spike so margin warning is observable
export const LOAD_SPIKE_START_P = 0.055
export const LOAD_SPIKE_TICKS_MIN = 6
export const LOAD_SPIKE_TICKS_MAX = 14
export const LOAD_SPIKE_STEP = 2.1

// --- Fuel (%) -------------------------------------------------------------
export const FUEL_START = 88.4
export const FUEL_FLOOR = 2.0
export const FUEL_WARN = 30
export const FUEL_CRIT = 15
export const BURN_NOMINAL = 1.55 // % of reserve per sim-day
export const BURN_BACKUP = 3.2 // % per sim-day while on backup power

// --- Sea-water intake (0..1) ---------------------------------------------
export const SEA_STEP = 0.07
export const SEA_WARN = 0.72

// --- Store-and-forward ----------------------------------------------------
export const PACKETS_PER_TICK = 8
export const SYNC_FLUSH_MS = 2400

// --- Runway colour thresholds (days) -------------------------------------
export const RUNWAY_WARN = 25
export const RUNWAY_CRIT = 12

export function daysIn(ms: number): string {
  return new Date(ms).toISOString().slice(11, 19)
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v))
}

export function rand(lo: number, hi: number): number {
  return lo + Math.random() * (hi - lo)
}