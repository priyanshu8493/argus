import { AnimatePresence, motion } from 'framer-motion'
import { Check, CircleAlert, TriangleAlert, Zap } from 'lucide-react'
import { useState } from 'react'
import type { Status } from '../types'
import { STATUS_HEX } from './statusTheme'
import { Panel, SimTag } from './Panel'
import { useSim } from '../simulation/useSim'
import { ROLE_META } from '../types'

const SOURCE_ICON: Record<string, typeof Zap> = {
  Ambient: TriangleAlert,
  Power: Zap,
  Fuel: CircleAlert,
}

type Filter = 'all' | Status | 'unack'

export function AlertsFeed() {
  const { state, ackAlert } = useSim()
  const canAck = ROLE_META[state.role].canAck
  const [filter, setFilter] = useState<Filter>('all')

  const unacked = state.alerts.filter((a) => !a.acked).length

  const visible = state.alerts.filter((a) => {
    if (filter === 'all') return true
    if (filter === 'unack') return !a.acked
    return a.severity === filter
  })

  const filters: Filter[] = ['all', 'unack', 'warning', 'critical', 'ok']
  const filterLabels: Record<Filter, string> = {
    all: 'All',
    unack: 'Unack',
    warning: 'Warn',
    critical: 'Crit',
    ok: 'Info',
  }

  return (
    <Panel
      title="Alert feed"
      sub="threshold-driven · newest first"
      right={
        <>
          <span className="hidden items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] text-slate-dim sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-glacial" />
            {unacked} open
          </span>
          <div className="flex items-center border border-line bg-abyss/60">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors ${
                  filter === f ? 'bg-glacial/15 text-glacial' : 'text-slate-dim hover:text-slate-mid'
                }`}
              >
                {filterLabels[f]}
              </button>
            ))}
          </div>
          <SimTag label="Sim stream" />
        </>
      }
    >
      <div className="max-h-[320px] overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {visible.length === 0 ? (
            <div className="flex h-24 flex-col items-center justify-center gap-1.5 border border-dashed border-line-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-ok" />
              <span className="font-sans text-[12px] text-slate-mid">No alerts match — all systems nominal</span>
            </div>
          ) : (
            visible.map((a) => {
              const Icon = SOURCE_ICON[a.source] ?? Zap
              const hex = STATUS_HEX[a.severity]
              return (
                <motion.div
                  key={a.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: a.acked ? 0.38 : 1, y: 0 }}
                  exit={{ opacity: 0, x: 24 }}
                  transition={{ duration: 0.22 }}
                  className="group flex items-center gap-3 border-b border-line-soft py-2 last:border-b-0"
                >
                  <span className="h-6 w-[2px] shrink-0" style={{ background: hex }} />
                  <Icon size={13} style={{ color: hex }} className="shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] tabular-nums text-slate-dim">
                        {new Date(a.ts).toISOString().slice(11, 19)}Z
                      </span>
                      <span
                        className="border px-1 font-mono text-[9px] uppercase tracking-[0.14em]"
                        style={{ color: hex, borderColor: `${hex}44` }}
                      >
                        {a.source}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate font-sans text-[12px] text-ink">{a.message}</p>
                  </div>
                  {canAck &&
                    (a.acked ? (
                      <span className="flex shrink-0 items-center gap-1 font-mono text-[9px] uppercase tracking-[0.12em] text-slate-faint">
                        <Check size={11} /> ack
                      </span>
                    ) : (
                      <button
                        onClick={() => ackAlert(a.id)}
                        className="shrink-0 border border-line px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-slate-mid transition-colors hover:border-glacial/60 hover:bg-glacial/10 hover:text-glacial"
                      >
                        Ack
                      </button>
                    ))}
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>
    </Panel>
  )
}