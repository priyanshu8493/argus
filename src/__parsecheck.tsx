import { Activity, Fuel, Gauge } from 'lucide-react'
import type { ReactNode } from 'react'
export function C({ icon }: { icon?: ReactNode }) { return <div>{icon}</div> }
function Block() {
  return (
    <>
      <C icon={<Activity size={13} className="text-glacial" />} />
      <C icon={<Gauge size={13} className="text-glacial" />} />
      <C icon={<Fuel size={13} className="text-glacial" />} />
    </>
  )
}
export { Block }
