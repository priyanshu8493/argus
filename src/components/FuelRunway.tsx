import { motion } from 'framer-motion'
import { RUNWAY_CRIT, RUNWAY_WARN } from '../constants'
import { STATUS_HEX } from './statusTheme'
import { Panel, SimTag } from './Panel'
import { useSim } from '../simulation/useSim'

function toneFor(days: number): { hex: string; label: string } {
  if (days <= RUNWAY_CRIT) return { hex: STATUS_HEX.critical, label: 'CRITICAL' }
  if (days <= RUNWAY_WARN) return { hex: STATUS_HEX.warning, label: 'WARNING' }
  return { hex: STATUS_HEX.ok, label: 'NOMINAL' }
}

export function FuelRunway() {
  const { state } = useSim()
  const days = state.daysRemaining
  const fuel = state.fuel.v
  const burn = state.burnRate
  const tone = toneFor(days)

  return (
    <Panel
      title="Fuel runway"
      sub="simulated estimate"
      right={<SimTag label="Simulated estimate" />}
    >
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-1">
            <motion.span
              key={`${Math.round(days * 10)}-${state.generatorFailed}`}
              initial={{ opacity: 0.4, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-mono text-[44px] font-medium leading-none tracking-tight"
              style={{ color: tone.hex }}
            >
              {days < 10 ? days.toFixed(1) : days.toFixed(0)}
            </motion.span>
            <span className="pb-1 font-mono text-[14px] text-slate-dim">days</span>
          </div>
          <p className="mt-1.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-slate-dim">
            days of fuel @ current burn
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <span
            className="border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em]"
            style={{ color: tone.hex, borderColor: `${tone.hex}55` }}
          >
            {tone.label}
          </span>
          {state.generatorFailed && (
            <span className="border border-amber/60 bg-amber/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-amber">
              backup burn · 2.1×
            </span>
          )}
        </div>
      </div>

      {/* fuel gauge bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between font-mono text-[10px] text-slate-dim">
          <span>RESERVE</span>
          <span className="text-ink">{fuel.toFixed(1)} %</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full border border-line bg-abyss/60">
          <motion.div
            className="h-full"
            animate={{ width: `${fuel}%`, background: tone.hex }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between font-mono text-[10px] text-slate-faint">
          <span>BURN {burn.toFixed(2)} %/DAY</span>
          <span>SIM</span>
        </div>
      </div>
    </Panel>
  )
}