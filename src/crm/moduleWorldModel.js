export const WORLD_MODULES = {
  contracts: { title: 'Contracts', subtitle: 'Every agreement. One connected world.', groups: [
    {id:'active',label:'Active contracts',color:'#4baf88'},
    {id:'pending',label:'Pending contracts',color:'#d4a353'},
    {id:'expiring',label:'Expiring soon',color:'#ce7667'},
    {id:'completed',label:'Completed',color:'#5c9eb8'},
    {id:'renewals',label:'Renewals',color:'#a482b1'},
    {id:'other',label:'Other statuses',color:'#839789'},
  ]},
  quotes: { title: 'Quotations', subtitle: 'From first proposal to the next opportunity.', groups: [
    {id:'draft',label:'Draft quotations',color:'#8d9faa'},
    {id:'pending',label:'Awaiting response',color:'#d4a353'},
    {id:'accepted',label:'Accepted',color:'#4baf88'},
    {id:'declined',label:'Declined',color:'#ce7667'},
    {id:'expired',label:'Expired',color:'#a482b1'},
    {id:'other',label:'Other statuses',color:'#5c9eb8'},
  ]},
}

// Classify the supplied workflow status only. Missing dates, revenue, activity,
// tasks, or owners must never be fabricated to fill a dashboard.
export function moduleStatus(record, module) {
  const status=String(record.status||'').trim().toLowerCase()
  if(module==='contracts'){
    if(/expir(?:ing|es? soon)/.test(status))return 'expiring'
    if(/renew/.test(status))return 'renewals'
    if(/complet|closed|terminated/.test(status))return 'completed'
    if(/pending|draft|await|signature/.test(status))return 'pending'
    if(/^(active|live|signed|in force)$/.test(status))return 'active'
  }else if(module==='quotes'){
    if(/draft/.test(status))return 'draft'
    if(/declin|reject|lost/.test(status))return 'declined'
    if(/expired/.test(status))return 'expired'
    if(/^(accepted|approved|won|converted)$/.test(status))return 'accepted'
    if(/pending|await|sent|review/.test(status))return 'pending'
  }
  return 'other'
}

export function moduleGroups(records,module){
  return (WORLD_MODULES[module]?.groups||[]).map(group=>({...group,count:records.filter(r=>moduleStatus(r,module)===group.id).length}))
}
