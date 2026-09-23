import { motion } from 'framer-motion'
import { Droplets, Activity } from 'lucide-react'
import { useEffect, useState } from 'react'
import { SEA_WARN, TEMP_WARN_HI, TEMP_WARN_LO } from './constants'
import { AIPredictiveLab } from './components/AIPredictiveLab'
import { AlertsFeed } from './components/AlertsFeed'
import { FuelRunway } from './components/FuelRunway'
import { Header } from './components/Header'
import { ModuleDetailPanel } from './components/ModuleDetailPanel'
import { Panel, SimTag } from './components/Panel'
import { WhatIfPanel } from './components/WhatIfPanel'
import { MapView } from './components/MapView'
import type { FocusKey } from './components/three/sceneLayout'
import { MODULE_ID_SET } from './types'
import { TelemetryCard } from './components/TelemetryCard'
import { ROLE_META } from './types'
import { SimProvider } from './simulation/SimProvider'
import { useSim } from './simulation/useSim'
import { STATUS_HEX } from './components/statusTheme'
import type { Status } from './types'

function Legend() {
  return (
    <div className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.14em]">
      {(['ok', 'warning', 'critical'] as const).map((s) => (
        <span key={s} className="flex items-center gap-1.5 text-slate-mid">
          <span className="h-2 w-2 rounded-full" style={{ background: STATUS_HEX[s] }} />
          {s === 'ok' ? 'Nominal' : s}
        </span>
      ))}
    </div>
  )
}

function MapPanel({
  focusKey,
  focusSeq,
  onFly,
}: {
  focusKey: FocusKey
  focusSeq: number
  onFly: (key: FocusKey) => void
}) {
  const { state, selectModule } = useSim()
  return (
    <Panel
      fill
      className="min-h-[540px] xl:min-h-[calc(100vh-212px)]"
      title="Interactive 3D digital twin"
      sub="click a module, use the rail, or a view preset — the twin flies you there"
      right={
        <>
          <Legend />
          <SimTag label="Simulated twin" />
        </>
      }
    >
      <MapView
        modules={state.modules}
        selected={state.selected}
        onSelect={selectModule}
        focusKey={focusKey}
        focusSeq={focusSeq}
        onFly={onFly}
      />
    </Panel>
  )
}

function TwinStage() {
  const { state, selectModule } = useSim()
  const [focusKey, setFocusKey] = useState<FocusKey>('site')
  const [focusSeq, setFocusSeq] = useState(0)

  const flyTo = (key: FocusKey) => {
    setFocusKey(key)
    setFocusSeq((s) => s + 1)
  }

  const { selected } = state

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const idx = parseInt(e.key, 10)
      if (e.key === 'Escape' || e.key === '0') {
        if (selected === null && e.key === 'Escape') return
        selectModule(null)
        flyTo('site')
        return
      }
      if (e.key === 'p' || e.key === 'P') {
        flyTo('jetty')
        return
      }
      if (idx >= 1 && idx <= MODULE_ID_SET.length) {
        const id = MODULE_ID_SET[idx - 1]
        selectModule(id)
        flyTo(id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectModule, selected])

  return (
    <motion.div layout className="flex min-w-0 flex-col gap-4 xl:col-span-8">
      <MapPanel focusKey={focusKey} focusSeq={focusSeq} onFly={flyTo} />
      <ModuleDetailPanel onFly={flyTo} />
    </motion.div>
  )
}

function OpsColumn() {
  return (
    <>
      <FuelRunway />
      <WhatIfPanel />
      <AIPredictiveLab />
      <AlertsFeed />
    </>
  )
}

function ScienceColumn() {
  const { state } = useSim()
  return (
    <>
      <TelemetryCard
        icon={<Activity size={13} className="text-glacial" />}
        title="Ambient temperature"
        sub="environmental telemetry · surf-air · refresh 2 s"
        value={state.temp.v.toFixed(1)}
        unit="°C"
        status={state.temp.band.kind}
        color="#5ec8d8"
        history={state.temp.history}
        domain={[-40, 10]}
        markers={[
          { y: TEMP_WARN_LO, kind: 'warning' },
          { y: TEMP_WARN_HI, kind: 'warning' },
        ]}
        height={140}
      />
      <SeaIntakeCard />
    </>
  )
}

function SeaIntakeCard() {
  const { state } = useSim()
  const seaOk = state.seaState <= SEA_WARN
  return (
    <section className="border border-line bg-panel/70">
      <header className="flex h-9 items-center justify-between border-b border-line-soft px-3.5">
        <div className="flex items-center gap-2">
          <Droplets size={13} className="text-glacial" />
          <h3 className="font-sans text-[13px] font-medium text-ink">Sea-water intake</h3>
        </div>
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate-faint">Env · Sim</span>
      </header>
      <div className="px-3.5 pt-3">
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-[30px] font-medium leading-none tabular-nums" style={{ color: seaOk ? '#e6f0f7' : '#f5a623' }}>
            {(state.seaState * 100).toFixed(0)}
          </span>
          <span className="font-mono text-[12px] text-slate-dim">% flow</span>
        </div>
        <p className="pt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-slate-faint">
          {seaOk ? 'intake nominal · open water' : 'frazil ice detected in intake'}
        </p>
      </div>
      <div className="px-3.5 pt-2">
        <div className="h-1.5 w-full border border-line bg-abyss/60">
          <div className="h-full" style={{ width: `${state.seaState * 100}%`, background: seaOk ? '#4ade80' : '#f5a623' }} />
        </div>
        <div className="flex justify-between pt-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-slate-faint">
          <span>Seasonal probe · Sim</span>
          <span>warn {Math.round(SEA_WARN * 100)} %</span>
        </div>
      </div>
    </section>
  )
}

function RoleNotice() {
  const { state } = useSim()
  const meta = ROLE_META[state.role]
  return (
    <div className="flex items-center gap-3 border border-line bg-abyss/40 px-3 py-2">
      <span className="h-1.5 w-1.5 rounded-full bg-glacial" />
      <p className="font-sans text-[11px] text-slate-mid">
        <span className="font-medium text-ink">{meta.label}</span> — {meta.blurb}.
      </p>
      <span className="ml-auto shrink-0 font-mono text-[9px] uppercase tracking-[0.14em] text-slate-faint hidden sm:inline">
        {meta.isOps ? 'ops console' : 'science console'}
      </span>
    </div>
  )
}

function SystemsStatusStrip() {
  const { state } = useSim()
  const counts = { ok: 0, warning: 0, critical: 0 }
  for (const m of Object.values(state.modules)) counts[m.status] += 1
  const worst: Status = counts.critical > 0 ? 'critical' : counts.warning > 0 ? 'warning' : 'ok'
  const hex = STATUS_HEX[worst]
  const label =
    worst === 'critical' ? `critical fault · ${counts.critical} subsystem${counts.critical > 1 ? 's' : ''}` :
    worst === 'warning' ? `${counts.warning} subsystem${counts.warning > 1 ? 's' : ''} degraded` :
    'all systems nominal'

  return (
    <div className="flex items-center justify-between gap-4 border-b border-line bg-abyss/50 px-4 py-1.5">
      <div className="flex items-center gap-2.5">
        {worst === 'ok' ? (
          <span className="h-2 w-2 bg-ok/90" />
        ) : (
          <motion.span
            className="h-2 w-2"
            style={{ background: hex }}
            animate={worst === 'critical' ? { opacity: [1, 0.15, 1] } : { opacity: [0.55, 1, 0.55] }}
            transition={worst === 'critical' ? { duration: 0.55, repeat: Infinity } : { duration: 1.4, repeat: Infinity }}
          />
        )}
        <span className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: hex }}>
          systems
        </span>
        <span className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-slate-dim sm:inline">
          {label}
        </span>
      </div>
      <div className="flex items-center gap-4 font-mono text-[9px] uppercase tracking-[0.14em]">
        <span className="text-ok">ok {counts.ok}</span>
        <span className="text-amber">warn {counts.warning}</span>
        <span className="text-crit">crit {counts.critical}</span>
      </div>
    </div>
  )
}

function Dashboard() {
  const { state } = useSim()
  const isOps = ROLE_META[state.role].isOps

  return (
    <div className="flex h-full flex-col">
      <Header />
      <SystemsStatusStrip />
      <main className="min-h-0 flex-1 overflow-y-auto p-4">
        <motion.div layout className="grid gap-4 xl:grid-cols-12">
          <motion.div layout className="min-w-0 xl:col-span-12">
            <RoleNotice />
          </motion.div>
          <TwinStage />
          <motion.div layout className="flex min-w-0 flex-col gap-4 xl:col-span-4">
            {isOps ? <OpsColumn /> : <ScienceColumn />}
          </motion.div>
        </motion.div>
      </main>
      <Footer />
    </div>
  )
}

function Footer() {
  return (
    <footer className="flex items-center justify-between gap-3 border-t border-line bg-abyss/60 px-4 py-2">
      <p className="font-sans text-[10px] text-slate-dim">
        NCPOR · Digital Twin — Bharati Station, Larsemann Hills.
      </p>
      <p className="shrink-0 font-mono text-[9px] uppercase tracking-[0.16em] text-slate-faint">
        All telemetry simulated · no NCPOR operational data
      </p>
    </footer>
  )
}

export default function App() {
  return (
    <SimProvider>
      <div className="min-h-full font-sans">
        <Dashboard />
      </div>
    </SimProvider>
  )
}