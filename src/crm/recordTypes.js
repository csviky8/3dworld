export function toneColor(tone) {
  return { red: '#c9564e', amber: '#d29438', green: '#43886c', blue: '#4d8eae' }[tone] || '#4d8eae'
}

export function recordKind(record) {
  const t = (record?.type || '').toLowerCase()
  if (t.includes('lead')) return 'lead'
  if (t.includes('quot')) return 'quote'
  if (t.includes('contract')) return 'contract'
  if (t.includes('customer') || t.includes('prospect')) return 'customer'
  if (t.includes('service') || t.includes('onboard')) return 'service'
  if (t.includes('ticket') || t.includes('request')) return 'ticket'
  if (t.includes('employ') || t.includes('staff') || t.includes('team')) return 'employee'
  return 'record'
}

export function searchText(record) {
  return `${record?.id || ''} ${record?.name || ''} ${record?.type || ''} ${record?.status || ''} ${record?.summary || ''}`.toLowerCase()
}

export function groupRecords(all) {
  const groups = { customers: [], leads: [], quotes: [], contracts: [], services: [], tickets: [], staff: [] }
  for (const r of all || []) {
    const k = recordKind(r)
    if (k === 'customer') groups.customers.push(r)
    else if (k === 'lead') groups.leads.push(r)
    else if (k === 'quote') groups.quotes.push(r)
    else if (k === 'contract') groups.contracts.push(r)
    else if (k === 'service') groups.services.push(r)
    else if (k === 'ticket') groups.tickets.push(r)
    else if (k === 'employee') groups.staff.push(r)
  }
  return groups
}
