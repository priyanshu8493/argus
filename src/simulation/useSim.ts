import { useContext } from 'react'
import { SimContext } from './context'

export function useSim() {
  const ctx = useContext(SimContext)
  if (!ctx) throw new Error('useSim must be used within SimProvider')
  return ctx
}