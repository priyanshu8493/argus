import {
  BURN_BACKUP,
  BURN_NOMINAL,
  FUEL_CRIT,
  FUEL_FLOOR,
  FUEL_START,
  FUEL_WARN,
  HISTORY_LEN,
  LOAD_CRIT,
  LOAD_MAX,
  LOAD_MIN,
  LOAD_NOMINAL_TARGET,
  LOAD_SPIKE_START_P,
  LOAD_SPIKE_STEP,
  LOAD_SPIKE_TICKS_MAX,
  LOAD_SPIKE_TICKS_MIN,
  LOAD_STEP,
  LOAD_WARN,
  PACKETS_PER_TICK,
  SEA_STEP,
  SEA_WARN,
  STORM_START_P,
  STORM_TICKS_MAX,
  STORM_TICKS_MIN,
  TEMP_CRIT_LO,
  TEMP_MAX,
  TEMP_MIN,
  TEMP_STEP,
  TEMP_STORM_BIAS,
  TEMP_WARN_HI,
  TEMP_WARN_LO,
  TICK_DT_DAYS,
  clamp,
  rand,
} from '../constants'
import type { AlertItem, Band, ModuleId, ModuleState, Role, Sample, SimState, Status } from '../types'

export type SimAction =
  | { type: 'TICK' }
  | { type: 'SET_ROLE'; role: Role }
  | { type: 'SAT_OFFLINE' }
  | { type: 'SAT_ONLINE' }
  | { type: 'SYNC_DONE' }
  | { type: 'SELECT'; id: ModuleId | null }
  | { type: 'ACK'; id: number }
  | { type: 'GEN_FAIL' }
  | { type: 'RESET_NOMINAL' }

const burnPerTick = BURN_NOMINAL * TICK_DT_DAYS

function push(h: Sample[], t: number, v: number): Sample[] {
  return [...h, { t, v }].slice(-HISTORY_LEN)
}

function tempBand(v: number): Band {
  if (v >= TEMP_WARN_HI || v <= TEMP_WARN_LO) {
    return v > 5 || v < TEMP_CRIT_LO ? { kind: 'critical' } : { kind: 'warning' }
  }
  return { kind: 'ok' }
}

function loadBand(l: number): Band {
  if (l >= LOAD_CRIT) return { kind: 'critical' }
  if (l >= LOAD_WARN) return { kind: 'warning' }
  return { kind: 'ok' }
}

function fuelBand(f: number): Band {
  if (f <= FUEL_CRIT) return { kind: 'critical' }
  if (f <= FUEL_WARN) return { kind: 'warning' }
  return { kind: 'ok' }
}

const bandStatus = (b: Band): Status => b.kind

function makeAlert(seq: number, ts: number, severity: Status, source: string, message: string): AlertItem {
  return { id: seq, ts, severity, source, message }
}

function seededHistories() {
  let temp = -18.6
  let gen = 63
  let fuel = FUEL_START + HISTORY_LEN * burnPerTick
  const tempH: Sample[] = []
  const genH: Sample[] = []
  const fuelH: Sample[] = []
  for (let t = -HISTORY_LEN; t < 0; t += 1) {
    temp = clamp(temp + rand(-TEMP_STEP, TEMP_STEP), TEMP_MIN, TEMP_MAX)
    gen = clamp(gen + rand(-LOAD_STEP, LOAD_STEP), LOAD_MIN, LOAD_MAX)
    fuel = Math.max(FUEL_FLOOR, fuel - burnPerTick)
    tempH.push({ t, v: temp })
    genH.push({ t, v: gen })
    fuelH.push({ t, v: fuel })
  }
  return { temp, gen, fuel, tempH, genH, fuelH }
}

function status3(
  id: ModuleId,
  v: number,
  warn: number,
  crit: number,
  okNote: string,
  warnNote: string,
  critNote: string,
): ModuleState {
  if (v <= crit) return { id, status: 'critical', note: critNote }
  if (v <= warn) return { id, status: 'warning', note: warnNote }
  return { id, status: 'ok', note: okNote }
}

function moduleSnapshot(s: SimState): Record<ModuleId, ModuleState> {
  return {
    main: {
      id: 'main',
      status: s.generatorFailed
        ? 'critical'
        : s.gen.v >= LOAD_CRIT
          ? 'critical'
          : s.gen.v >= LOAD_WARN
            ? 'warning'
            : 'ok',
      note: s.generatorFailed
        ? 'Generator tripped — backup bus live'
        : s.gen.v >= LOAD_CRIT
          ? 'Bus overloaded'
          : s.gen.v >= LOAD_WARN
            ? 'High load, watch margins'
            : 'Bus nominal',
    },
    'fuel-farm': status3('fuel-farm', s.fuel.v, FUEL_WARN, FUEL_CRIT, 'Reserve adequate', 'Below warning band', 'Reserve critical'),
    'fuel-station': status3('fuel-station', s.fuel.v, FUEL_WARN, FUEL_CRIT, 'Transfer nominal', 'Drawdown elevated', 'Supply critical'),
    'pump-house':
      s.seaState > SEA_WARN
        ? { id: 'pump-house', status: 'warning', note: 'Frazil ice in intake' }
        : { id: 'pump-house', status: 'ok', note: 'Intake nominal' },
    'summer-camp': { id: 'summer-camp', status: 'ok', note: 'Standby — unoccupied' },
    ageos: s.satelliteOnline
      ? { id: 'ageos', status: 'ok', note: 'Uplink nominal' }
      : { id: 'ageos', status: 'warning', note: 'Downlink suspended — store-and-forward active' },
  }
}

export function initialState(): SimState {
  const seed = seededHistories()
  const now = Date.now()
  const bootAlerts: AlertItem[] = [
    makeAlert(1, now, 'ok', 'Twin', 'Digital twin online — simulated stream started'),
    makeAlert(2, now - 90000, 'ok', 'AGEOS', 'Uplink established to NCPOR HQ'),
  ]
  const fuel = seed.fuel
  const burnRate = BURN_NOMINAL
  const base: SimState = {
    role: 'admin',
    now,
    tick: 0,
    satelliteOnline: true,
    syncing: false,
    syncTotal: 0,
    queuedPackets: 0,
    generatorFailed: false,
    recovering: false,
    temp: { v: seed.temp, history: seed.tempH, band: tempBand(seed.temp) },
    gen: { v: seed.gen, history: seed.genH, band: loadBand(seed.gen) },
    fuel: { v: fuel, history: seed.fuelH, band: fuelBand(fuel) },
    burnRate,
    daysRemaining: fuel / burnRate,
    stormTicksLeft: 0,
    loadSpikeTicks: 0,
    seaState: 0.4,
    modules: {} as Record<ModuleId, ModuleState>,
    selected: 'main',
    alerts: bootAlerts,
  }
  base.modules = moduleSnapshot(base)
  return base
}

function alertSeq(state: SimState): number {
  return state.alerts.length ? Math.max(...state.alerts.map((a) => a.id)) + 1 : 1
}

function withAlert(state: SimState, severity: Status, source: string, message: string): AlertItem {
  return makeAlert(alertSeq(state), Date.now(), severity, source, message)
}

export function reducer(state: SimState, action: SimAction): SimState {
  switch (action.type) {
    case 'SET_ROLE':
      return { ...state, role: action.role }

    case 'SELECT':
      return { ...state, selected: action.id }

    case 'ACK':
      return {
        ...state,
        alerts: state.alerts.map((a) => (a.id === action.id ? { ...a, acked: true } : a)),
      }

    case 'GEN_FAIL': {
      if (state.generatorFailed) return state
      const alert = withAlert(state, 'critical', 'Power', `Generator failure — Main Building switched to backup bus`)
      const next: SimState = {
        ...state,
        generatorFailed: true,
        recovering: false,
        gen: { ...state.gen, v: 4, band: { kind: 'ok' } },
        burnRate: BURN_BACKUP,
        daysRemaining: state.fuel.v / BURN_BACKUP,
        alerts: [alert, ...state.alerts].slice(0, 60),
      }
      next.modules = moduleSnapshot(next)
      return next
    }

    case 'RESET_NOMINAL': {
      if (!state.generatorFailed) return state
      const alert = withAlert(state, 'ok', 'Power', `Generator restored — re-synchronising to nominal bus`)
      return {
        ...state,
        generatorFailed: false,
        recovering: true,
        gen: { ...state.gen, v: 8, band: { kind: 'ok' } },
        burnRate: BURN_NOMINAL,
        daysRemaining: state.fuel.v / BURN_NOMINAL,
        alerts: [alert, ...state.alerts].slice(0, 60),
      }
    }

    case 'SAT_OFFLINE': {
      if (!state.satelliteOnline || state.syncing) return state
      const alert = withAlert(state, 'warning', 'AGEOS', `Satellite link down — edge processing continues, telemetry queued`)
      return {
        ...state,
        satelliteOnline: false,
        alerts: [alert, ...state.alerts].slice(0, 60),
        modules: { ...state.modules, ageos: { id: 'ageos', status: 'warning', note: 'Downlink suspended — store-and-forward active' } },
      }
    }

    case 'SAT_ONLINE': {
      if (state.satelliteOnline) return state
      const queued = state.queuedPackets
      const s: SimState = { ...state, satelliteOnline: true }
      if (queued > 0) {
        s.syncing = true
        s.syncTotal = queued
      } else {
        const alert = withAlert(s, 'ok', 'AGEOS', `Satellite link restored — nothing queued`)
        s.alerts = [alert, ...s.alerts].slice(0, 60)
      }
      s.modules = { ...s.modules, ageos: { id: 'ageos', status: 'ok', note: s.syncing ? 'Re-establishing uplink' : 'Uplink nominal' } }
      return s
    }

    case 'SYNC_DONE': {
      if (!state.syncing) return state
      const alert = withAlert(state, 'ok', 'AGEOS', `Store-and-forward flushed — ${state.syncTotal} packets synced to HQ`)
      return {
        ...state,
        syncing: false,
        syncTotal: 0,
        queuedPackets: 0,
        alerts: [alert, ...state.alerts].slice(0, 60),
      }
    }

    case 'TICK': {
      const tick = state.tick + 1
      const now = Date.now()

      // storm regime — pushes ambient into occasional cold-warning/critical
      let stormTicksLeft = state.stormTicksLeft
      if (stormTicksLeft <= 0 && Math.random() < STORM_START_P) {
        stormTicksLeft = Math.round(rand(STORM_TICKS_MIN, STORM_TICKS_MAX))
      }
      const inStorm = stormTicksLeft > 0
      if (inStorm) stormTicksLeft -= 1

      const bias = inStorm ? TEMP_STORM_BIAS : 0
      const tv = clamp(state.temp.v + rand(-TEMP_STEP, TEMP_STEP) + bias, TEMP_MIN, TEMP_MAX)

      let gv: number
      let loadSpikeTicks = state.loadSpikeTicks
      if (state.generatorFailed) {
        gv = clamp(state.gen.v + rand(-0.8, 0.8), 2, 10)
      } else if (state.recovering) {
        gv = Math.min(state.gen.v + 4.6, LOAD_NOMINAL_TARGET)
      } else {
        if (loadSpikeTicks <= 0 && Math.random() < LOAD_SPIKE_START_P) {
          loadSpikeTicks = Math.round(rand(LOAD_SPIKE_TICKS_MIN, LOAD_SPIKE_TICKS_MAX))
        }
        const inSpike = loadSpikeTicks > 0
        if (inSpike) loadSpikeTicks -= 1
        if (inSpike) {
          gv = clamp(state.gen.v + rand(1.4, LOAD_SPIKE_STEP + 1.4), LOAD_MIN, LOAD_MAX)
        } else {
          gv = clamp(state.gen.v + rand(-LOAD_STEP, LOAD_STEP), LOAD_MIN, LOAD_MAX)
        }
      }

      const burn = state.burnRate
      const fuel = clamp(state.fuel.v - burn * TICK_DT_DAYS, FUEL_FLOOR, 100)
      const daysRemaining = fuel / burn
      const seaState = clamp(state.seaState + rand(-SEA_STEP, SEA_STEP), 0, 1)

      const tBand = tempBand(tv)
      const lBand = loadBand(gv)
      const fBand = fuelBand(fuel)

      let queued = state.queuedPackets
      if (!state.satelliteOnline) queued += PACKETS_PER_TICK

      let alerts = state.alerts
      let seq = alertSeq(state)

      if (tBand.kind !== state.temp.band.kind) {
        if (tBand.kind === 'warning') {
          alerts = [makeAlert(seq++, now, 'warning', 'Ambient', `Temperature ${tv.toFixed(1)}°C outside nominal band`), ...alerts]
        } else if (tBand.kind === 'critical') {
          alerts = [makeAlert(seq++, now, 'critical', 'Ambient', `Temperature ${tv.toFixed(1)}°C — critical cold, field ops restricted`), ...alerts]
        } else {
          alerts = [makeAlert(seq++, now, 'ok', 'Ambient', `Temperature back to nominal (${tv.toFixed(1)}°C)`), ...alerts]
        }
      }

      if (!state.generatorFailed && !state.recovering && lBand.kind !== state.gen.band.kind) {
        if (lBand.kind === 'warning') {
          alerts = [makeAlert(seq++, now, 'warning', 'Power', `Generator load ${gv.toFixed(0)}% — above ${LOAD_WARN}% threshold`), ...alerts]
        } else if (lBand.kind === 'critical') {
          alerts = [makeAlert(seq++, now, 'critical', 'Power', `Generator load ${gv.toFixed(0)}% — bus critical`), ...alerts]
        } else {
          alerts = [makeAlert(seq++, now, 'ok', 'Power', `Generator load nominal (${gv.toFixed(0)}%)`), ...alerts]
        }
      }

      if (fBand.kind !== state.fuel.band.kind) {
        if (fBand.kind === 'warning') {
          alerts = [makeAlert(seq++, now, 'warning', 'Fuel', `Reserve ${fuel.toFixed(1)}% — below ${FUEL_WARN}% band`), ...alerts]
        } else if (fBand.kind === 'critical') {
          alerts = [makeAlert(seq++, now, 'critical', 'Fuel', `Reserve ${fuel.toFixed(1)}% — critical, resupply required`), ...alerts]
        } else {
          alerts = [makeAlert(seq++, now, 'ok', 'Fuel', `Reserve back above ${FUEL_WARN}% band`), ...alerts]
        }
      }

      if (state.recovering && gv >= LOAD_NOMINAL_TARGET) {
        alerts = [makeAlert(seq++, now, 'ok', 'Power', `Backup power released — nominal bus restored`), ...alerts]
      }

      const next: SimState = {
        ...state,
        now,
        tick,
        stormTicksLeft,
        loadSpikeTicks,
        temp: { v: tv, history: push(state.temp.history, tick, tv), band: tBand },
        gen: { v: gv, history: push(state.gen.history, tick, gv), band: lBand },
        fuel: { v: fuel, history: push(state.fuel.history, tick, fuel), band: fBand },
        burnRate: burn,
        daysRemaining,
        seaState,
        queuedPackets: queued,
        recovering: state.recovering ? gv < LOAD_NOMINAL_TARGET : false,
        alerts: alerts.slice(0, 60),
      }
      next.modules = moduleSnapshot(next)
      return next
    }

    default:
      return state
  }
}

export { bandStatus }