export const MODULES = [
  { id: 'customers', label: 'Customers', color: '#bd754b' },
  { id: 'sales', label: 'Leads', color: '#4f87b0' },
  { id: 'quotes', label: 'Quotes', color: '#b99a4e' },
  { id: 'contracts', label: 'Contracts', color: '#647d65' },
  { id: 'onboarding', label: 'Onboarding & services', color: '#458e87' },
  { id: 'support', label: 'Tickets', color: '#9872a3' },
  { id: 'contacts', label: 'Contacts', color: '#8a8572' },
  { id: 'teams', label: 'People & teams', color: '#517b79' },
]

export const TERRITORIES = [
  { id: 'WA', name: 'Western Australia', position: [-29, 0, 1], color: '#c59c70', label: [-32, -10] },
  { id: 'NT', name: 'Northern Territory', position: [-5, 0, -23], color: '#bd895e', label: [-7, -31] },
  { id: 'QLD', name: 'Queensland', position: [24, 0, -13], color: '#8caa74', label: [25, -23] },
  { id: 'SA', name: 'South Australia', position: [-6, 0, 18], color: '#b5aa7b', label: [-14, 14] },
  { id: 'NSW', name: 'New South Wales', position: [27, 0, 17], color: '#80a280', label: [34, 11] },
  { id: 'VIC', name: 'Victoria', position: [18, 0, 29], color: '#7e9e79', label: [16, 32] },
  { id: 'ACT', name: 'Australian Capital Territory', position: [33, 0, 24], color: '#91a58a', label: [39, 25] },
  { id: 'TAS', name: 'Tasmania', position: [20, 0, 45], color: '#7a9b75', label: [21, 51] },
  { id: 'UNASSIGNED', name: 'Unassigned precinct', position: [1, 0, 11], color: '#e0be7a', label: [0, 24] },
]

const aliases = new Map(TERRITORIES.flatMap((t) => [[t.id.toLowerCase(), t.id], [t.name.toLowerCase(), t.id]]))

// Only explicit geographic fields count. In this API `state_name` can mean
// workflow status, and an owner's name/record ID is never a geographic signal.
export function territoryOf(record) {
  const location = record.location && typeof record.location === 'object' ? record.location : {}
  const address = record.address && typeof record.address === 'object' ? record.address : {}
  const values = [record.state_code, record.australian_state, record.territory_code, record.territory, record.state, location.state_code, location.state, address.state]
  for (const value of values) {
    if (typeof value !== 'string') continue
    const id = aliases.get(value.trim().toLowerCase())
    if (id) return id
  }
  return 'UNASSIGNED'
}

export function kindOf(record) {
  const type = String(record.type || '').toLowerCase()
  if (/employee|staff|member/.test(type)) return 'person'
  if (/team|department/.test(type)) return 'team'
  if (/contact/.test(type)) return 'contact'
  if (/customer|prospect|company/.test(type)) return 'customer'
  if (/quot/.test(type)) return 'quote'
  if (/lead/.test(type)) return 'lead'
  if (/contract/.test(type)) return 'contract'
  if (/ticket|request/.test(type)) return 'ticket'
  if (/service|onboard/.test(type)) return 'service'
  return 'record'
}

export function buildingKind(record) {
  if (kindOf(record) === 'customer') return 'company'
  if (kindOf(record) === 'service') return 'gateway'
  if (kindOf(record) === 'person') {
    const role = roleOf(record).toLowerCase()
    if (/admin/.test(role)) return 'office'
    if (/leader|head|manager/.test(role)) return 'leader'
    return 'house'
  }
  return 'office'
}

export function roleOf(record) {
  // The existing teams endpoint explicitly puts getDesignation in summary.
  const value = record.role?.name || record.role || record.designation || (kindOf(record) === 'person' ? record.summary : '')
  return typeof value === 'string' && value.trim() ? value.trim() : 'Role not supplied'
}

export function assignedTo(record, person, allowName = true) {
  if (!person || ['person','team'].includes(kindOf(record))) return false
  const id = String(person.id || '').replace(/^EMP-/, '')
  const explicitIds = [record.owner_id, record.assigned_to_id, record.account_manager_id].filter(value => value !== undefined && value !== null && value !== '')
  if (explicitIds.length) return explicitIds.some(value => String(value) === id)
  // Match designated ownership fields only; never infer from mentions in names,
  // free text, or the creator of a quotation/contract.
  const name = String(person.name || '').trim().toLowerCase()
  if (!name || !allowName) return false
  return (record.details || []).some(([label,value]) => /^(owner|assigned|assigned to|account manager)$/i.test(String(label).trim()) && String(value).trim().toLowerCase() === name)
}

export function assignedRecords(records, person) {
  const name=String(person?.name||'').trim().toLowerCase()
  const sameNames=records.filter(r=>kindOf(r)==='person'&&String(r.name||'').trim().toLowerCase()===name)
  return records.filter(r=>assignedTo(r,person,sameNames.length<=1))
}

export function workspaceRecords(records, view, user) {
  if (view === 'mine') return mergeRecords(assignedRecords(records,user), records.filter(r=>kindOf(r)==='person' && String(r.id)===`EMP-${user?.id}`))
  if (view === 'people') return records.filter(r=>['person','team'].includes(kindOf(r)))
  if (view === 'customers') return records.filter(r=>kindOf(r)==='customer')
  if (view === 'attention') return records.filter(r=>['red','amber'].includes(r.tone) && !['person','team'].includes(kindOf(r)))
  return records
}

export function sceneSample(records, limit=48) {
  const groups = new Map()
  for (const record of records) {
    const key=kindOf(record)
    if(!groups.has(key))groups.set(key,[])
    groups.get(key).push(record)
  }
  const result=[]
  for(let i=0;result.length<Math.min(limit,records.length);i++){
    for(const rows of groups.values())if(rows[i]&&result.length<limit)result.push(rows[i])
  }
  return result
}

export function recordKey(record) { return `${record.type || 'Record'}:${record.id}` }
export function mergeRecords(...groups) {
  const map = new Map()
  for (const record of groups.flat()) {
    if (!record || !record.id || !record.type) continue
    const key = recordKey(record)
    const previous = map.get(key)
    const details = new Map([...(previous?.details || []), ...(record.details || [])])
    map.set(key, { ...previous, ...record, details: [...details] })
  }
  return [...map.values()]
}

// The API remains the authority. This additional client filter never grants
// access based on a chosen demo role or a visual district.
export function permitted(record, user) {
  return !!user && (user.modules || []).includes(record.department)
}

export function searchable(record) {
  return [record.id, record.name, record.type, record.status, record.summary, territoryOf(record), ...(record.details || []).flat()].join(' ').toLowerCase()
}

export function filterRecords(records, { query = '', module = 'all', territory = 'all' } = {}) {
  const term = query.trim().toLowerCase()
  return records.filter((r) => (module === 'all' || r.department === module) && (territory === 'all' || territoryOf(r) === territory) && (!term || searchable(r).includes(term)))
}

export function placementsFor(records) {
  const counts = {}
  return new Map(records.map((record) => {
    const territory = territoryOf(record)
    const district = TERRITORIES.find((t) => t.id === territory)
    const index = counts[territory] || 0
    counts[territory] = index + 1
    const columns = territory === 'UNASSIGNED' ? 8 : 5
    const spacing = territory === 'UNASSIGNED' ? 2.1 : 2.5
    return [recordKey(record), [district.position[0] + ((index % columns) - (columns - 1) / 2) * spacing, 0.55, district.position[2] + Math.floor(index / columns) * 2.6]]
  }))
}

export function cameraZoom(controls, closer) {
  if (!controls) return
  // three-stdlib multiplies radius in dollyIn, so its scale must be < 1.
  if (closer) controls.dollyIn(1 / 1.2)
  else controls.dollyOut(1 / 1.2)
  controls.update()
}

// Organisational departments are supplied by team records, never inferred from CRM modules.
export function teamDepartments(records) {
  const groups = new Map()
  for (const record of records) {
    if (kindOf(record) !== 'team') continue
    const value = record.details?.find(([label]) => String(label).toLowerCase() === 'department')?.[1]
    if (typeof value !== 'string' || !value.trim() || ['-', '—', 'n/a', 'unknown'].includes(value.trim().toLowerCase())) continue
    const name = value.trim(), key = name.toLowerCase()
    if (!groups.has(key)) groups.set(key, { name, records: [] })
    groups.get(key).records.push(record)
  }
  return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name))
}
