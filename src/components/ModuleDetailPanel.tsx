import { motion } from 'framer-motion'
import { MODULE_META } from '../types'
import { STATUS_HEX, STATUS_LABEL, statusBgClass, statusTextClass } from './statusTheme'
import { Panel, SimTag } from './Panel'
import { useSim } from '../simulation/useSim'

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

export function ModuleDetailPanel() {
  const { state } = useSim()

  if (!state.selected) {
    return (
      <Panel as="div">
        <div className="flex h-28 flex-col items-center justify-center gap-2 border border-dashed border-line-soft">
          <span className="font-sans text-[12px] text-slate-dim">
            Select a module on the map to inspect its live state
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-faint">
            digital twin · live binding
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

  const fuelPct = state.fuel.v
  const burn = state.burnRate

  const rows = (() => {
    switch (id) {
      case 'main':
        return (
          <>
            <MetricRow
              label="Generator load"
              value={`${state.gen.v.toFixed(0)} %`}
              tone={state.generatorFailed ? 'ok' : statusTone(state.gen.band.kind)}
              sub={state.generatorFailed ? 'backup bus' : 'nominal bus'}
            />
            <MetricRow
              label="Ambient"
              value={`${state.temp.v.toFixed(1)} °C`}
              tone={statusTone(state.temp.band.kind)}
            />
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
            <MetricRow
              label="Seawater intake"
              value={`${(state.seaState * 100).toFixed(0)} %`}
              tone={state.seaState > 0.72 ? 'warning' : 'ok'}
              sub="flow nominal"
            />
            <MetricRow label="Sea condition" value={state.seaState > 0.72 ? 'FRAZIL ICE' : 'OPEN WATER'} tone={state.seaState > 0.72 ? 'warning' : 'ok'} />
            <MetricRow label="Ambient" value={`${state.temp.v.toFixed(1)} °C`} tone={statusTone(state.temp.band.kind)} />
          </>
        )
      case 'summer-camp':
        return (
          <>
            <MetricRow label="Occupancy" value="UNOCCUPIED" tone="default" sub="seasonal standby" />
            <MetricRow label="Ambient" value={`${state.temp.v.toFixed(1)} °C`} tone={statusTone(state.temp.band.kind)} />
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

  return (
    <Panel as="div">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-sans text-[15px] font-semibold text-ink">{meta.name}</span>
            <SimTag label="live binding" />
          </div>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-dim">
            {meta.subsystem}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${statusBgClass[mod.status]} ${statusTextClass[mod.status]}`}
          style={{ borderColor: `${hex}55` }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: hex }} />
          {STATUS_LABEL[mod.status]}
        </span>
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
        {rows}
      </motion.div>

      <p className="mt-3 font-mono text-[10px] leading-relaxed text-slate-faint">
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