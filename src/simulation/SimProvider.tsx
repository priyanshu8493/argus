import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { SYNC_FLUSH_MS, TICK_MS } from '../constants'
import { initialState, reducer, type SimAction } from './reducer'
import { SimContext, type SimContextValue } from './context'

export function SimProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)

  const queuedRef = useRef(state.queuedPackets)
  const syncingRef = useRef(state.syncing)
  useEffect(() => {
    queuedRef.current = state.queuedPackets
    syncingRef.current = state.syncing
  }, [state])

  useEffect(() => {
    const id = window.setInterval(() => dispatch({ type: 'TICK' } satisfies SimAction), TICK_MS)
    return () => window.clearInterval(id)
  }, [])

  const setSatelliteOnline = useCallback((online: boolean) => {
    if (!online) {
      dispatch({ type: 'SAT_OFFLINE' })
      return
    }
    if (queuedRef.current > 0) {
      dispatch({ type: 'SAT_ONLINE' })
      window.setTimeout(() => {
        if (syncingRef.current) dispatch({ type: 'SYNC_DONE' })
      }, SYNC_FLUSH_MS)
    } else {
      dispatch({ type: 'SAT_ONLINE' })
    }
  }, [])

  const value = useMemo<SimContextValue>(
    () => ({
      state,
      setRole: (role) => dispatch({ type: 'SET_ROLE', role }),
      selectModule: (id) => dispatch({ type: 'SELECT', id }),
      ackAlert: (id) => dispatch({ type: 'ACK', id }),
      setSatelliteOnline,
      triggerGenFailure: () => dispatch({ type: 'GEN_FAIL' }),
      resetNominal: () => dispatch({ type: 'RESET_NOMINAL' }),
    }),
    [state, setSatelliteOnline],
  )

  return <SimContext.Provider value={value}>{children}</SimContext.Provider>
}