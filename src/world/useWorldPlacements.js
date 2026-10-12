import { useMemo } from 'react'

export function useWorldPlacements(records) {
  return useMemo(() => {
    const out = new Map()
    const lanes = {
      sales: { x: -24, z: -18, dx: 3.1, dz: 2.6, per: 12 },
      quotes: { x: -9, z: -22, dx: 3.1, dz: 2.6, per: 12 },
      contracts: { x: 9, z: -22, dx: 3.1, dz: 2.6, per: 12 },
      customers: { x: -24, z: 18, dx: 3.0, dz: 2.8, per: 14 },
      onboarding: { x: -9, z: 22, dx: 3.1, dz: 2.6, per: 12 },
      support: { x: 9, z: 22, dx: 3.1, dz: 2.6, per: 12 },
      teams: { x: -2, z: 2, dx: 3.4, dz: 2.8, per: 12 },
    }
    const counters = {}
    for (const r of records || []) {
      const lane = lanes[r.department] || lanes.teams
      const n = counters[r.department] || 0
      counters[r.department] = n + 1
      const row = Math.floor(n / lane.per)
      const col = n % lane.per
      out.set(r.id, [lane.x + col * lane.dx, 0.12, lane.z + row * lane.dz])
    }
    return out
  }, [records])
}
