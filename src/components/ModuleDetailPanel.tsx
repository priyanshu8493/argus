import { AnimatePresence, motion } from 'framer-motion'
import { Crosshair, X } from 'lucide-react'
import { MODULE_META, ROLE_META } from '../types'
import type { ModuleId } from '../types'
import { STATUS_HEX, STATUS_LABEL, statusBgClass, statusTextClass } from './statusTheme'
import { Panel, SimTag } from './Panel'
import { useSim } from '../simulation/useSim'
import { getModuleForecast } from '../forecast'
import type { FocusKey } from './three/sceneLayout'

const SCOPED_SOURCE: Record<ModuleId, string[]> = {
  main: ['Power'],
  'fuel-farm': ['Fuel'],
  'fuel-station': ['Fuel'],
  'pump-house': ['Ambient', 'Power'],
  'summer-camp': ['Ambient'],
  ageos: ['AGEOS', 'Twin'],
}

export function MetricRow({
  label,
  value,
  tone = 'default',
  sub,
}: {
  label: string
  value: string
  tone?: 'default' | 'ok' | 'warning' | 'critical' | 'glacial'
  sub?: string
}) {
  const toneClass =
    tone === 'ok'
      ? 'text-ok'
      : tone === 'warning'
        ? 'text-amber'
        : tone === 'critical'
          ? 'text-crit'
          : tone === 'glacial'
            ? 'text-glacial'
            : 'text-ink'
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-line-soft py-2 first:border-t-0">
      <span className="font-sans text-[12px] text-slate-mid">{label}</span>
      <span className="flex items-baseline gap-2 text-right">
        {sub && <span className="font-mono text-[10px] text-slate-dim">{sub}</span>}
        <span className={`font-mono text-[15px] font-medium ${toneClass}`}>{value}</span>
      </span>
    </div>
  )
}

export function ModuleDetailPanel({ onFly }: { onFly: (key: FocusKey) => void }) {
  const { state } = useSim()

  if (!state.selected) {
    return (
      <Panel as="div">
        <div className="flex min-h-24 flex-col items-center justify-center gap-2 border border-dashed border-line-soft px-4 text-center">
          <span className="font-sans text-[12px] text-slate-dim">
            Select a module — click it in the twin, the rail, or a view preset
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-faint">
            keys 1-6 jump to a subsystem
          </span>
        </div>
      </Panel>
    )
  }

  const id = state.selected
  const mod = state.modules[id]
  const meta = MODULE_META[id]
  const hex = STATUS_HEX[mod.status]
  const offline = !state.satelliteOnline
  const isOps = ROLE_META[state.role].isOps
  const forecast = getModuleForecast(state, state.role, id)
  const fcHex = STATUS_HEX[forecast.risk]

  const scopedAlerts = state.alerts
    .filter((a) => SCOPED_SOURCE[id].includes(a.source))
    .slice(0, 3)

  const fuelPct = state.fuel.v
  const burn = state.burnRate

  const ambientRow = (
    <MetricRow
      label="Ambient"
      value={`${state.temp.v.toFixed(1)} °C`}
      tone={statusTone(state.temp.band.kind)}
    />
  )
  const seaRows = (
    <>
      <MetricRow
        label="Seawater intake"
        value={`${(state.seaState * 100).toFixed(0)} %`}
        tone={state.seaState > 0.72 ? 'warning' : 'ok'}
        sub="flow nominal"
      />
      <MetricRow label="Sea condition" value={state.seaState > 0.72 ? 'FRAZIL ICE' : 'OPEN WATER'} tone={state.seaState > 0.72 ? 'warning' : 'ok'} />
    </>
  )

  const rows = isOps
    ? (() => {
        switch (id) {
          case 'main':
            return (
              <>
                <MetricRow
                  label="Generator load"
                  value={`${state.generatorFailed ? 0 : state.gen.v.toFixed(0)} %`}
                  tone={state.generatorFailed ? 'ok' : statusTone(state.gen.band.kind)}
                  sub={state.generatorFailed ? 'backup bus' : 'nominal bus'}
                />
                {ambientRow}
                <MetricRow
                  label="Power state"
                  value={state.generatorFailed ? 'BACKUP' : 'RUNNING'}
                  tone={state.generatorFailed ? 'warning' : 'ok'}
                />
              </>
            )
          case 'fuel-farm':
          case 'fuel-station':
            return (
              <>
                <MetricRow
                  label="Fuel reserve"
                  value={`${fuelPct.toFixed(1)} %`}
                  tone={statusTone(state.fuel.band.kind)}
                />
                <MetricRow
                  label="Burn draw"
                  value={`${burn.toFixed(2)} %/day`}
                  tone={state.generatorFailed ? 'warning' : 'default'}
                  sub={state.generatorFailed ? 'backup 2.1×' : 'nominal'}
                />
                <MetricRow
                  label="Runway"
                  value={`${state.daysRemaining.toFixed(1)} d`}
                  tone={runwayTone(state.daysRemaining)}
                />
              </>
            )
          case 'pump-house':
            return (
              <>
                {seaRows}
                {ambientRow}
              </>
            )
          case 'summer-camp':
            return (
              <>
                <MetricRow label="Occupancy" value="UNOCCUPIED" tone="default" sub="seasonal standby" />
                {ambientRow}
                <MetricRow label="Shelter access" value="READY" tone="ok" />
              </>
            )
          case 'ageos':
            return (
              <>
                <MetricRow
                  label="Uplink"
                  value={state.satelliteOnline ? 'ONLINE' : 'SUSPENDED'}
                  tone={state.satelliteOnline ? 'ok' : 'warning'}
                />
                <MetricRow
                  label="Queued packets"
                  value={`${state.queuedPackets}`}
                  tone={state.satelliteOnline ? 'default' : 'warning'}
                  sub={offline ? 'store & forward' : 'synced'}
                />
                <MetricRow
                  label="Bit error rate"
                  value={state.satelliteOnline ? '0.00 e-3' : '—'}
                  tone={state.satelliteOnline ? 'ok' : 'default'}
                />
              </>
            )
        }
      })()
    : (() => {
        switch (id) {
          case 'main':
            return <>{ambientRow}</>
          case 'fuel-farm':
          case 'fuel-station':
            return (
              <>
                <MetricRow label="Reserve metering" value="RESTRICTED" tone="default" sub="science role" />
                {ambientRow}
              </>
            )
          case 'pump-house':
            return (
              <>
                {seaRows}
                {ambientRow}
              </>
            )
          case 'summer-camp':
            return (
              <>
                <MetricRow label="Occupancy" value="UNOCCUPIED" tone="default" sub="seasonal standby" />
                {ambientRow}
              </>
            )
          case 'ageos':
            return (
              <>
                <MetricRow
                  label="Uplink"
                  value={state.satelliteOnline ? 'ONLINE' : 'SUSPENDED'}
                  tone={state.satelliteOnline ? 'ok' : 'warning'}
                />
                <MetricRow
                  label="Queued packets"
                  value={`${state.queuedPackets}`}
                  tone={state.satelliteOnline ? 'default' : 'warning'}
                  sub={offline ? 'store & forward' : 'synced'}
                />
              </>
            )
        }
      })()

  return (
    <Panel as="div">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-sans text-[15px] font-semibold text-ink">{meta.name}</span>
            <SimTag label="Simulated" />
          </div>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-dim">
            {meta.subsystem}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => onFly(id)}
            title="Re-centre the twin on this module"
            className="border border-line px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-slate-dim transition-colors hover:border-glacial/60 hover:bg-glacial/10 hover:text-glacial"
          >
            <Crosshair size={11} className="inline" /> Recentre
          </button>
          <button
            type="button"
            onClick={() => onFly('site')}
            title="Deselect and view the whole site"
            className="flex h-[26px] w-[26px] items-center justify-center border border-line text-slate-dim transition-colors hover:border-glacial/60 hover:text-glacial"
          >
            <X size={12} />
          </button>
          <span
            className={`inline-flex items-center gap-1.5 border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${statusBgClass[mod.status]} ${statusTextClass[mod.status]}`}
            style={{ borderColor: `${hex}55` }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: hex }} />
            {STATUS_LABEL[mod.status]}
          </span>
        </div>
      </div>

      <p className="mt-3 border-l-2 pl-3 font-sans text-[12.5px] leading-relaxed text-slate-mid" style={{ borderColor: `${hex}66` }}>
        {meta.blurb}
      </p>

      <motion.div
        key={id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mt-3"
      >
        {/* Twin prediction */}
        <div className="mt-2 border" style={{ borderColor: `${fcHex}55`, background: `${fcHex}0a` }}>
          <div className="flex items-center justify-between gap-3 border-b px-3 py-2" style={{ borderColor: `${fcHex}2e` }}>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-dim">
              Twin forecast · live
            </span>
            <span className="font-mono text-[11px] font-semibold tracking-[0.18em]" style={{ color: fcHex }}>
              {forecast.statusLabel}
            </span>
          </div>
          <div className="px-3 py-2.5">
            <p className="font-sans text-[13px] font-medium leading-snug text-ink">{forecast.headline}</p>
            {forecast.eta && (
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: fcHex }}>
                eta {forecast.eta}
              </p>
            )}
            <p className="mt-1.5 font-sans text-[12px] leading-relaxed text-slate-mid">{forecast.narrative}</p>
            <div className="mt-2.5 flex flex-col gap-1.5">
              {forecast.actions.map((a) => (
                <div key={a} className="flex items-start gap-2">
                  <span className="mt-[3px] h-1 w-3 shrink-0" style={{ background: fcHex }} />
                  <span className="font-mono text-[10.5px] leading-snug text-slate-mid">{a}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-2">{[rows]} </div>
      </motion.div>

      {/* Scoped alerts */}
      <div className="mt-3 border-t border-line-soft pt-2">
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-faint">Scoped stream</p>
        <AnimatePresence initial={false}>
          {scopedAlerts.length === 0 ? (
            <p className="py-1.5 font-mono text-[10px] text-slate-dim">no alerts for this subsystem · all clear</p>
          ) : (
            scopedAlerts.map((a) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: a.acked ? 0.5 : 1, x: 0 }}
                className="flex items-center gap-2 py-1"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: STATUS_HEX[a.severity] }} />
                <span className="truncate font-sans text-[11px] text-slate-mid">{a.message}</span>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <p className="mt-2 font-mono text-[10px] leading-relaxed text-slate-faint">
        {mod.note} · Refresh 2 s · Simulated
      </p>
    </Panel>
  )
}

function statusTone(status: 'critical' | 'warning' | 'ok'): 'critical' | 'warning' | 'ok' {
  return status
}

function runwayTone(days: number): 'ok' | 'warning' | 'critical' {
  if (days <= 12) return 'critical'
  if (days <= 25) return 'warning'
  return 'ok'
}