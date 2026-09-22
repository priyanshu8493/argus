import type { ReactNode } from 'react'
import type { Sample, Status } from '../types'
import { STATUS_HEX, statusLabelShort, statusTextClass } from './statusTheme'
import { TelemetryChart, type ThresholdMarker } from './TelemetryChart'
import { SimTag } from './Panel'

export function TelemetryCard({
  icon,
  title,
  sub,
  value,
  unit,
  status,
  color,
  history,
  domain,
  markers,
  live = false,
  height = 92,
  right,
}: {
  icon?: ReactNode
  title: string
  sub: string
  value: string
  unit: string
  status: Status
  color: string
  history: Sample[]
  domain: [number, number]
  markers?: ThresholdMarker[]
  live?: boolean
  height?: number
  right?: ReactNode
}) {
  const hex = STATUS_HEX[status]
  return (
    <section className="border border-line bg-panel/70">
      <header className="flex h-9 items-center justify-between gap-2 border-b border-line-soft px-3.5">
        <div className="flex min-w-0 items-center gap-2">
          {icon}
          <h3 className="truncate font-sans text-[13px] font-medium text-ink">{title}</h3>
          {live && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ok" />}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {right ?? <SimTag label="Sim" />}
          <span
            className={`px-1.5 font-mono text-[9px] uppercase tracking-[0.14em] ${statusTextClass[status]}`}
          >
            {statusLabelShort[status]}
          </span>
        </div>
      </header>
      <div className="flex items-baseline gap-1.5 px-3.5 pt-3">
        <span className="font-mono text-[30px] font-medium leading-none tabular-nums" style={{ color: status === 'ok' ? '#e6f0f7' : hex }}>
          {value}
        </span>
        <span className="font-mono text-[12px] text-slate-dim">{unit}</span>
      </div>
      <p className="px-3.5 pt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-slate-faint">{sub}</p>
      <TelemetryChart data={history} color={color} domain={domain} markers={markers} height={height} />
    </section>
  )
}