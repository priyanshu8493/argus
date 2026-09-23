import { motion } from 'framer-motion'
import { BrainCircuit, Play, RefreshCw, AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import { LOAD_CRIT, LOAD_WARN, TEMP_CRIT_LO, TEMP_WARN_HI, TEMP_WARN_LO } from '../constants'
import type { PredictInput, PredictResponse, RiskLevel } from '../types'
import { STATUS_HEX } from './statusTheme'
import { Panel, SimTag } from './Panel'
import { RangeSlider } from './RangeSlider'
import { useSim } from '../simulation/useSim'

const TEMP_CRIT_HI = 5

const RISK_TO_STATUS: Record<RiskLevel, keyof typeof STATUS_HEX> = {
  NOMINAL: 'ok',
  WARNING: 'warning',
  CRITICAL: 'critical',
}

function tempAccent(v: number): string {
  if (v <= TEMP_CRIT_LO || v >= TEMP_CRIT_HI) return STATUS_HEX.critical
  if (v <= TEMP_WARN_LO || v >= TEMP_WARN_HI) return STATUS_HEX.warning
  return STATUS_HEX.ok
}

function loadAccent(v: number): string {
  if (v >= LOAD_CRIT) return STATUS_HEX.critical
  if (v >= LOAD_WARN) return STATUS_HEX.warning
  return STATUS_HEX.ok
}

function fmtEta(h: number): string {
  if (h >= 24) return `${(h / 24).toFixed(h >= 240 ? 0 : 1)} d`
  return `${h.toFixed(1)} h`
}

function utc(ts: number): string {
  return new Date(ts).toISOString().slice(11, 19)
}

function BaselineRow({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-line-soft py-1.5 last:border-b-0">
      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate-dim">{label}</span>
      <span className="flex items-baseline gap-1">
        <span className="font-mono text-[13px] tabular-nums text-ink">{value}</span>
        <span className="font-mono text-[9px] text-slate-faint">{unit}</span>
      </span>
    </div>
  )
}

export function AIPredictiveLab() {
  const { state } = useSim()
  const [tempOv, setTempOv] = useState(() => Math.round(state.temp.v * 2) / 2)
  const [loadOv, setLoadOv] = useState(() => Math.round(state.gen.v))
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<PredictResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const resyncLive = () => {
    setTempOv(Math.round(state.temp.v * 2) / 2)
    setLoadOv(Math.round(state.gen.v))
  }

  const execute = async () => {
    setPending(true)
    setError(null)
    const input: PredictInput = {
      overrides: { ambientTemperature: tempOv, generatorLoad: loadOv },
      telemetry: {
        ambientTemperature: state.temp.v,
        generatorLoad: state.gen.v,
        fuelReserve: state.fuel.v,
        fuelBurnRatePercentDay: state.burnRate,
        seaWaterIntake: state.seaState,
        daysRemaining: state.daysRemaining,
      },
    }
    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      })
      const data = (await res.json()) as PredictResponse & { error?: string }
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Diagnostic request failed')
      setResult(null)
    } finally {
      setPending(false)
    }
  }

  const risk = result?.diagnostics.risk_level
  const theme = {
    hex: STATUS_HEX[RISK_TO_STATUS[risk ?? 'NOMINAL']],
    bg: 'transparent',
  }

  return (
    <Panel
      title="AI Predictive Lab"
      sub="agentic forecasting · overrides → cascade prognosis"
      right={
        <>
          {result && (
            <span
              className="border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em]"
              style={{ color: theme.hex, borderColor: `${theme.hex}55` }}
            >
              {result.provider === 'groq' ? 'Groq live' : 'local fallback'}
            </span>
          )}
          <SimTag label="Groq AI · gpt-oss-20b" />
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-12">
        {/* Live baseline */}
        <div className="md:col-span-3">
          <h4 className="border-b border-line pb-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-slate-faint">
            Live system state
          </h4>
          <div className="mt-2">
            <BaselineRow label="Ambient" value={state.temp.v.toFixed(1)} unit="°C" />
            <BaselineRow label="Gen load" value={state.generatorFailed ? '0' : state.gen.v.toFixed(0)} unit="%" />
            <BaselineRow label="Fuel reserve" value={state.fuel.v.toFixed(1)} unit="%" />
            <BaselineRow label="Burn rate" value={state.burnRate.toFixed(2)} unit="%/d" />
            <BaselineRow label="Sea intake" value={(state.seaState * 100).toFixed(0)} unit="%" />
            <BaselineRow label="Runway" value={state.daysRemaining.toFixed(1)} unit="d" />
          </div>
        </div>

        {/* Overrides */}
        <div className="flex flex-col gap-3 md:col-span-5">
          <div className="flex items-center justify-between gap-2 border-b border-line pb-1.5">
            <h4 className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-faint">Override inputs</h4>
            <button
              onClick={resyncLive}
              className="flex items-center gap-1.5 border border-line px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-slate-dim transition-colors hover:border-glacial/60 hover:text-glacial"
            >
              <RefreshCw size={10} />
              Resync live
            </button>
          </div>
          <RangeSlider
            label="Ambient temperature"
            unit="°C"
            min={-60}
            max={10}
            step={0.5}
            value={tempOv}
            accentFor={tempAccent}
            onChange={setTempOv}
          />
          <RangeSlider
            label="Generator load"
            unit="%"
            min={0}
            max={100}
            step={1}
            value={loadOv}
            accentFor={loadAccent}
            onChange={setLoadOv}
          />
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate-faint">
            overrides are fed to the model only — the live twin keeps simulating
          </p>
        </div>

        {/* Execute */}
        <div className="flex flex-col md:col-span-4">
          <h4 className="border-b border-line pb-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-slate-faint">
            Agentic diagnostic
          </h4>
          <p className="mt-2 font-sans text-[12px] leading-relaxed text-slate-mid">
            Push the twin past its thresholds and let the model reason over the
            power / fuel / thermal / seawater cascade before a human sees it.
          </p>
          <button
            onClick={execute}
            disabled={pending}
            className="mt-3 flex w-full items-center justify-center gap-2 border border-glacial/50 bg-glacial/10 px-3 py-2.5 font-sans text-[12px] font-semibold text-glacial transition-colors hover:bg-glacial/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? (
              <>
                <motion.span
                  className="h-2 w-2 bg-glacial"
                  animate={{ opacity: [1, 0.25, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
                <span className="font-mono text-[11px] uppercase tracking-[0.12em]">Running</span>
              </>
            ) : (
              <>
                <Play size={13} />
                Execute AI diagnostics
              </>
            )}
          </button>
          {error && (
            <div className="mt-3 flex items-center gap-2 border border-crit/50 bg-crit/5 px-2.5 py-2">
              <AlertTriangle size={12} className="shrink-0 text-crit" />
              <p className="font-mono text-[10px] text-crit">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Result banner */}
      {result && risk && (
        <motion.div
          key={result.generatedAt}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 border"
          style={{ borderColor: `${theme.hex}66`, background: `${theme.hex}0a` }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: `${theme.hex}33` }}>
            <div className="flex items-center gap-2.5">
              {risk === 'CRITICAL' ? (
                <motion.span
                  className="h-2.5 w-2.5 bg-crit"
                  animate={{ opacity: [1, 0.2, 1] }}
                  transition={{ duration: 0.55, repeat: Infinity }}
                />
              ) : (
                <span className="h-2.5 w-2.5" style={{ background: theme.hex }} />
              )}
              <span className="font-mono text-[26px] font-semibold leading-none tracking-tight" style={{ color: theme.hex }}>
                {risk}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-dim">risk level</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[9px] uppercase tracking-[0.14em] text-slate-dim">
              <span>
                provider <span className="text-slate-mid">{result.provider}</span>
              </span>
              <span>
                model <span className="text-slate-mid">{result.model}</span>
              </span>
              <span>
                latency <span className="text-slate-mid">{result.latencyMs}ms</span>
              </span>
              <span>
                run <span className="text-slate-mid">{utc(result.generatedAt)}z</span>
              </span>
            </div>
          </div>

          <div className="grid gap-px bg-line md:grid-cols-3">
            <div className="bg-abyss/40 p-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-faint">Predicted cascade effect</p>
              <p className="mt-1.5 font-sans text-[12.5px] leading-relaxed text-ink">
                {result.diagnostics.predicted_cascade_effect}
              </p>
            </div>
            <div className="bg-abyss/40 p-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-faint">Est. time to failure</p>
              <p className="mt-1.5 flex items-baseline gap-2 font-mono text-[22px] leading-none tabular-nums" style={{ color: theme.hex }}>
                {fmtEta(result.diagnostics.estimated_time_to_failure_hours)}
                <span className="text-[10px] text-slate-faint">
                  {result.diagnostics.estimated_time_to_failure_hours.toFixed(1)} h
                </span>
              </p>
            </div>
            <div className="bg-abyss/40 p-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-faint">Recommended action</p>
              <p className="mt-1.5 font-mono text-[11.5px] leading-relaxed text-glacial">
                {result.diagnostics.recommended_action}
              </p>
            </div>
          </div>

          <div className="border-t px-4 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-slate-faint" style={{ borderColor: `${theme.hex}22` }}>
            state fed → amb {state.temp.v.toFixed(1)}°c · load {state.generatorFailed ? 0 : state.gen.v.toFixed(0)}% · fuel{' '}
            {state.fuel.v.toFixed(1)}% · overrides → amb {tempOv.toFixed(1)}°c / load {loadOv.toFixed(0)}% · prognosis
            is simulated
          </div>
        </motion.div>
      )}

      {!result && !error && (
        <div className="mt-4 flex h-14 items-center gap-3 border border-dashed border-line-soft px-3.5">
          <BrainCircuit size={14} className="text-slate-faint" />
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-faint">
            Awaiting diagnostic — set overrides and execute
          </p>
        </div>
      )}
    </Panel>
  )
}