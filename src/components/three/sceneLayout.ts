import type { ModuleId } from '../../types'

export const MODULE_POS: Record<ModuleId, [number, number, number]> = {
  main: [0, 0, 0],
  'fuel-farm': [-95, 0, -20],
  'fuel-station': [-55, 0, 30],
  'pump-house': [128, 0, 40],
  'summer-camp': [-135, 0, -30],
  ageos: [150, 0, -10],
}

export const BEACON_Y: Record<ModuleId, number> = {
  main: 16.5,
  'fuel-farm': 12,
  'fuel-station': 10.6,
  'pump-house': 10,
  'summer-camp': 9.6,
  ageos: 58,
}

export const LABEL_Y: Record<ModuleId, number> = {
  main: 21,
  'fuel-farm': 15,
  'fuel-station': 13,
  'pump-house': 12,
  'summer-camp': 12,
  ageos: 64,
}

export const HIT: Record<ModuleId, { r: number; y: number; h: number }> = {
  main: { r: 52, y: 6, h: 38 },
  'fuel-farm': { r: 42, y: 5, h: 34 },
  'fuel-station': { r: 38, y: 4, h: 28 },
  'pump-house': { r: 30, y: 3.6, h: 24 },
  'summer-camp': { r: 34, y: 4, h: 26 },
  ageos: { r: 34, y: 26, h: 54 },
}

export const WF: Record<ModuleId, { size: [number, number, number]; y: number }> = {
  main: { size: [46.8, 8.6, 22.8], y: 6.2 },
  'fuel-farm': { size: [50, 9.8, 46], y: 5.1 },
  'fuel-station': { size: [26.8, 7.4, 15.7], y: 3.6 },
  'pump-house': { size: [18.8, 6.8, 12.9], y: 3.1 },
  'summer-camp': { size: [25, 8.8, 28], y: 4.4 },
  ageos: { size: [18, 50, 18], y: 27 },
}

export const FOCUS_POINT: Record<FocusKey, [number, number, number]> = {
  site: [0, 0, 0],
  main: MODULE_POS.main,
  'fuel-farm': MODULE_POS['fuel-farm'],
  'fuel-station': MODULE_POS['fuel-station'],
  'pump-house': MODULE_POS['pump-house'],
  'summer-camp': MODULE_POS['summer-camp'],
  ageos: MODULE_POS.ageos,
  jetty: [-22, 0, 50],
}

export const VIEW_DIST: Record<FocusKey, number> = {
  site: 330,
  main: 150,
  'fuel-farm': 155,
  'fuel-station': 150,
  'pump-house': 130,
  'summer-camp': 145,
  ageos: 165,
  jetty: 120,
}

export type FocusKey = 'site' | ModuleId | 'jetty'