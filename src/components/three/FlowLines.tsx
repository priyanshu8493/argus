import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSim } from '../../simulation/useSim'
import { MODULE_POS } from './sceneLayout'

type FlowKind = 'power' | 'fuel' | 'water' | 'uplink'

interface Link {
  kind: FlowKind
  from: [number, number, number]
  to: [number, number, number]
  bend?: [number, number, number]
  speed: number
  width: number
  gap: number
}

const BASE_HEX: Record<FlowKind, string> = {
  power: '#5ec8d8',
  fuel: '#f5a623',
  water: '#3ea6bb',
  uplink: '#4ade80',
}

const POWER: Link[] = [
  { kind: 'power', from: [16, 0.7, 0], to: MODULE_POS['fuel-farm'], bend: [-30, 3, -12], speed: 5, width: 3, gap: 6 },
  { kind: 'power', from: [16, 0.7, 0], to: MODULE_POS['fuel-station'], bend: [-10, 3, 18], speed: 5, width: 3, gap: 6 },
  { kind: 'power', from: [16, 0.7, 0], to: MODULE_POS['pump-house'], bend: [70, 3, 24], speed: 5, width: 3, gap: 6 },
  { kind: 'power', from: [-16, 0.7, 0], to: MODULE_POS['summer-camp'], bend: [-80, 3, -16], speed: 4.5, width: 3, gap: 6 },
  { kind: 'power', from: [16, 0.7, 0], to: MODULE_POS['ageos'], bend: [80, 3, -2], speed: 4.5, width: 3, gap: 6 },
]

const FUEL: Link[] = [
  { kind: 'fuel', from: [-95, 0.6, -16], to: [-55, 0.6, 14], bend: [-70, 2, 4], speed: 3.5, width: 4, gap: 5 },
  { kind: 'fuel', from: [-55, 0.6, 24], to: [-20, 0.6, 63], bend: [-40, 2, 46], speed: 3.5, width: 4, gap: 5 },
]

const WATER: Link[] = [
  { kind: 'water', from: [128, 0.6, 32], to: [112, 0.6, 63], bend: [124, 2, 50], speed: 4.5, width: 3, gap: 6 },
  { kind: 'water', from: [120, 0.8, 26], to: [20, 0.8, 10], bend: [70, 2, 16], speed: 4.5, width: 3, gap: 6 },
]

const UP: Link[] = [
  { kind: 'uplink', from: [150, 26, -10], to: [150, 118, -10], bend: [160, 70, -18], speed: 12, width: 4, gap: 4 },
]

const ALL: Link[] = [...POWER, ...FUEL, ...WATER, ...UP]

const SEGMENTS = 44

interface Row {
  kind: FlowKind
  points: THREE.Vector3[]
  cycle: number
  phase: number
  lines: THREE.LineSegments
  geo: THREE.BufferGeometry
  attr: THREE.BufferAttribute
  material: THREE.LineBasicMaterial
}

function curveFor(l: Link): THREE.Curve<THREE.Vector3> {
  const a = new THREE.Vector3(...l.from)
  const b = new THREE.Vector3(...l.to)
  if (l.bend) {
    const m = new THREE.Vector3(...l.bend)
    m.y = Math.max(a.y, b.y) + 2.5
    return new THREE.QuadraticBezierCurve3(a, m, b)
  }
  return new THREE.LineCurve3(a, b)
}

export function FlowLines() {
  const { state } = useSim()
  const root = useRef<THREE.Group>(null)
  const statRef = useRef(state)
  statRef.current = state

  const rowsRef = useRef<Row[]>([])

  useEffect(() => {
    const group = root.current
    if (!group) return

    const rows: Row[] = []

    for (const link of ALL) {
      const curve = curveFor(link)
      const pts = curve.getSpacedPoints(SEGMENTS + 1)
      const positions = new Float32Array(SEGMENTS * 6)
      const attr = new THREE.BufferAttribute(positions, 3)
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', attr)

      const color = new THREE.Color(BASE_HEX[link.kind])
      const mat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.85,
        toneMapped: false,
      })
      const lines = new THREE.LineSegments(geo, mat)
      lines.name = `flow-${link.kind}`
      group.add(lines)

      rows.push({
        kind: link.kind,
        points: pts,
        cycle: link.width + link.gap,
        phase: Math.random() * (link.width + link.gap),
        lines,
        geo,
        attr,
        material: mat,
      })
    }

    // prime all segments lit so the route reads before the first frame
    for (const r of rows) {
      for (let j = 0; j < SEGMENTS; j++) {
        const a = r.points[j]
        const b = r.points[j + 1]
        r.attr.setXYZ(j * 2, a.x, a.y, a.z)
        r.attr.setXYZ(j * 2 + 1, b.x, b.y, b.z)
      }
      r.attr.needsUpdate = true
    }

    rowsRef.current = rows

    return () => {
      for (const r of rows) {
        group.remove(r.lines)
        r.geo.dispose()
        r.material.dispose()
      }
    }
  }, [])

  useFrame((_, delta) => {
    const st = statRef.current
    const dt = Math.min(delta, 0.05)

    const powerHex = st.generatorFailed ? '#ff5a5f' : BASE_HEX.power
    const fuelHex = st.fuel.band.kind === 'critical' ? '#ff5a5f' : BASE_HEX.fuel
    const upHex = st.satelliteOnline ? BASE_HEX.uplink : '#f5a623'

    for (const r of rowsRef.current) {
      const hex =
        r.kind === 'power' ? powerHex : r.kind === 'fuel' ? fuelHex : r.kind === 'uplink' ? upHex : BASE_HEX.water
      r.material.color.set(hex)

      r.phase = (r.phase + dt * 24) % r.cycle

      for (let j = 0; j < SEGMENTS; j++) {
        const d = (j - r.phase + r.cycle) % r.cycle
        const lit = d < 4
        const a = r.points[j]
        const b = r.points[j + 1]
        if (lit) {
          r.attr.setXYZ(j * 2, a.x, a.y, a.z)
          r.attr.setXYZ(j * 2 + 1, b.x, b.y, b.z)
        } else {
          // collapse to a degenerate segment so the gap disappears
          r.attr.setXYZ(j * 2, a.x, a.y, a.z)
          r.attr.setXYZ(j * 2 + 1, a.x, a.y, a.z)
        }
      }
      r.attr.needsUpdate = true
    }
  })

  return <group ref={root} />
}