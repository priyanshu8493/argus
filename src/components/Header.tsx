import { motion } from 'framer-motion'
import { Radio, Satellite } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ROLE_META } from '../types'
import type { Role } from '../types'
import { SimTag } from './Panel'
import { useSim } from '../simulation/useSim'

export function RoleTabs() {
  const { state, setRole } = useSim()
  return (
    <div className="flex items-center gap-0.5 border border-line bg-abyss/50 p-0.5">
      {(Object.keys(ROLE_META) as Role[]).map((r) => {
        const active = state.role === r
        return (
          <button
            key={r}
            onClick={() => setRole(r)}
            aria-pressed={active}
            title={ROLE_META[r].blurb}
            className={`relative px-3 py-1.5 font-sans text-[12px] transition-colors ${
              active ? 'text-glacial' : 'text-slate-dim hover:text-slate-mid'
            }`}
          >
            {active && (
              <motion.span
                layoutId="role-pill"
                className="absolute inset-0 border border-glacial/40 bg-glacial/12"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative">{ROLE_META[r].label}</span>
          </button>
        )
      })}
    </div>
  )
}

function Led({ color, pulse }: { color: string; pulse: boolean }) {
  return (
    <span className="relative flex h-2.5 w-2.5 items-center justify-center">
      {pulse ? (
        <motion.span
          className="absolute h-2.5 w-2.5 rounded-full"
          style={{ background: color, boxShadow: `0 0 8px ${color}` }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      ) : (
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: color, boxShadow: `0 0 8px ${color}` }}
        />
      )}
    </span>
  )
}

export function SatelliteLink() {
  const { state, setSatelliteOnline } = useSim()
  const { satelliteOnline: online, syncing, queuedPackets, syncTotal } = state

  const showBadge = !online || (online && queuedPackets > 0)

  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex w-[258px] flex-col gap-1.5 border p-2 transition-colors ${
          syncing
            ? 'border-glacial/50 bg-glacial/5'
            : online
              ? 'border-ok/40 bg-ok/5 hover:border-ok/70'
              : 'border-amber/50 bg-amber/5 hover:border-amber/80'
        }`}
      >
        <button
          onClick={() => {
            if (!syncing) setSatelliteOnline(!online)
          }}
          disabled={syncing}
          aria-pressed={online}
          title={
            syncing
              ? 'Flushing queued packets — please wait'
              : online
                ? 'Fault the satellite link — go offline-first'
                : 'Restore satellite link and sync queued packets'
          }
          className="flex w-full cursor-pointer items-center justify-between gap-2 text-left disabled:cursor-default"
        >
          <span className="flex items-center gap-2">
            <Satellite size={14} className={syncing ? 'animate-pulse text-glacial' : online ? 'text-ok' : 'text-amber'} />
            <span className="font-sans text-[12px] font-medium text-ink">Satellite link</span>
          </span>
          <span className="flex items-center gap-1.5">
            {syncing ? (
              <>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-glacial">
                  syncing {syncTotal}
                </span>
                <Led color="#5ec8d8" pulse />
              </>
            ) : online ? (
              <>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ok">online</span>
                <Led color="#4ade80" pulse={false} />
              </>
            ) : (
              <>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-amber">offline</span>
                <Led color="#f5a623" pulse />
              </>
            )}
          </span>
        </button>

        {syncing ? (
          <div className="h-1 w-full border border-line bg-abyss/60">
            <motion.div
              key={syncTotal}
              className="h-full bg-glacial"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2.4, ease: 'linear' }}
            />
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-dim">
              {online ? 'uplink live' : 'store & forward active'}
            </span>
            {showBadge && (
              <span
                className={`px-1.5 font-mono text-[10px] font-semibold tabular-nums ${
                  online ? 'text-glacial' : 'text-amber'
                }`}
              >
                {queuedPackets} PKTS {online ? '' : 'Q'}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="hidden flex-col items-end gap-1 lg:flex">
        <span className="font-sans text-[11px] text-slate-mid">
          {online ? 'NCPOR HQ link' : 'Edge processing'}
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-faint">
          {online ? 'real-time sync' : 'offline-first'}
        </span>
      </div>
    </div>
  )
}

function UtcClock() {
  const [t, setT] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setT(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])
  return (
    <div className="flex flex-col items-end">
      <span className="font-mono text-[13px] tabular-nums text-ink">
        {t.toISOString().slice(11, 19)}Z
      </span>
      <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-faint">UTC · antarctic cmd</span>
    </div>
  )
}

export function Header() {
  return (
    <header className="relative z-10 border-b border-line bg-abyss/70 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-4 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-glacial/40 bg-glacial/10">
            <Radio size={17} className="text-glacial" />
          </div>
          <div className="min-w-0">
            <h1 className="font-sans text-[15px] font-semibold leading-tight tracking-[0.08em] text-ink">
              BHARATI <span className="font-normal text-slate-mid">· digital twin</span>
            </h1>
            <p className="truncate font-mono text-[9px] uppercase tracking-[0.18em] text-slate-faint">
              remote console · prydz bay, larsemann hills
            </p>
          </div>
        </div>

        <div className="hidden lg:block">
          <RoleTabs />
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <UtcClock />
          <span className="hidden xl:inline-flex">
            <SimTag label="Simulated data" />
          </span>
          <SatelliteLink />
        </div>
      </div>
      {/* mobile role tabs */}
      <div className="flex justify-center border-t border-line-soft px-4 py-2 lg:hidden">
        <RoleTabs />
      </div>
      <OfflineBanner />
    </header>
  )
}

export function OfflineBanner() {
  const { state } = useSim()
  const { satelliteOnline: online, syncing, queuedPackets, role } = state

  if (online && !syncing) return null
  const isOps = ROLE_META[role].isOps

  return (
    <div
      className={`flex items-center justify-between gap-3 border-t px-4 py-1.5 ${
        syncing ? 'border-glacial/40 bg-glacial/5' : 'border-amber/40 bg-amber/5'
      }`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${syncing ? 'bg-glacial' : 'bg-amber'}`} />
        {syncing ? (
          <p className="truncate font-sans text-[11px] text-glacial">
            Store-and-forward flush in progress — syncing {state.syncTotal} queued packets to NCPOR HQ.
          </p>
        ) : (
          <p className="truncate font-sans text-[11px] text-amber">
            Offline-first mode: edge telemetry continues locally · {queuedPackets} packets queued for HQ sync when
            the link returns.
          </p>
        )}
      </div>
      {!syncing && (
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-dim">
          {isOps ? 'ops visibility retained' : 'science view unaffected'}
        </span>
      )}
    </div>
  )
}