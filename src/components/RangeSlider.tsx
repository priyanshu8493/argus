import type { CSSProperties } from 'react'

export function RangeSlider({
  label,
  value,
  unit,
  min,
  max,
  step,
  accentFor,
  onChange,
  tickStep = 10,
}: {
  label: string
  value: number
  unit: string
  min: number
  max: number
  step: number
  accentFor: (v: number) => string
  onChange: (v: number) => void
  tickStep?: number
}) {
  const pct = ((value - min) / (max - min)) * 100
  const accent = accentFor(value)
  const ticks: number[] = []
  for (let t = 0; t <= 100; t += tickStep) ticks.push(t)

  return (
    <div className="border border-line bg-abyss/50 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-dim">{label}</span>
        <span className="flex items-baseline gap-1">
          <span className="font-mono text-[20px] font-medium leading-none tabular-nums" style={{ color: accent }}>
            {value.toFixed(step < 1 ? 1 : 0)}
          </span>
          <span className="font-mono text-[10px] text-slate-dim">{unit}</span>
        </span>
      </div>

      <div className="relative mt-3 h-[22px]">
        <div className="absolute inset-x-0 top-1/2 h-[5px] -translate-y-1/2">
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute top-0 h-full w-px bg-line"
              style={{ left: `calc(${t}% - 0.5px)` }}
            />
          ))}
        </div>
        <div className="absolute inset-x-0 top-1/2 h-[4px] -translate-y-1/2 overflow-hidden border border-line bg-abyss" />
        <div
          className="absolute left-0 top-1/2 h-[4px] -translate-y-1/2"
          style={{ width: `${pct}%`, background: accent }}
        />
        <input
          type="range"
          className="rc-slider absolute inset-0"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ '--thumb-color': accent } as CSSProperties}
          aria-label={label}
        />
      </div>

      <div className="mt-1 flex justify-between font-mono text-[9px] uppercase tracking-[0.1em] text-slate-faint">
        <span>
          {min}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  )
}