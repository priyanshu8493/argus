import type { Status } from '../types'

export const STATUS_HEX: Record<Status, string> = {
  ok: '#4ade80',
  warning: '#f5a623',
  critical: '#ff5a5f',
}

export const STATUS_LABEL: Record<Status, string> = {
  ok: 'Nominal',
  warning: 'Warning',
  critical: 'Critical',
}

export const statusLabelShort: Record<Status, string> = {
  ok: 'OK',
  warning: 'WARN',
  critical: 'CRIT',
}

export const statusDotClass: Record<Status, string> = {
  ok: 'bg-ok',
  warning: 'bg-amber',
  critical: 'bg-crit',
}

export const statusTextClass: Record<Status, string> = {
  ok: 'text-ok',
  warning: 'text-amber',
  critical: 'text-crit',
}

export const statusBorderClass: Record<Status, string> = {
  ok: 'border-ok/50',
  warning: 'border-amber/60',
  critical: 'border-crit/60',
}

export const statusBgClass: Record<Status, string> = {
  ok: 'bg-ok/10',
  warning: 'bg-amber/10',
  critical: 'bg-crit/10',
}