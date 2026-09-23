import { MODULE_META, ROLE_META } from '../types'
import type { ModuleId } from '../types'
import { useSim } from '../simulation/useSim'
import { STATUS_HEX } from './statusTheme'
import type { FocusKey } from './three/sceneLayout'

const ORDER: ModuleId[] = ['main', 'fuel-farm', 'fuel-station', 'pump-house', 'summer-camp', 'ageos']

const VIEWS: { key: FocusKey; label: string }[] = [
  { key: 'site', label: 'Site' },
  { key: 'main', label: 'Main' },
  { key: 'fuel-farm', label: 'Fuel Farm' },
  { key: 'ageos', label: 'AGEOS' },
  { key: 'jetty', label: 'Port' },
  { key: 'summer-camp', label: 'Camp' },
]

export function ModuleRail({
  selected,
  onPick,
}: {
  selected: ModuleId | null
  onPick: (id: ModuleId) => void
}) {
  const { state } = useSim()
  return (
    <div className="absolute left-2 top-2 z-10 w-[178px] select-none border border-line bg-abyss/85 p-1.5 backdrop-blur-sm">
      <p className="border-b border-line-soft pb-1 font-mono text-[8px] uppercase tracking-[0.2em] text-slate-faint">
        Modules · click to dive
      </p>
      <div className="mt-1 flex flex-col gap-0.5">
        {ORDER.map((id) => {
          const m = state.modules[id]
          const hex = STATUS_HEX[m.status]
          const active = selected === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onPick(id)}
              className="flex items-center gap-2 px-1.5 py-1 text-left transition-colors"
              style={{
                background: active ? `${hex}14` : 'transparent',
                borderLeft: `2px solid ${active ? hex : 'transparent'}`,
              }}
            >
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: hex, boxShadow: `0 0 5px ${hex}`, opacity: m.status === 'critical' ? undefined : 0.9 }}
              />
              <span className="min-w-0 flex-1 truncate font-mono text-[10px] tracking-[0.08em]" style={{ color: active ? '#eaf3f9' : '#9fb8cc' }}>
                {MODULE_META[id].short}
              </span>
              <span className="font-mono text-[8px] uppercase tracking-[0.12em]" style={{ color: hex }}>
                {m.status === 'ok' ? 'OK' : m.status === 'warning' ? 'WRN' : 'CRT'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Readout({ label, value, unit, hex }: { label: string; value: string; unit?: string; hex: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-line-soft/70 py-1 last:border-b-0">
      <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-slate-dim">{label}</span>
      <span className="font-mono text-[13px] leading-none tabular-nums" style={{ color: hex }}>
        {value}
        {unit && <span className="pl-0.5 text-[8px] text-slate-faint">{unit}</span>}
      </span>
    </div>
  )
}

export function LiveHud() {
  const { state } = useSim()
  const isOps = ROLE_META[state.role].isOps
  const temps: { label: string; value: string; unit: string; hex: string }[] = []
  temps.push({
    label: 'Ambient',
    value: state.temp.v.toFixed(1),
    unit: '°C',
    hex: STATUS_HEX[state.temp.band.kind],
  })
  if (isOps) {
    const genHex = state.generatorFailed ? STATUS_HEX.critical : STATUS_HEX[state.gen.band.kind]
    temps.push({
      label: 'Generator',
      value: state.generatorFailed ? '0' : state.gen.v.toFixed(0),
      unit: '%',
      hex: genHex,
    })
    temps.push({ label: 'Fuel', value: state.fuel.v.toFixed(1), unit: '%', hex: STATUS_HEX[state.fuel.band.kind] })
  }
  temps.push({
    label: 'Sea intake',
    value: (state.seaState * 100).toFixed(0),
    unit: '%',
    hex: state.seaState >= 0.8 ? STATUS_HEX.ok : STATUS_HEX.warning,
  })

  const counts = { ok: 0, warning: 0, critical: 0 }
  for (const m of Object.values(state.modules)) counts[m.status] += 1
  const worst: 'ok' | 'warning' | 'critical' =
    counts.critical > 0 ? 'critical' : counts.warning > 0 ? 'warning' : 'ok'

  return (
    <div className="absolute right-2 top-2 z-10 w-[190px] select-none border border-line bg-abyss/85 p-2 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-line-soft pb-1">
        <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-slate-faint">Telemetry</span>
        <span className="font-mono text-[8px] uppercase tracking-[0.16em]" style={{ color: STATUS_HEX[worst] }}>
          sys {worst === 'ok' ? 'nominal' : worst}
        </span>
      </div>
      <div className="mt-1">
        {temps.map((t) => (
          <Readout key={t.label} {...t} />
        ))}
      </div>
      <div className="mt-1.5 flex items-center justify-between border-t border-line-soft pt-1.5">
        <span className="font-mono text-[8px] uppercase tracking-[0.16em]" style={{ color: state.satelliteOnline ? '#4ade80' : '#f5a623' }}>
          sat {state.satelliteOnline ? (state.syncing ? 'sync' : 'link') : 'offline'}
        </span>
        <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-slate-faint">
          {state.stormTicksLeft > 0 ? 'wx storm' : 'wx calm'}
        </span>
      </div>
      <p className="mt-1.5 border-t border-line-soft pt-1 font-mono text-[7px] uppercase tracking-[0.14em] text-slate-faint">
        S69.40 · E76.19 · Prydz Bay
      </p>
    </div>
  )
}

export function ViewBar({
  view,
  onView,
  onToggle,
}: {
  view: '3d' | 'plan'
  onView: (key: FocusKey) => void
  onToggle: (view: '3d' | 'plan') => void
}) {
  const is3d = view === '3d'
  return (
    <div className="absolute bottom-2 left-1/2 z-10 flex max-w-[92%] -translate-x-1/2 flex-wrap items-center justify-center gap-1 border border-line bg-abyss/85 px-1.5 py-1 backdrop-blur-sm">
      {VIEWS.map((v) => (
        <button
          key={v.key}
          type="button"
          onClick={() => onView(v.key)}
          className="border border-transparent px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-slate-dim transition-colors hover:border-glacial/50 hover:text-ink"
          title={`Fly to ${v.label}`}
        >
          {v.label}
        </button>
      ))}
      <span className="mx-1 h-3 w-px bg-line-soft" />
      <button
        type="button"
        onClick={() => onToggle(is3d ? 'plan' : '3d')}
        className="px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-glacial transition-colors hover:bg-glacial/10"
      >
        {is3d ? 'Plan sheet' : 'Twin 3D'}
      </button>
    </div>
  )
}

export function AlertTicker() {
  const { state } = useSim()
  const recent = state.alerts.slice(0, 2)
  if (recent.length === 0) return null
  return (
    <div className="pointer-events-none absolute bottom-2 left-2 z-10 flex max-w-[280px] flex-col gap-1">
      {recent.map((a) => (
        <div key={a.id} className="flex items-start gap-2 border border-line bg-abyss/85 px-2 py-1 backdrop-blur-sm">
          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: STATUS_HEX[a.severity] }} />
          <p className="font-mono text-[9px] leading-snug text-slate-mid">
            <span className="text-slate-faint">[{a.source}]</span> {a.message}
          </p>
        </div>
      ))}
    </div>
  )
}