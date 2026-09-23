import { motion } from 'framer-motion'
import type { KeyboardEvent } from 'react'
import { MODULE_META } from '../types'
import type { ModuleId, ModuleState } from '../types'
import { STATUS_HEX, STATUS_LABEL } from './statusTheme'

interface RegionDef {
  id: ModuleId
  x: number
  y: number
  w: number
  h: number
  labelX: number
  labelY: number
  anchor: 'start' | 'middle' | 'end'
}

const REGIONS: RegionDef[] = [
  { id: 'summer-camp', x: 95, y: 55, w: 150, h: 120, labelX: 170, labelY: 192, anchor: 'middle' },
  { id: 'ageos', x: 660, y: 45, w: 240, h: 150, labelX: 780, labelY: 212, anchor: 'middle' },
  { id: 'main', x: 330, y: 140, w: 210, h: 125, labelX: 435, labelY: 282, anchor: 'middle' },
  { id: 'fuel-farm', x: 120, y: 230, w: 105, h: 95, labelX: 172, labelY: 342, anchor: 'middle' },
  { id: 'fuel-station', x: 205, y: 330, w: 135, h: 95, labelX: 272, labelY: 442, anchor: 'middle' },
  { id: 'pump-house', x: 700, y: 350, w: 150, h: 95, labelX: 852, labelY: 472, anchor: 'end' },
]

function Glyph({ id }: { id: ModuleId }) {
  const s: { fill: string; stroke: string } = { fill: 'none', stroke: '#7fa3c0' }
  const hair = { fill: '#0a1420', stroke: 'none' }
  switch (id) {
    case 'main':
      return (
        <g>
          <rect x={20} y={18} width={78} height={46} rx={0} {...hair} />
          <rect x={20} y={18} width={78} height={46} rx={0} {...s} strokeWidth={1} />
          <path d="M38 18 L56 6 L74 18" {...s} strokeWidth={1} />
          <g fill="#9fb8cc">
            <rect x={30} y={32} width={9} height={9} opacity={0.7} />
            <rect x={45} y={32} width={9} height={9} opacity={0.7} />
            <rect x={60} y={32} width={9} height={9} opacity={0.7} />
            <rect x={75} y={32} width={9} height={9} opacity={0.7} />
            <rect x={30} y={46} width={9} height={9} opacity={0.45} />
            <rect x={45} y={46} width={9} height={9} opacity={0.45} />
          </g>
          <rect x={88} y={40} width={22} height={12} {...s} strokeWidth={1} opacity={0.9} />
        </g>
      )
    case 'fuel-farm':
      return (
        <g>
          <circle cx={30} cy={38} r={15} {...s} strokeWidth={1} />
          <circle cx={30} cy={38} r={5} fill="#5ec8d8" opacity={0.5} />
          <circle cx={64} cy={38} r={15} {...s} strokeWidth={1} />
          <circle cx={64} cy={38} r={5} fill="#5ec8d8" opacity={0.5} />
          <circle cx={47} cy={66} r={15} {...s} strokeWidth={1} />
          <circle cx={47} cy={66} r={5} fill="#5ec8d8" opacity={0.5} />
        </g>
      )
    case 'fuel-station':
      return (
        <g>
          <rect x={18} y={16} width={96} height={50} rx={0} {...s} strokeWidth={1} />
          <rect x={28} y={28} width={20} height={26} fill="#9fb8cc" opacity={0.55} />
          <rect x={58} y={28} width={20} height={26} fill="#9fb8cc" opacity={0.55} />
          <rect x={86} y={28} width={16} height={26} fill="#5ec8d8" opacity={0.4} />
          <circle cx={73} cy={84} r={9} fill="none" stroke="#2a445e" strokeDasharray="3 3" />
        </g>
      )
    case 'pump-house':
      return (
        <g>
          <rect x={14} y={18} width={60} height={44} rx={0} {...s} strokeWidth={1} />
          <rect x={22} y={28} width={16} height={14} fill="#9fb8cc" opacity={0.55} />
          <rect x={48} y={28} width={16} height={14} fill="#9fb8cc" opacity={0.55} />
          <path d="M16 62 L0 66" {...s} strokeWidth={1.4} />
          <path d="M74 30 L96 22" {...s} strokeWidth={1} />
          <path d="M96 22 L108 18" stroke="#2a445e" strokeWidth={1} strokeDasharray="3 3" />
        </g>
      )
    case 'summer-camp':
      return (
        <g>
          <g {...s} strokeWidth={1}>
            <path d="M26 70 L50 38 L74 70 Z" />
            <path d="M60 70 L84 38 L108 70 Z" />
          </g>
          <g {...s} strokeWidth={1}>
            <path d="M18 58 L42 26 L66 58 Z" opacity={0.7} />
          </g>
          <rect x={22} y={76} width={54} height={14} rx={0} fill="#0a1420" stroke="#7fa3c0" strokeWidth={1} opacity={0.85} />
        </g>
      )
    case 'ageos':
      return (
        <g>
          <g {...s} strokeWidth={1.2}>
            <ellipse cx={58} cy={54} rx={46} ry={44} />
            <ellipse cx={182} cy={70} rx={34} ry={32} />
          </g>
          <circle cx={58} cy={54} r={30} fill="#0a1420" stroke="#7fa3c0" strokeWidth={1} />
          <path d="M58 54 L88 30" {...s} strokeWidth={1} />
          <circle cx={88} cy={30} r={4} fill="#5ec8d8" opacity={0.7} />
          <circle cx={182} cy={70} r={20} fill="#0a1420" stroke="#7fa3c0" strokeWidth={1} />
          <path d="M182 70 L206 52" {...s} strokeWidth={1} />
          <circle cx={206} cy={52} r={3.5} fill="#5ec8d8" opacity={0.7} />
          <path d="M58 52 L58 108 M182 68 L182 128" stroke="#2a445e" strokeWidth={1} />
        </g>
      )
  }
}

function Region({
  def,
  mod,
  selected,
  onSelect,
}: {
  def: RegionDef
  mod: ModuleState
  selected: boolean
  onSelect: (id: ModuleId | null) => void
}) {
  const hex = STATUS_HEX[mod.status]

  const onKey = (e: KeyboardEvent<SVGGElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(selected ? null : def.id)
    }
  }

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`${MODULE_META[def.id].name} — ${STATUS_LABEL[mod.status]}. Activate for details.`}
      onClick={() => onSelect(selected ? null : def.id)}
      onKeyDown={onKey}
      className="cursor-pointer outline-none focus-visible:opacity-100"
      // eslint-disable-next-line react/no-unknown-property
      data-status={mod.status}
    >
      {/* selection viewfinder — CAD corner brackets */}
      <motion.g
        className="pointer-events-none"
        animate={{ opacity: selected ? 1 : 0 }}
        initial={false}
      >
        <g stroke={hex} strokeWidth={1.5} fill="none">
          <path d={`M${def.x} ${def.y + 12} V${def.y} H${def.x + 12}`} />
          <path d={`M${def.x + def.w - 12} ${def.y} H${def.x + def.w} V${def.y + 12}`} />
          <path d={`M${def.x + def.w} ${def.y + def.h - 12} V${def.y + def.h} H${def.x + def.w - 12}`} />
          <path d={`M${def.x + 12} ${def.y + def.h} H${def.x} V${def.y + def.h - 12}`} />
        </g>
      </motion.g>

      {/* hit area */}
      <rect x={0} y={0} width={def.w} height={def.h} rx={0} fill="transparent" />

      {/* status-tinted panel */}
      <motion.rect
        x={0}
        y={0}
        width={def.w}
        height={def.h}
        rx={0}
        initial={false}
        animate={{ fill: hex, fillOpacity: 0.08, stroke: hex }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        strokeWidth={selected ? 1.6 : 1.1}
      />

      {/* critical pulse — hard blink, no glow */}
      {mod.status === 'critical' && (
        <motion.rect
          className="pointer-events-none"
          x={-2}
          y={-2}
          width={def.w + 4}
          height={def.h + 4}
          rx={0}
          fill="none"
          stroke={hex}
          strokeWidth={1.7}
          initial={{ opacity: 0.8 }}
          animate={{ opacity: [0.9, 0.15, 0.9] }}
          transition={{ duration: 0.55, repeat: Infinity, times: [0, 0.6, 1], ease: 'linear' }}
        />
      )}

      <motion.g
        initial={false}
        animate={{ opacity: selected ? 1 : 0.75 }}
        whileHover={{ opacity: 1 }}
      >
        <Glyph id={def.id} />
      </motion.g>

      <circle cx={10} cy={10} r={4.5} fill={hex} stroke="#0a1420" strokeWidth={1} />
      <circle cx={10} cy={10} r={8} fill="none" stroke={hex} strokeOpacity={0.35} />
    </g>
  )
}

export function StationMap({
  modules,
  selected,
  onSelect,
}: {
  modules: Record<ModuleId, ModuleState>
  selected: ModuleId | null
  onSelect: (id: ModuleId | null) => void
}) {
  return (
    <svg
      viewBox="0 0 920 520"
      className="block h-auto w-full select-none"
      role="group"
      aria-label="Bharati station module map"
    >
      <defs>
        <pattern id="bgrid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0 H0 V40" fill="none" stroke="#122a41" strokeWidth="0.6" />
        </pattern>
        <pattern id="seahatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="#14324e" strokeWidth="1" />
        </pattern>
      </defs>

      {/* coastline / sea — flat bed + engineering hatch */}
      <rect x={0} y={314} width={920} height={206} fill="#0a2033" />
      <rect x={0} y={314} width={920} height={206} fill="url(#seahatch)" opacity={0.6} />
      <path
        d="M0 318 Q 90 300 180 330 T 360 322 T 540 332 T 720 318 T 920 322 L 920 330 L 0 330 Z"
        fill="none"
        stroke="#163a52"
        strokeWidth={1}
        opacity={0.7}
      />

      {/* land — flat fill, contour hairlines */}
      <path
        d="M0 150 L60 70 L150 38 L300 44 L410 62 L560 40 L700 62 L860 48 L920 92 L920 330 L800 350 L640 322 L520 372 L430 344 L300 378 L170 344 L80 378 L0 344 Z"
        fill="#10263c"
      />
      <path d="M60 150 Q 180 190 320 160 T 640 150 T 920 170" fill="none" stroke="#1a3047" strokeWidth={1} />
      <path d="M120 210 Q 260 250 420 210 T 700 200" fill="none" stroke="#18304a" strokeWidth={0.8} />

      {/* utility hairlines */}
      <g stroke="#2a445e" strokeWidth={1} fill="none" opacity={0.8}>
        {/* fuel line farm → station → main */}
        <path d="M225 270 L270 340 L330 360 L360 300" strokeDasharray="5 5" />
        {/* power main → pump-house */}
        <path d="M540 220 L660 250 L700 380" strokeDasharray="5 5" />
        {/* power main → ageos + camp */}
        <path d="M540 150 L620 120 L660 90" strokeDasharray="5 5" />
        <path d="M330 190 L250 140" strokeDasharray="5 5" />
      </g>

      {/* jetty */}
      <g>
        <rect x={352} y={352} width={10} height={66} fill="#1b3a52" stroke="#2a4a66" strokeWidth={1} />
        <text x={357} y={428} textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize={9} letterSpacing={2} fill="#4a6a88">
          JETTY
        </text>
      </g>

      {/* AGEOS uplink marker */}
      <g>
        <path d="M780 45 L842 12 L920 4" stroke="#5ec8d8" strokeWidth={1} strokeDasharray="2 3" opacity={0.5} />
      </g>

      {REGIONS.map((def) => (
        <Region
          key={def.id}
          def={def}
          mod={modules[def.id]}
          selected={selected === def.id}
          onSelect={onSelect}
        />
      ))}

      {/* module labels */}
      {REGIONS.map((def) => {
        const mod = modules[def.id]
        const hex = STATUS_HEX[mod.status]
        const active = selected === def.id
        return (
          <g key={`${def.id}-label`} textAnchor={def.anchor}>
            <text
              x={def.labelX}
              y={def.labelY}
              fontFamily="IBM Plex Mono, monospace"
              fontSize={10}
              letterSpacing={1.6}
              fill={active ? '#e6f0f7' : '#6f8ca6'}
            >
              {MODULE_META[def.id].short}
            </text>
            <text
              x={def.labelX}
              y={def.labelY + 13}
              fontFamily="IBM Plex Mono, monospace"
              fontSize={9}
              letterSpacing={1.4}
              fill={hex}
              opacity={0.9}
            >
              {STATUS_LABEL[mod.status].toUpperCase()}
            </text>
          </g>
        )
      })}

      {/* survey grid overlay */}
      <g pointerEvents="none" opacity={0.5}>
        <rect x={0} y={0} width={920} height={520} fill="url(#bgrid)" />
      </g>

      {/* center crosshairs */}
      {REGIONS.map((d) => {
        const cx = d.x + d.w / 2
        const cy = d.y + d.h / 2
        return (
          <g key={`${d.id}-cross`} pointerEvents="none" stroke="#24405c" strokeWidth={0.8} opacity={0.85}>
            <path d={`M${cx - 7} ${cy} H${cx - 2} M${cx + 2} ${cy} H${cx + 7} M${cx} ${cy - 7} V${cy - 2} M${cx} ${cy + 2} V${cy + 7}`} />
          </g>
        )
      })}

      {/* drawing frame + edge ticks */}
      <g pointerEvents="none" stroke="#1d3348" strokeWidth={1} fill="none">
        <rect x={0} y={0} width={920} height={520} />
        <path d="M6 26 V6 H26 M894 6 H914 V26 M914 494 V514 H894 M26 514 H6 V494" />
      </g>
      <g pointerEvents="none" stroke="#1d3348" strokeWidth={1}>
        {Array.from({ length: 16 }, (_, i) => i * 60).map((x) => (
          <g key={`tx${x}`}>
            <line x1={x} y1={0} x2={x} y2={4} />
            <line x1={x} y1={520} x2={x} y2={516} />
          </g>
        ))}
        {Array.from({ length: 12 }, (_, i) => i * 48).map((y) => (
          <g key={`ty${y}`}>
            <line x1={0} y1={y} x2={4} y2={y} />
            <line x1={920} y1={y} x2={916} y2={y} />
          </g>
        ))}
      </g>

      {/* sheet data block */}
      <g
        pointerEvents="none"
        fontFamily="IBM Plex Mono, monospace"
        fontSize={8}
        letterSpacing={1.4}
        fill="#3d5a73"
      >
        <text x={14} y={24}>
          BHT-01 · ANTARCTIC DIGITAL TWIN · GRID 40 M
        </text>
      </g>

      {/* north arrow */}
      <g transform="translate(30, 470)" stroke="#3d5a73" strokeWidth={1}>
        <path d="M0 0 L14 0 M7 0 L3 5 M7 0 L11 5" fill="none" />
        <text x={7} y={14} textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize={9} letterSpacing={1} fill="#3d5a73">
          N
        </text>
      </g>
      {/* scale bar */}
      <g transform="translate(760, 466)" stroke="#3d5a73" strokeWidth={1}>
        <line x1={0} y1={0} x2={120} y2={0} />
        <line x1={0} y1={-3} x2={0} y2={3} />
        <line x1={120} y1={-3} x2={120} y2={3} />
        <text x={60} y={14} textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize={9} letterSpacing={1} fill="#3d5a73">
          250 m — ind.
        </text>
      </g>
    </svg>
  )
}