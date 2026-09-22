import { createContext } from 'react'
import type { ModuleId, Role, SimState } from '../types'

export interface SimContextValue {
  state: SimState
  setRole: (role: Role) => void
  selectModule: (id: ModuleId | null) => void
  ackAlert: (id: number) => void
  setSatelliteOnline: (online: boolean) => void
  triggerGenFailure: () => void
  resetNominal: () => void
}

export const SimContext = createContext<SimContextValue | null>(null)