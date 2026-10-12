export async function fetchSession(api) {
  return api('/api/crm/me')
}

export async function fetchWorld(api) {
  return api('/api/crm/world')
}

export async function fetchOrg(api) {
  return api('/api/crm/world/org')
}

export async function searchWorld(api, q) {
  return api(`/api/crm/world/search?q=${encodeURIComponent(q)}`)
}

export async function fetchRecord(api, id) {
  return api(`/api/crm/world/record/${encodeURIComponent(id)}`)
}

export function pickVisibleRecords(world, modules) {
  const all = world?.records || []
  if (!modules?.length) return all
  return all.filter((r) => modules.includes(r.department) || r.department === 'teams' || r.type === 'Team' || r.type === 'Department' || r.type === 'Employee')
}
