import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Connect, Plugin } from 'vite'
import {
  FUEL_CRIT,
  FUEL_WARN,
  LOAD_CRIT,
  LOAD_WARN,
  SEA_WARN,
  TEMP_CRIT_LO,
  TEMP_WARN_HI,
  TEMP_WARN_LO,
} from '../src/constants.ts'
import type { Diagnostics, PredictInput, PredictResponse, RiskLevel } from '../src/types.ts'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
// llama3-8b-8192 was decommissioned on Groq — gpt-oss-20b is the current
// open-weight flagship with JSON mode enabled.
export const GROQ_MODEL = 'openai/gpt-oss-20b'
const REQUEST_TIMEOUT_MS = 12000

const TEMP_CRIT_HI = 5

const SYSTEM_PROMPT =
  'You are an automated diagnostic AI for Bharati Station, an Indian Antarctic research station. ' +
  'Analyze the given live telemetry and user overrides, reason about cascading physics effects across ' +
  'power, fuel, thermal and seawater systems, then output STRICTLY a JSON object (no markdown, no code fences) ' +
  'with exactly this schema: ' +
  '{"risk_level": "NOMINAL"|"WARNING"|"CRITICAL", ' +
  '"predicted_cascade_effect": "10-word technical description of the likely cascading failure path", ' +
  '"estimated_time_to_failure_hours": float, ' +
  '"recommended_action": "Precise mitigation command for the operator"}'

/** Current-twins + override payload echoed to the model. */
function buildUserPayload(input: PredictInput): unknown {
  return {
    overrides: input.overrides,
    live_telemetry: input.telemetry,
    operating_thresholds: {
      ambient_celsius: { warning_lo: TEMP_WARN_LO, warning_hi: TEMP_WARN_HI, critical_lo: TEMP_CRIT_LO },
      generator_load_percent: { warning: LOAD_WARN, critical: LOAD_CRIT },
      fuel_reserve_percent: { warning: FUEL_WARN, critical: FUEL_CRIT },
      sea_intake_flow: { warning_above: SEA_WARN },
    },
  }
}

function sanitizeInput(raw: unknown): PredictInput {
  const o = (raw ?? {}) as Record<string, unknown>
  const ov = (o.overrides ?? {}) as Record<string, unknown>
  const te = (o.telemetry ?? {}) as Record<string, unknown>
  const num = (v: unknown, d: number) => {
    const n = typeof v === 'number' && Number.isFinite(v) ? v : Number(v)
    return Number.isFinite(n) ? n : d
  }
  return {
    overrides: {
      ambientTemperature: num(ov.ambientTemperature, -25),
      generatorLoad: num(ov.generatorLoad, 62),
    },
    telemetry: {
      ambientTemperature: num(te.ambientTemperature, 0),
      generatorLoad: num(te.generatorLoad, 62),
      fuelReserve: num(te.fuelReserve, 88.4),
      fuelBurnRatePercentDay: num(te.fuelBurnRatePercentDay, 1.55),
      seaWaterIntake: num(te.seaWaterIntake, 0.4),
      daysRemaining: num(te.daysRemaining, 57),
    },
  }
}

function normalizeDiagnostics(raw: unknown): Diagnostics {
  const r = (raw ?? {}) as Record<string, unknown>
  const risk = String(r.risk_level ?? '').toUpperCase().trim()
  if (!['NOMINAL', 'WARNING', 'CRITICAL'].includes(risk)) throw new Error('Model returned invalid risk_level')
  const eta = typeof r.estimated_time_to_failure_hours === 'number' ? r.estimated_time_to_failure_hours : Number(r.estimated_time_to_failure_hours)
  return {
    risk_level: risk as RiskLevel,
    predicted_cascade_effect:
      typeof r.predicted_cascade_effect === 'string' ? r.predicted_cascade_effect.slice(0, 300) : 'No cascade analysis returned.',
    estimated_time_to_failure_hours: Number.isFinite(eta) ? Math.min(8760, Math.max(0, eta)) : 0,
    recommended_action:
      typeof r.recommended_action === 'string' ? r.recommended_action.slice(0, 300) : 'Refer to station standing orders.',
  }
}

async function runGroq(input: PredictInput, apiKey: string): Promise<Diagnostics> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: JSON.stringify(buildUserPayload(input)) },
        ],
      }),
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`Groq API responded HTTP ${res.status}`)
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
    const content = data.choices?.[0]?.message?.content
    if (!content) throw new Error('Empty Groq model response')
    return normalizeDiagnostics(JSON.parse(content) as unknown)
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Offline heuristic that mirrors the app's own thresholds. Guarantees the
 * predictive lab still works (clearly labelled as local fallback) when no
 * Groq key is configured or the API is unreachable.
 */
function localFallback(input: PredictInput): Diagnostics {
  const { overrides, telemetry } = input
  const temp = overrides.ambientTemperature
  const load = overrides.generatorLoad
  const fuel = telemetry.fuelReserve
  const sea = telemetry.seaWaterIntake

  let level = 0 // 2 = critical, 1 = warning
  const triggers: { name: string; level: number }[] = []
  const note = (name: string, lvl: number) => {
    level = Math.max(level, lvl)
    triggers.push({ name, level: lvl })
  }

  if (temp <= TEMP_CRIT_LO || temp >= TEMP_CRIT_HI) note('ambient', 2)
  else if (temp <= TEMP_WARN_LO || temp >= TEMP_WARN_HI) note('ambient', 1)
  if (load >= LOAD_CRIT) note('bus', 2)
  else if (load >= LOAD_WARN) note('bus', 1)
  if (fuel <= FUEL_CRIT) note('fuel', 2)
  else if (fuel <= FUEL_WARN) note('fuel', 1)
  if (sea >= SEA_WARN) note('intake', 1)

  const risk: RiskLevel = level === 2 ? 'CRITICAL' : level === 1 ? 'WARNING' : 'NOMINAL'

  const cascade: Record<string, string> = {
    ambient:
      'Extreme thermal stress raises heating demand and generator loading; seal and loop failure risk climbs steadily.',
    bus: 'Bus overload raises trip probability; backup burn accelerates; fuel runway shortens across the week.',
    fuel: 'Reserve approaches the resupply floor; power decays to backup reserve; station isolation worsens.',
    intake: 'Frazil ice chokes the intake; cooling flow stalls; generator derates and thermal margin falls.',
  }
  const actions: Record<string, string> = {
    ambient: 'Raise heating set-point 2°C and pre-arm the backup heater bus; monitor main load headroom.',
    bus: 'Immediately shed non-critical loads; stand by for demand-shed drill on the emergency bus.',
    fuel: 'Authorize draw from the jetty buffer and re-route the next resupply; cut discretionary burn.',
    intake: 'Switch to auxiliary intake; schedule a frazil-clearing burn; watch cooling loop temperatures.',
  }

  const dominant = triggers.filter((t) => t.level === level).map((t) => t.name)
  const cascadeText = dominant.length
    ? dominant.map((d) => cascade[d]).join(' ')
    : 'No cascading failure path expected; all station subsystems remain within operating margins.'
  const eta = risk === 'CRITICAL' ? 4.7 : risk === 'WARNING' ? 48 : 720
  const action = dominant.length ? dominant.map((d) => actions[d]).join(' ') : 'Maintain current operating posture; sustain the 2 s telemetry watch.'

  return {
    risk_level: risk,
    predicted_cascade_effect: cascadeText.slice(0, 300),
    estimated_time_to_failure_hours: eta,
    recommended_action: action.slice(0, 300),
  }
}

function readBody(req: IncomingMessage): Promise<string> {
  const vReq = req as IncomingMessage & { body?: unknown; readableEnded?: boolean }
  if (vReq.body !== undefined) {
    return Promise.resolve(
      typeof vReq.body === 'string' ? vReq.body : JSON.stringify(vReq.body),
    )
  }
  if (vReq.readableEnded === true) return Promise.resolve('')
  return new Promise((resolve, reject) => {
    let data = ''
    req.setEncoding('utf8')
    req.on('data', (chunk: string) => {
      data += chunk
      if (data.length > 1_000_000) {
        req.destroy()
        reject(new Error('Payload too large'))
      }
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify(body))
}

export async function handlePredictRoute(req: IncomingMessage, res: ServerResponse, apiKey: string | undefined): Promise<void> {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed — POST telemetry JSON to /api/predict' })
    return
  }
  const started = performance.now()
  let input: PredictInput
  try {
    const raw = await readBody(req)
    input = sanitizeInput(raw ? (JSON.parse(raw) as unknown) : {})
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON body' })
    return
  }

  let diagnostics: Diagnostics
  let provider: PredictResponse['provider'] = 'local-fallback'
  let model = 'heuristic-rule-engine'

  if (apiKey) {
    try {
      diagnostics = await runGroq(input, apiKey)
      provider = 'groq'
      model = GROQ_MODEL
    } catch {
      diagnostics = localFallback(input)
    }
  } else {
    diagnostics = localFallback(input)
  }

  const response: PredictResponse = {
    provider,
    model,
    latencyMs: Math.round(performance.now() - started),
    generatedAt: Date.now(),
    inputs: input,
    diagnostics,
  }
  sendJson(res, 200, response)
}

export interface PredictApiOptions {
  apiKey?: string
}

/**
 * Vercel serverless zero-config handler for POST /api/predict.
 * Vercel auto-detects this default export; set `GROQ_API_KEY` in the project
 * Environment Variables dashboard to enable the live Groq model.
 */
export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  await handlePredictRoute(req, res, process.env.GROQ_API_KEY)
}

/** Vite dev + preview middleware exposing the single POST /api/predict route. */
export function bharatiPredictApi(options: PredictApiOptions = {}): Plugin {
  const apiKey = options.apiKey || process.env.GROQ_API_KEY
  const handle: Connect.HandleFunction = (req: IncomingMessage, res: ServerResponse) => {
    void handlePredictRoute(req, res, apiKey)
  }
  return {
    name: 'bharati-predict-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/predict', handle)
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/predict', handle)
    },
  }
}