import { motion } from 'framer-motion'
import { AlertTriangle, PowerOff, RotateCcw } from 'lucide-react'
import { Panel, SimTag } from './Panel'
import { useSim } from '../simulation/useSim'

export function WhatIfPanel() {
  const { state, triggerGenFailure, resetNominal } = useSim()
  const failed = state.generatorFailed

  return (
    <Panel
      title={failed ? 'Backup power engaged' : 'What-if scenario lab'}
      sub="destructive drill · simulated"
      right={<SimTag label="sandbox" />}
    >
      {failed ? (
        <motion.div
          key="backup"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-amber/50 bg-amber/5 p-3"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber" />
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-amber">
              generator tripped · load 0 %
            </span>
          </div>
          <p className="mt-2 font-sans text-[12px] leading-relaxed text-slate-mid">
            Main Building is on the emergency bus. Burn rate is elevated to
            backup draw — the fuel-runway figure has contracted and may fall
            below the resupply window.
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-[10px]">
            <div className="border border-line bg-abyss/50 p-2">
              <p className="text-slate-faint">BURN</p>
              <p className="mt-0.5 text-[13px] text-amber">{state.burnRate.toFixed(2)}%/d</p>
            </div>
            <div className="border border-line bg-abyss/50 p-2">
              <p className="text-slate-faint">RUNWAY</p>
              <p className="mt-0.5 text-[13px] text-crit">{state.daysRemaining.toFixed(1)}d</p>
            </div>
            <div className="border border-line bg-abyss/50 p-2">
              <p className="text-slate-faint">BUS</p>
              <p className="mt-0.5 text-[13px] text-amber">BACKUP</p>
            </div>
          </div>
          <button
            onClick={resetNominal}
            className="mt-3 flex w-full items-center justify-center gap-2 border border-ok/50 bg-ok/10 px-3 py-2 font-sans text-[12px] font-medium text-ok transition-colors hover:bg-ok/20"
          >
            <RotateCcw size={13} />
            Reset to nominal
          </button>
        </motion.div>
      ) : (
        <motion.div key="nominal" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-3 grid grid-cols-3 gap-2 font-mono text-[10px]">
            <div className="border border-line bg-abyss/50 p-2">
              <p className="text-slate-faint">BURN</p>
              <p className="mt-0.5 text-[13px] text-ink">{state.burnRate.toFixed(2)}%/d</p>
            </div>
            <div className="border border-line bg-abyss/50 p-2">
              <p className="text-slate-faint">RUNWAY</p>
              <p className="mt-0.5 text-[13px] text-ok">{state.daysRemaining.toFixed(1)}d</p>
            </div>
            <div className="border border-line bg-abyss/50 p-2">
              <p className="text-slate-faint">BUS</p>
              <p className="mt-0.5 text-[13px] text-ok">NOMINAL</p>
            </div>
          </div>
          <p className="mb-3 font-sans text-[12px] leading-relaxed text-slate-mid">
            Run a destructive drill against the live simulation: trip the main
            generator and watch the twin re-baseline power, burn rate and module
            status in real time.
          </p>
          <button
            onClick={triggerGenFailure}
            className="flex w-full items-center justify-center gap-2 border border-crit/50 bg-crit/5 px-3 py-2 font-sans text-[12px] font-medium text-crit transition-colors hover:bg-crit/15"
          >
            <PowerOff size={13} />
            Simulate generator failure
          </button>
        </motion.div>
      )}
    </Panel>
  )
}