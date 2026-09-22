import { Line, LineChart, ReferenceLine, ResponsiveContainer, YAxis } from 'recharts'
import type { Sample } from '../types'

export interface ThresholdMarker {
  y: number
  kind: 'warning' | 'critical'
}

export function TelemetryChart({
  data,
  color,
  markers = [],
  domain,
  height = 84,
}: {
  data: Sample[]
  color: string
  markers?: ThresholdMarker[]
  domain: [number, number]
  height?: number
}) {
  return (
    <div className="-mx-1 w-[calc(100%+8px)]" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 6, right: 4, bottom: 2, left: 4 }}>
          <YAxis hide domain={domain} />
          {markers.map((m, i) => (
            <ReferenceLine
              key={`${m.y}-${i}`}
              y={m.y}
              stroke={m.kind === 'warning' ? '#f5a623' : '#ff5a5f'}
              strokeDasharray={m.kind === 'warning' ? '3 3' : '2 3'}
              strokeOpacity={0.45}
            />
          ))}
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.6}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}