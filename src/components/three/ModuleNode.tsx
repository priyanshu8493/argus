import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { MODULE_META } from '../../types'
import type { ModuleId, ModuleState } from '../../types'
import { STATUS_HEX, STATUS_LABEL } from '../statusTheme'
import { BEACON_Y, HIT, LABEL_Y, MODULE_POS, WF } from './sceneLayout'

const STEEL = { color: '#16283b', metalness: 0.65, roughness: 0.45 }
const PANEL = { color: '#1c3350', metalness: 0.4, roughness: 0.55 }
const ROOF = { color: '#243a54', metalness: 0.5, roughness: 0.5 }

function Body({ id }: { id: ModuleId }) {
  switch (id) {
    case 'main':
      return (
        <group>
          {[
            [-20, -9],
            [20, -9],
            [-20, 9],
            [20, 9],
          ].map(([x, z]) => (
            <mesh key={`${x}${z}`} position={[x, 2.2, z]}>
              <cylinderGeometry args={[0.8, 1.1, 4.4, 8]} />
              <meshStandardMaterial {...STEEL} />
            </mesh>
          ))}
          <mesh position={[0, 5.8, 0]}>
            <boxGeometry args={[44, 7, 21]} />
            <meshStandardMaterial {...STEEL} />
          </mesh>
          <mesh position={[0, 9.9, 0]}>
            <boxGeometry args={[46, 2, 22]} />
            <meshStandardMaterial {...ROOF} />
          </mesh>
          <mesh position={[14, 11.3, -8]}>
            <boxGeometry args={[4, 3, 3]} />
            <meshStandardMaterial {...PANEL} />
          </mesh>
          <mesh position={[-16, 11.3, -8]}>
            <boxGeometry args={[4, 3, 3]} />
            <meshStandardMaterial {...PANEL} />
          </mesh>
          <mesh position={[0, 13.6, 0]}>
            <cylinderGeometry args={[0.35, 0.35, 3.4, 8]} />
            <meshStandardMaterial {...STEEL} />
          </mesh>
        </group>
      )
    case 'fuel-farm':
      return (
        <group>
          <mesh position={[0, 0.3, 0]}>
            <cylinderGeometry args={[34, 34, 0.6, 48]} />
            <meshStandardMaterial color="#122436" metalness={0.4} roughness={0.7} />
          </mesh>
          {[
            [-11, -9],
            [11, -9],
            [0, 10],
          ].map(([x, z], i) => (
            <mesh key={i} position={[x, 4.5, z]}>
              <cylinderGeometry args={[10.5, 10.5, 9, 28]} />
              <meshStandardMaterial color="#16304a" metalness={0.35} roughness={0.55} />
            </mesh>
          ))}
          {[
            [-11, -9],
            [11, -9],
            [0, 10],
          ].map(([x, z], i) => (
            <mesh key={`t${i}`} position={[x, 9.3, z]}>
              <cylinderGeometry args={[1, 1, 1.4, 12]} />
              <meshStandardMaterial color="#2a445e" metalness={0.5} roughness={0.5} />
            </mesh>
          ))}
        </group>
      )
    case 'fuel-station':
      return (
        <group>
          <mesh position={[0, 3, 0]}>
            <boxGeometry args={[26, 6, 15]} />
            <meshStandardMaterial {...STEEL} />
          </mesh>
          <mesh position={[0, 6.4, 0]}>
            <boxGeometry args={[14, 1.6, 15]} />
            <meshStandardMaterial {...ROOF} />
          </mesh>
          {[
            [-17, -5],
            [-17, 5],
            [17, -5],
            [17, 5],
          ].map(([x, z], i) => (
            <mesh key={i} position={[x, 3.6, z]}>
              <cylinderGeometry args={[2.9, 2.9, 7, 16]} />
              <meshStandardMaterial color="#bfe2f2" metalness={0.35} roughness={0.5} />
            </mesh>
          ))}
        </group>
      )
    case 'pump-house':
      return (
        <group>
          <mesh position={[0, 2.6, 0]}>
            <boxGeometry args={[18, 5.2, 12]} />
            <meshStandardMaterial {...STEEL} />
          </mesh>
          <mesh position={[-4.5, 5.7, 0]}>
            <boxGeometry args={[6, 2, 12]} />
            <meshStandardMaterial {...PANEL} />
          </mesh>
          <mesh position={[0, 1.7, 6.4]}>
            <cylinderGeometry args={[4, 4, 3.4, 20, 1, true]} />
            <meshStandardMaterial {...PANEL} />
          </mesh>
        </group>
      )
    case 'summer-camp':
      return (
        <group>
          {[
            [-8, 0],
            [9, 0],
          ].map(([x, z], i) => (
            <mesh key={i} position={[x, 4, z]}>
              <coneGeometry args={[7, 8, 20]} />
              <meshStandardMaterial color="#1e3a52" metalness={0.3} roughness={0.6} />
            </mesh>
          ))}
          <mesh position={[0, 2, 18]}>
            <boxGeometry args={[14, 4, 9]} />
            <meshStandardMaterial color="#b7d9ea" metalness={0.25} roughness={0.55} />
          </mesh>
        </group>
      )
    case 'ageos':
      return (
        <group>
          <mesh position={[0, 2.5, 0]}>
            <boxGeometry args={[16, 5, 16]} />
            <meshStandardMaterial {...STEEL} />
          </mesh>
          <mesh position={[0, 27, 0]}>
            <boxGeometry args={[5, 46, 5]} />
            <meshStandardMaterial {...STEEL} />
          </mesh>
          <group position={[0, 52, 0]}>
            <mesh position={[13, 1.6, 0]} rotation={[0, Math.PI / 2, 0]}>
              <cylinderGeometry args={[0.35, 0.35, 24, 8]} />
              <meshStandardMaterial {...STEEL} />
            </mesh>
            <group rotation={[-1.15, 0.35, 0.25]}>
              <mesh>
                <sphereGeometry args={[13, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#dce9f2" metalness={0.3} roughness={0.35} side={THREE.DoubleSide} />
              </mesh>
              <mesh>
                <sphereGeometry args={[13, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#4aa8c8" wireframe transparent opacity={0.35} />
              </mesh>
            </group>
          </group>
        </group>
      )
  }
}

function drawLabel(
  canvas: HTMLCanvasElement,
  name: string,
  statusLabel: string,
  note: string,
  hex: string,
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.textAlign = 'center'
  ctx.font = '58px "Space Grotesk", sans-serif'
  ctx.fillStyle = '#eaf3f9'
  ctx.fillText(name.toUpperCase(), canvas.width / 2, 100)
  ctx.font = '34px "IBM Plex Mono", monospace'
  ctx.fillStyle = hex
  ctx.fillText(`${statusLabel.toUpperCase()} · ${note}`.toUpperCase(), canvas.width / 2, 158)
}

function ModuleLabel({
  id,
  status,
  note,
  active,
}: {
  id: ModuleId
  status: ModuleState['status']
  note: string
  active: boolean
}) {
  const tex = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 200
    return new THREE.CanvasTexture(canvas)
  }, [])

  useEffect(() => {
    const canvas = tex.image as HTMLCanvasElement
    drawLabel(canvas, MODULE_META[id].name, STATUS_LABEL[status], note, STATUS_HEX[status])
    tex.needsUpdate = true
  }, [id, status, note, tex])

  useEffect(() => () => tex.dispose(), [tex])

  return (
    <sprite position={[0, LABEL_Y[id], 0]} scale={[60, 11.7, 1]}>
      <spriteMaterial map={tex} transparent opacity={active ? 0.95 : 0.6} depthWrite={false} />
    </sprite>
  )
}

export function ModuleNode({
  id,
  mod,
  selected,
  onSelect,
}: {
  id: ModuleId
  mod: ModuleState
  selected: boolean
  onSelect: (id: ModuleId | null) => void
}) {
  const pos = MODULE_POS[id]
  const hex = STATUS_HEX[mod.status]
  const [hovered, setHovered] = useState(false)
  const { gl } = useThree()

  const wf = WF[id]
  const hit = HIT[id]
  const wireMat = useRef<THREE.MeshBasicMaterial | null>(null)
  const beaconMat = useRef<THREE.MeshBasicMaterial | null>(null)
  const mastMat = useRef<THREE.MeshBasicMaterial | null>(null)
  const ringRef = useRef<THREE.Mesh | null>(null)
  const beaconY = useMemo(() => BEACON_Y[id], [id])

  useEffect(() => {
    gl.domElement.style.cursor = hovered ? 'pointer' : 'auto'
  }, [hovered, gl])

  const baseOpacity = selected ? 0.85 : hovered ? 0.55 : 0.28

  useFrame(({ clock }) => {
    if (mod.status === 'critical' && wireMat.current) {
      wireMat.current.opacity = baseOpacity * (0.45 + 0.55 * Math.abs(Math.sin(clock.elapsedTime * 4)))
    } else if (wireMat.current) {
      wireMat.current.opacity = baseOpacity
    }
    if (mod.status === 'critical' && beaconMat.current) {
      beaconMat.current.opacity = 0.55 + 0.45 * Math.abs(Math.sin(clock.elapsedTime * 5))
    }
    if (mastMat.current) {
      mastMat.current.opacity = 0.25 + 0.7 * Math.pow(Math.abs(Math.sin(clock.elapsedTime * 2)), 6)
    }
    if (ringRef.current) {
      const s = 1 + 0.05 * Math.sin(clock.elapsedTime * 3)
      ringRef.current.scale.set(s, 1, s)
    }
  })

  const active = selected || hovered

  return (
    <group position={pos as [number, number, number]} name={`node-${id}`}>
      <Body id={id} />

      {/* status wireframe — CAD cage */}
      <mesh position={[0, wf.y, 0]}>
        <boxGeometry args={wf.size} />
        <meshBasicMaterial
          ref={wireMat}
          color={hex}
          wireframe
          transparent
          opacity={baseOpacity}
          depthWrite={false}
        />
      </mesh>

      {/* critical beacon */}
      {mod.status === 'critical' && (
        <mesh position={[0, beaconY, 0]}>
          <sphereGeometry args={[1.1, 12, 12]} />
          <meshBasicMaterial ref={beaconMat} color="#ff5a5f" transparent opacity={0.8} toneMapped={false} />
        </mesh>
      )}

      {/* ageos aviation beacon — always blinking */}
      {id === 'ageos' && (
        <mesh position={[0, 49.9, 0]}>
          <sphereGeometry args={[0.9, 10, 10]} />
          <meshBasicMaterial ref={mastMat} color="#ff5a5f" transparent opacity={0.6} toneMapped={false} />
        </mesh>
      )}

      {/* selection pylon ring */}
      {selected && (
        <mesh ref={ringRef} rotation-x={-Math.PI / 2} position-y={0.18}>
          <ringGeometry args={[26, 27.4, 64]} />
          <meshBasicMaterial color={hex} transparent opacity={0.6} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}

      {/* hit area */}
      <mesh
        position={[0, hit.y, 0]}
        onPointerDown={(e) => {
          e.stopPropagation()
          onSelect(selected ? null : id)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          setHovered(false)
        }}
      >
        <cylinderGeometry args={[hit.r, hit.r, hit.h, 3]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <ModuleLabel id={id} status={mod.status} note={mod.note} active={active} />
    </group>
  )
}