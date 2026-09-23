import {
  FUEL_CRIT,
  FUEL_WARN,
  LOAD_CRIT,
  LOAD_WARN,
  RUNWAY_WARN,
  SEA_WARN,
  TEMP_CRIT_LO,
  TEMP_WARN_HI,
  TEMP_WARN_LO,
  TICK_DT_DAYS,
} from './constants'
import type { ModuleId, Role, SimState, Sample } from './types'
import { ROLE_META } from './types'

export type ForecastRisk = 'ok' | 'warning' | 'critical'

export interface ModuleForecast {
  risk: ForecastRisk
  statusLabel: 'STABLE' | 'DEGRADED' | 'CONTAINMENT'
  headline: string
  eta: string | null
  narrative: string
  actions: string[]
}

const SIM_HOURS_PER_TICK = TICK_DT_DAYS * 24

function slopeSamples(h: Sample[], window = 20): number {
  if (h.length < 4) return 0
  const a = h.slice(-window)
  const n = a.length
  const mid = n / 2
  let sx = 0
  let sy = 0
  let sxy = 0
  let sxx = 0
  for (let i = 0; i < n; i += 1) {
    const x = i - mid
    sx += x
    sy += a[i].v
    sxy += x * a[i].v
    sxx += x * x
  }
  if (sxx === 0) return 0
  return (n * sxy - sx * sy) / (n * sxx - sx * sx)
}

function fmtHours(h: number): string {
  if (!Number.isFinite(h) || h <= 0) return 'under an hour'
  if (h >= 72) return `${(h / 24).toFixed(1)} d`
  return `${h.toFixed(0)} h`
}

function fmtDays(d: number): string {
  if (!Number.isFinite(d) || d < 0) return 'imminent'
  return d >= 100 ? `${d.toFixed(0)} d` : `${d.toFixed(1)} d`
}

const LABEL: Record<ForecastRisk, ModuleForecast['statusLabel']> = {
  ok: 'STABLE',
  warning: 'DEGRADED',
  critical: 'CONTAINMENT',
}

export function getModuleForecast(state: SimState, role: Role, id: ModuleId): ModuleForecast {
  return ROLE_META[role].isOps ? opsForecast(state, id) : scienceForecast(state, id)
}

function opsForecast(state: SimState, id: ModuleId): ModuleForecast {
  const fuelToCrit = (state.fuel.v - FUEL_CRIT) / Math.max(state.burnRate, 0.001)
  const loadSlope = slopeSamples(state.gen.history)

  switch (id) {
    case 'main':
      if (state.generatorFailed) {
        return {
          risk: 'critical',
          statusLabel: LABEL.critical,
          headline: 'Backup bus engaged — burn rate 2.1×',
          eta: `${fmtDays(fuelToCrit)} to critical fuel at backup draw`,
          narrative:
            'Main Building is on the emergency bus. With the elevated draw, the fuel runway is contracting faster than resupply can recover.',
          actions: ['Sequential restart of the primary generator', 'Hold non-essential bus loads to hard floors'],
        }
      }
      if (state.loadSpikeTicks > 0 && state.gen.v >= LOAD_WARN) {
        const ticks = loadSlope > 0 ? (LOAD_CRIT - state.gen.v) / loadSlope : Infinity
        return {
          risk: 'warning',
          statusLabel: LABEL.warning,
          headline: `Heating-load spike — load ${state.gen.v.toFixed(0)}%`,
          eta: Number.isFinite(ticks) ? `critical bus in ~${fmtHours(ticks * SIM_HOURS_PER_TICK)}` : null,
          narrative:
            'A heating-load spike is pushing the bus toward the critical threshold. Margin to warning is thin while the spike lasts.',
          actions: ['Shed non-essential appliances', 'Enable reactive demand limiting on the bus'],
        }
      }
      if (state.recovering) {
        return {
          risk: 'warning',
          statusLabel: LABEL.warning,
          headline: 'Generator re-synchronising',
          eta: null,
          narrative: 'The mains are climbing back toward the nominal bus target after the reset. Loads are being re-applied gradually.',
          actions: ['Let the re-sync profile complete', 'Verify cooling before full bus hand-over'],
        }
      }
      const margin = LOAD_WARN - state.gen.v
      const ambientTone: ForecastRisk =
        state.temp.v <= TEMP_CRIT_LO || state.temp.v >= TEMP_WARN_HI ? 'critical' : state.temp.v <= TEMP_WARN_LO ? 'warning' : 'ok'
      return {
        risk: ambientTone,
        statusLabel: LABEL[ambientTone],
        headline: `Bus nominal — ${Math.max(margin, 0).toFixed(0)} pts to warn`,
        eta: null,
        narrative:
          'Power delivery is stable. Track the heating margin: a cold snap can drive a load spike and quickly eat the reserve.',
        actions: ['Monitor generator band while ambient falls', 'Keep emergency loads pre-staged'],
      }

    case 'fuel-farm':
    case 'fuel-station': {
      const r: ForecastRisk =
        state.fuel.v <= FUEL_CRIT ? 'critical' : state.fuel.v <= FUEL_WARN || state.daysRemaining <= RUNWAY_WARN ? 'warning' : 'ok'
      return {
        risk: r,
        statusLabel: LABEL[r],
        headline:
          state.fuel.v <= FUEL_CRIT
            ? 'Reserve critical — resupply overdue'
            : `Runway ${state.daysRemaining.toFixed(1)} d at ${state.burnRate.toFixed(2)}%/d draw`,
        eta: `${fmtDays(fuelToCrit)} to critical reserve`,
        narrative:
          state.fuel.v <= FUEL_CRIT
            ? 'The reserve sits below the safety floor. Every tick draws closer to a full outage unless resupply or conservation intervenes.'
            : `At current draw, the reserve crosses critical in ${fmtDays(fuelToCrit)}. The resupply window is ${state.daysRemaining <= RUNWAY_WARN ? 'within risk of being missed' : 'clear'}.`,
        actions:
          state.fuel.v <= FUEL_CRIT
            ? ['Declare fuel emergency to HQ', 'Switch to minimised burn profile']
            : ['Flag resupply window to NCPOR HQ', 'Trim burn by deferring non-critical draw'],
      }
    }

    case 'pump-house': {
      const below = state.seaState > SEA_WARN
      if (state.stormTicksLeft > 0) {
        return {
          risk: below ? 'critical' : 'warning',
          statusLabel: LABEL[below ? 'critical' : 'warning'],
          headline: 'Storm-driven cooling load on intake',
          eta: null,
          narrative:
            'The storm is pulling ambient down and churning the water. Frazil ice risk in the intake rises sharply while the front passes.',
          actions: ['Arm the intake heat-trace circuit', 'Stand by the backup intake pump'],
        }
      }
      return {
        risk: below ? 'warning' : 'ok',
        statusLabel: LABEL[below ? 'warning' : 'ok'],
        headline: below ? `Frazil ice — intake ${(state.seaState * 100).toFixed(0)}% flow` : `Intake nominal — ${(state.seaState * 100).toFixed(0)}% flow`,
        eta: null,
        narrative: below
          ? 'Sediment and frazil are fouling the intake screens, cutting cooling capacity for the plant.'
          : 'Sea-water intake flow is healthy. Cooling for plant and water production is within spec.',
        actions: below
          ? ['Deploy heat-trace and screen cleaning', 'Watch pump current for cavitation onset']
          : ['Routine screen inspection on next watch'],
      }
    }

    case 'ageos': {
      if (!state.satelliteOnline) {
        const critical = state.queuedPackets > 60
        return {
          risk: critical ? 'critical' : 'warning',
          statusLabel: LABEL[critical ? 'critical' : 'warning'],
          headline: 'Uplink suspended — store-and-forward active',
          eta: null,
          narrative: `Telemetry is queuing at the edge (${state.queuedPackets} packets) while the downlink is down. HQ sees the last synced state only.`,
          actions: ['Cue a pass window for flush', 'Audit queued packet integrity'],
        }
      }
      return {
        risk: 'ok',
        statusLabel: 'STABLE',
        headline: 'Uplink nominal to NCPOR HQ',
        eta: null,
        narrative: 'The AGEOS ground segment is carrying telemetry to Goa with no backlog.',
        actions: ['Keep the dish on the current track window'],
      }
    }

    case 'summer-camp': {
      if (state.stormTicksLeft > 0) {
        return {
          risk: 'warning',
          statusLabel: 'DEGRADED',
          headline: 'Storm on site — emergency shelter armed',
          eta: null,
          narrative: 'The shelter is powered and heated, but field travel is restricted until the front clears.',
          actions: ['No travel — stay on hard surfaces', 'Verify CO and heater at the shelter'],
        }
      }
      return {
        risk: 'ok',
        statusLabel: 'STABLE',
        headline: 'Standby — unoccupied outside summer season',
        eta: null,
        narrative: 'No occupancy. The shelter remains on standby with ready heating and egress packs.',
        actions: ['Log a readiness check for next deployment'],
      }
    }
  }
}

function scienceForecast(state: SimState, id: ModuleId): ModuleForecast {
  const tempSlope = slopeSamples(state.temp.history)
  const coldTone: ForecastRisk =
    state.temp.v <= TEMP_CRIT_LO ? 'critical' : state.temp.v <= TEMP_WARN_LO ? 'warning' : 'ok'

  const ambientHeadline = `Ambient ${state.temp.v.toFixed(1)} °C — ${
    tempSlope > 0.001 ? 'warming' : tempSlope < -0.001 ? 'cooling' : 'holding'
  }`
  const inStorm = state.stormTicksLeft > 0
  const stormNarrative =
    'A blizzard front is over the site pulling temperatures toward the critical band; field work is restricted.'
  const stormActions = ['Hold field data duties indoors']

  switch (id) {
    case 'main':
      return {
        risk: coldTone,
        statusLabel: LABEL[coldTone],
        headline: ambientHeadline,
        eta: null,
        narrative: inStorm
          ? stormNarrative
          : 'Environmental conditions around the station are within the expected wintering envelope.',
        actions: inStorm ? stormActions : ['Continue routine environmental logging'],
      }
    case 'fuel-farm':
    case 'fuel-station':
      return {
        risk: coldTone,
        statusLabel: LABEL[coldTone],
        headline: 'Reserve metering restricted to ops console',
        eta: null,
        narrative: 'Science role sees environmental context only — fuel logistics remain an operations channel.',
        actions: ['Request fuel figures through the ops desk'],
      }
    case 'pump-house':
      return {
        risk: state.seaState > SEA_WARN ? 'warning' : coldTone,
        statusLabel: LABEL[state.seaState > SEA_WARN ? 'warning' : coldTone],
        headline: `Intake flow ${(state.seaState * 100).toFixed(0)}% — ${state.seaState > SEA_WARN ? 'frazil present' : 'open water'}`,
        eta: null,
        narrative: inStorm
          ? `Storm turbulence raises frazil risk at the intake. ${stormNarrative}`
          : 'Sea-water condition around the intake is being tracked for the environmental record.',
        actions: inStorm ? [...stormActions, 'Log intake condition into the seasonal dataset'] : ['Log intake condition into the seasonal dataset'],
      }
    case 'ageos':
      return {
        risk: state.satelliteOnline ? 'ok' : 'warning',
        statusLabel: LABEL[state.satelliteOnline ? 'ok' : 'warning'],
        headline: state.satelliteOnline ? 'Uplink to HQ nominal' : 'Downlink suspended — queuing at edge',
        eta: null,
        narrative: state.satelliteOnline
          ? 'The AGEOS segment is streaming data to NCPOR HQ without backlog.'
          : 'Data is being stored and forwarded until the next satellite window.',
        actions: [state.satelliteOnline ? 'Sync research datasets' : 'Sync research datasets at next pass'],
      }
    case 'summer-camp':
      return {
        risk: inStorm ? 'warning' : 'ok',
        statusLabel: LABEL[inStorm ? 'warning' : 'ok'],
        headline: inStorm ? 'Storm on site — shelter armed' : 'Unoccupied — standby readiness',
        eta: null,
        narrative: inStorm ? 'Travel is restricted while the front passes.' : 'No seasonal occupancy scheduled.',
        actions: [inStorm ? 'No field travel' : 'Standby'],
      }
  }
}