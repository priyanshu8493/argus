import type { ReactNode } from 'react'

export function Panel({
  title,
  sub,
  right,
  children,
  className = '',
  as: Tag = 'section',
  fill = false,
}: {
  title?: string
  sub?: string
  right?: ReactNode
  children: ReactNode
  className?: string
  as?: 'section' | 'div'
  fill?: boolean
}) {
  return (
    <Tag
      className={`border border-line bg-panel/70 backdrop-blur-sm ${fill ? 'flex min-h-0 flex-col' : ''} ${className}`}
    >
      {(title || right) && (
        <header className="flex h-10 shrink-0 items-center justify-between gap-3 border-b border-line-soft px-3.5">
          <div className="min-w-0">
            {title && (
              <h2 className="truncate font-sans text-[13px] font-medium tracking-wide text-ink">
                {title}
              </h2>
            )}
            {sub && (
              <p className="truncate font-mono text-[10px] uppercase tracking-[0.14em] text-slate-dim">
                {sub}
              </p>
            )}
          </div>
          {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
        </header>
      )}
      <div className={`p-3.5 ${fill ? 'flex min-h-0 flex-1 flex-col' : ''}`}>{children}</div>
    </Tag>
  )
}

export function SimTag({ label = 'Simulated' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 border border-line bg-abyss/60 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-slate-dim">
      <span className="h-1 w-1 rounded-full bg-glacial/80" />
      {label}
    </span>
  )
}

export function HexTag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center border border-line bg-abyss/60 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-slate-mid">
      {children}
    </span>
  )
}