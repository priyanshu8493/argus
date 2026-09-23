import { Component, useState } from 'react'
import type { ReactNode } from 'react'
import type { ModuleId, ModuleState } from '../types'
import { MODULE_META } from '../types'
import { useSim } from '../simulation/useSim'
import { StationMap } from './StationMap'
import { TwinCanvas } from './three/TwinCanvas'
import type { FocusKey } from './three/sceneLayout'
import { AlertTicker, LiveHud, ModuleRail, ViewBar } from './TwinHud'

class GLBoundary extends Component<
  { onFail: () => void; children: ReactNode },
  { oops: boolean }
> {
  constructor(props: { onFail: () => void; children: ReactNode }) {
    super(props)
    this.state = { oops: false }
  }
  static getDerivedStateFromError() {
    return { oops: true }
  }
  componentDidCatch() {
    try {
      this.props.onFail()
    } catch {
      // ignore
    }
  }
  render() {
    return this.state.oops ? null : this.props.children
  }
}

function webglSupported() {
  try {
    const c = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')))
  } catch {
    return false
  }
}

function keyOf(id: ModuleId | null): FocusKey {
  return id ?? 'site'
}

export function MapView({
  modules,
  selected,
  onSelect,
  focusKey,
  focusSeq,
  onFly,
}: {
  modules: Record<ModuleId, ModuleState>
  selected: ModuleId | null
  onSelect: (id: ModuleId | null) => void
  focusKey: FocusKey
  focusSeq: number
  onFly: (key: FocusKey) => void
}) {
  const { state } = useSim()
  const [view, setView] = useState<'3d' | 'plan'>(() => (webglSupported() ? '3d' : 'plan'))
  const [glFailed, setGlFailed] = useState(false)

  const select = (id: ModuleId | null) => {
    onSelect(id)
    if (id !== null) onFly(keyOf(id))
  }

  const pickModule = (id: ModuleId) => {
    onSelect(selected === id ? null : id)
    onFly(keyOf(selected === id ? null : id))
  }

  const flyView = (key: FocusKey) => {
    if (key === 'jetty') {
      onFly('jetty')
      return
    }
    if (key === 'site') {
      if (selected !== null) onSelect(null)
      onFly('site')
      return
    }
    onSelect(key as ModuleId)
    onFly(key)
  }

  const toggle = (v: '3d' | 'plan') => {
    if (v === '3d') {
      if (!webglSupported()) return
      setGlFailed(false)
    }
    setView(v)
  }

  const show3d = view === '3d' && !glFailed
  const storm = state.stormTicksLeft > 0
  const focusLabel =
    focusKey === 'site' ? 'SITE' : focusKey === 'jetty' ? 'PORT / JETTY' : MODULE_META[focusKey as ModuleId].short

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      {/* HUD — 3D twin (kept mounted; toggled off with display:none to avoid WebGL context churn) */}
      <div className={show3d ? 'relative min-h-[500px] flex-1 overflow-hidden border border-line bg-abyss' : 'hidden'}>
        <GLBoundary onFail={() => setGlFailed(true)}>
          <TwinCanvas
            modules={modules}
            selected={selected}
            onSelect={select}
            focusKey={focusKey}
            focusSeq={focusSeq}
            onContextLost={() => setGlFailed(true)}
          />
        </GLBoundary>

        <ModuleRail selected={selected} onPick={pickModule} />
        <LiveHud />
        <ViewBar view="3d" onView={flyView} onToggle={toggle} />
        <AlertTicker />

        {storm && (
          <div className="pointer-events-none absolute left-2 top-[190px] z-10 border border-amber/50 bg-abyss/85 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.16em] text-amber">
            storm front · blizzard on site
          </div>
        )}

        <div className="pointer-events-none absolute left-1/2 top-2 z-10 flex -translate-x-1/2 items-center gap-2 border border-line bg-abyss/85 px-2 py-1 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-glacial" />
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink">{focusLabel}</span>
          <span className="hidden font-mono text-[8px] uppercase tracking-[0.14em] text-slate-faint lg:inline">
            keys 1-6 · p port · esc site
          </span>
        </div>
      </div>

      {/* Plan sheet */}
      <div className={show3d ? 'hidden' : 'min-w-0'}>
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-dim">
            CAD plan sheet · schematic
          </span>
          <button
            type="button"
            onClick={() => toggle('3d')}
            className="border border-glacial/60 bg-glacial/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-glacial"
          >
            Back to Twin 3D
          </button>
        </div>
        <StationMap modules={modules} selected={selected} onSelect={select} />
      </div>
    </div>
  )
}