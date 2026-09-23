export type Status = 'ok' | 'warning' | 'critical'

export type Role = 'admin' | 'leader' | 'scientist'

export type RiskLevel = 'NOMINAL' | 'WARNING' | 'CRITICAL'

export interface PredictInput {
  overrides: {
    ambientTemperature: number
    generatorLoad: number
  }
  telemetry: {
    ambientTemperature: number
    generatorLoad: number
    fuelReserve: number
    fuelBurnRatePercentDay: number
    seaWaterIntake: number
    daysRemaining: number
  }
}

export interface Diagnostics {
  risk_level: RiskLevel
  predicted_cascade_effect: string
  estimated_time_to_failure_hours: number
  recommended_action: string
}

export interface PredictResponse {
  provider: 'groq' | 'local-fallback'
  model: string
  latencyMs: number
  generatedAt: number
  inputs: PredictInput
  diagnostics: Diagnostics
}

export type ModuleId =
  | 'main'
  | 'fuel-farm'
  | 'fuel-station'
  | 'pump-house'
  | 'summer-camp'
  | 'ageos'

export interface Sample {
  t: number
  v: number
}

export type Band =
  | { kind: 'ok' }
  | { kind: 'warning' }
  | { kind: 'critical' }

export interface AlertItem {
  id: number
  ts: number
  severity: Status
  source: string
  message: string
  acked?: boolean
}

export interface ModuleState {
  id: ModuleId
  status: Status
  /** short reason shown next to the status chip */
  note: string
}

export interface SimState {
  role: Role
  now: number
  tick: number

  satelliteOnline: boolean
  syncing: boolean
  syncTotal: number
  queuedPackets: number

  generatorFailed: boolean
  recovering: boolean

  temp: { v: number; history: Sample[]; band: Band }
  gen: { v: number; history: Sample[]; band: Band }
  fuel: { v: number; history: Sample[]; band: Band }

  burnRate: number
  daysRemaining: number

  stormTicksLeft: number
  loadSpikeTicks: number
  seaState: number

  modules: Record<ModuleId, ModuleState>
  selected: ModuleId | null

  alerts: AlertItem[]
}

export const MODULE_META: Record<
  ModuleId,
  {
    name: string
    short: string
    blurb: string
    subsystem: string
  }
> = {
  main: {
    name: 'Main Building',
    short: 'MAIN',
    subsystem: 'Power & Habitation',
    blurb:
      'Primary habitation and operations building — life-support, crew quarters, galley and the command centre. Fed by the main generator bus.',
  },
  'fuel-farm': {
    name: 'Fuel Farm',
    short: 'FUEL FARM',
    subsystem: 'Fuel Storage',
    blurb:
      'Bulk storage bladders for the station fuel stock. Treated as the single strategic reserve feeding the power-generating plant.',
  },
  'fuel-station': {
    name: 'Fuel Station',
    short: 'FUEL STN',
    subsystem: 'Fuel Distribution',
    blurb:
      'Transfer and polishing point between the fuel farm, the summer jetty and the generator house. Drums are filled here during resupply.',
  },
  'pump-house': {
    name: 'Sea-water Pump House',
    short: 'SEA-WATER P/H',
    subsystem: 'Cooling & Utilities',
    blurb:
      'Draws sea water from Prydz Bay below the sea-ice for cooling and water production. Intake performance degrades with frazil ice.',
  },
  'summer-camp': {
    name: 'Summer Camp / Emergency Shelter',
    short: 'SUMMER CAMP',
    subsystem: 'Seasonal & Egress',
    blurb:
      'Seasonal tented accommodation plus the year-round emergency shelter. Standby node — currently unoccupied outside summer season.',
  },
  ageos: {
    name: 'AGEOS Ground Station',
    short: 'AGEOS',
    subsystem: 'Satellite Communications',
    blurb:
      'Antarctic Geospace Observatory ground segment — the station’s only link to the outside world. Carries telemetry uplink to NCPOR HQ, Goa.',
  },
}

export const ROLE_META: Record<
  Role,
  { label: string; blurb: string; isOps: boolean; canAck: boolean }
> = {
  admin: {
    label: 'HQ Admin',
    blurb: 'NCPOR HQ, Goa — full operational picture, remote command + alert ack',
    isOps: true,
    canAck: true,
  },
  leader: {
    label: 'Station Leader',
    blurb: 'On-station, wintering crew — operations, fuel and power',
    isOps: true,
    canAck: false,
  },
  scientist: {
    label: 'Scientist',
    blurb: 'Research view — environmental telemetry and station map only',
    isOps: false,
    canAck: false,
  },
}