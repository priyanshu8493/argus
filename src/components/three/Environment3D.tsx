import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function Snow() {
  const count = 550
  const vel = useMemo(() => {
    const v = new Float32Array(count)
    for (let i = 0; i < count; i++) v[i] = 1.2 + Math.random() * 2.8
    return v
  }, [count])

  const geo = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() * 2 - 1) * 200
      pos[i * 3 + 1] = Math.random() * 90
      pos[i * 3 + 2] = (Math.random() * 2 - 1) * 140
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return g
  }, [count])

  useFrame((_, delta) => {
    const arr = geo.attributes.position.array as Float32Array
    const dt = Math.min(delta, 0.05)
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] -= vel[i] * dt
      if (arr[i * 3 + 1] < -1.2) arr[i * 3 + 1] = 86 + Math.random() * 12
    }
    ;(geo.attributes.position as THREE.BufferAttribute).needsUpdate = true
  })

  return (
    <points geometry={geo}>
      <pointsMaterial color="#dfeaf2" size={0.55} transparent opacity={0.7} sizeAttenuation depthWrite={false} />
    </points>
  )
}

function RadarSweep() {
  const ref = useRef<THREE.Mesh>(null)
  const mat = useRef<THREE.MeshBasicMaterial>(null)
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.6
    if (mat.current) mat.current.opacity = 0.2 + 0.05 * Math.sin(clock.elapsedTime * 3)
  })
  return (
    <mesh ref={ref} rotation-x={-Math.PI / 2} position-y={0.2}>
      <ringGeometry args={[0, 112, 64, 1, 0, Math.PI / 6]} />
      <meshBasicMaterial
        ref={mat}
        color="#5ec8d8"
        transparent
        opacity={0.2}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

function WaterSheen() {
  const mat = useRef<THREE.MeshBasicMaterial>(null)
  useFrame(({ clock }) => {
    if (mat.current) mat.current.opacity = 0.16 + 0.05 * Math.sin(clock.elapsedTime * 0.8)
  })
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, 0.2, 95]}>
      <planeGeometry args={[470, 70]} />
      <meshBasicMaterial ref={mat} color="#2b6f9a" transparent opacity={0.18} depthWrite={false} />
    </mesh>
  )
}

function SiteFurniture() {
  return (
    <group>
      {/* jetty */}
      <group position={[-22, 0, 50]}>
        <mesh position={[0, 1.1, 11]}>
          <boxGeometry args={[7, 2.2, 30]} />
          <meshStandardMaterial color="#163a52" metalness={0.35} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.9, -3]}>
          <boxGeometry args={[9, 1.8, 8]} />
          <meshStandardMaterial color="#122c40" metalness={0.3} roughness={0.75} />
        </mesh>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[-5 + i * 3, 1.1, 25]}>
            <cylinderGeometry args={[1, 1, 1.4, 8]} />
            <meshStandardMaterial color="#b7d9ea" metalness={0.25} roughness={0.5} />
          </mesh>
        ))}
      </group>

      {/* shipping containers near the jetty */}
      {[
        [-40, 12],
        [-36, 15],
        [-40, 19],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 1.6, z]} rotation={[0, i * 0.6, 0]}>
          <boxGeometry args={[10, 3.2, 4]} />
          <meshStandardMaterial color="#d4884a" metalness={0.2} roughness={0.7} />
        </mesh>
      ))}

      {/* helipad */}
      <group position={[34, 0, -26]}>
        <mesh rotation-x={-Math.PI / 2} position-y={0.06}>
          <cylinderGeometry args={[16, 16, 0.25, 40]} />
          <meshStandardMaterial color="#0d1c2b" roughness={0.9} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position-y={0.1}>
          <ringGeometry args={[12.5, 15.5, 40]} />
          <meshBasicMaterial color="#8fb4cc" transparent opacity={0.5} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <mesh position={[-2.4, 0.25, 3]} rotation-x={-Math.PI / 2}>
          <boxGeometry args={[4.8, 4.8, 0.08]} />
          <meshBasicMaterial color="#8fb4cc" transparent opacity={0.45} />
        </mesh>
      </group>

      {/* weather/radar mast near main building */}
      <group position={[30, 0, 14]}>
        <mesh position={[0, 9, 0]}>
          <cylinderGeometry args={[0.25, 0.5, 18, 10]} />
          <meshStandardMaterial color="#20344a" metalness={0.6} roughness={0.5} />
        </mesh>
        <mesh position={[0, 18.6, 0]}>
          <coneGeometry args={[0.9, 1.6, 10]} />
          <meshStandardMaterial color="#2a445e" metalness={0.5} roughness={0.5} />
        </mesh>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0, 4 + i * 5, 0]}>
            <cylinderGeometry args={[0.55, 0.55, 0.6, 12]} />
            <meshStandardMaterial color="#b7d9ea" metalness={0.3} roughness={0.5} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

export function Environment3D() {
  return (
    <group>
      {/* land bed */}
      <mesh rotation-x={-Math.PI / 2} position-y={-0.05}>
        <planeGeometry args={[700, 700]} />
        <meshStandardMaterial color="#0a1420" metalness={0.1} roughness={0.95} />
      </mesh>

      {/* engineering grid */}
      <gridHelper position={[0, 0.01, 0]} args={[520, 52, '#1d3348', '#13243a']} />

      {/* sea surface */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.14, 95]}>
        <planeGeometry args={[470, 70]} />
        <meshStandardMaterial color="#0e2940" transparent opacity={0.85} roughness={0.55} metalness={0.15} />
      </mesh>
      <WaterSheen />

      <SiteFurniture />

      {/* scan meridian ring around the site */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.16}>
        <ringGeometry args={[118, 118.8, 96]} />
        <meshBasicMaterial color="#1d3348" transparent opacity={0.9} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <RadarSweep />
    </group>
  )
}

export function StormField() {
  return <Snow />
}