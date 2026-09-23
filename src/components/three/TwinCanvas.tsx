import { useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'
import { useSim } from '../../simulation/useSim'
import type { ModuleId, ModuleState } from '../../types'
import { FOCUS_POINT, VIEW_DIST } from './sceneLayout'
import type { FocusKey } from './sceneLayout'
import { Environment3D, StormField } from './Environment3D'
import { FlowLines } from './FlowLines'
import { ModuleNode } from './ModuleNode'

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

function FlyRig({ focusKey, seq }: { focusKey: FocusKey; seq: number }) {
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null
  const from = useRef({ pos: new THREE.Vector3(), tgt: new THREE.Vector3(), dir: new THREE.Vector3() })
  const phase = useRef(-1)
  const lastSeq = useRef(0)

  useEffect(() => {
    if (!controls || seq === 0 || seq === lastSeq.current) return
    lastSeq.current = seq
    const fromPos = camera.position.clone()
    const fromTgt = controls.target.clone()
    from.current.pos.copy(fromPos)
    from.current.tgt.copy(fromTgt)
    from.current.dir.copy(fromPos.sub(fromTgt).normalize())
    phase.current = 0
  }, [seq, focusKey, controls, camera])

  useFrame((__, delta) => {
    if (phase.current < 0 || !controls) return
    phase.current += Math.min(delta, 0.05) / 1.25
    const k = Math.min(phase.current, 1)
    const e = easeInOut(k)
    const goal = new THREE.Vector3(...FOCUS_POINT[focusKey])
    const toPos = goal.clone().add(from.current.dir.clone().multiplyScalar(VIEW_DIST[focusKey]))
    camera.position.lerpVectors(from.current.pos, toPos, e)
    controls.target.lerpVectors(from.current.tgt, goal, e)
    controls.update()
    if (k >= 1) phase.current = -1
  })

  return null
}

function ContextLostGuard({ onLost }: { onLost: () => void }) {
  const gl = useThree((s) => s.gl)
  const cb = useRef(onLost)
  cb.current = onLost
  useEffect(() => {
    const el = gl.domElement
    const h = (e: Event) => {
      e.preventDefault()
      cb.current()
    }
    el.addEventListener('webglcontextlost', h)
    return () => el.removeEventListener('webglcontextlost', h)
  }, [gl])
  return null
}

export function TwinCanvas({
  modules,
  selected,
  onSelect,
  focusKey,
  focusSeq,
  onContextLost,
}: {
  modules: Record<ModuleId, ModuleState>
  selected: ModuleId | null
  onSelect: (id: ModuleId | null) => void
  focusKey: FocusKey
  focusSeq: number
  onContextLost?: () => void
}) {
  const { state } = useSim()

  return (
    <Canvas
      flat
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ position: [200, 155, 300], fov: 38 }}
      onCreated={({ gl }) => gl.setClearColor('#050b13', 1)}
      className="!absolute inset-0"
    >
      <color attach="background" args={['#050b13']} />
      <fog attach="fog" args={['#050b13', 320, 700]} />
      {onContextLost && <ContextLostGuard onLost={onContextLost} />}

      <ambientLight intensity={0.55} />
      <hemisphereLight args={['#2a4a6a', '#0a1420', 0.6]} />
      <directionalLight position={[180, 260, 120]} intensity={1.5} color="#cfe8ff" />
      <pointLight position={[-120, 90, -60]} intensity={0.45} color="#5ec8d8" />

      <Environment3D />
      {state.stormTicksLeft > 0 && <StormField />}

      {Object.values(modules).map((m) => (
        <ModuleNode key={m.id} id={m.id} mod={m} selected={selected === m.id} onSelect={onSelect} />
      ))}

      <FlowLines />

      <OrbitControls
        makeDefault
        target={[0, 0, 0]}
        enableDamping
        dampingFactor={0.08}
        enablePan
        panSpeed={0.6}
        minDistance={50}
        maxDistance={460}
        maxPolarAngle={Math.PI / 2.02}
        minPolarAngle={0.4}
      />

      <FlyRig focusKey={focusKey} seq={focusSeq} />
    </Canvas>
  )
}