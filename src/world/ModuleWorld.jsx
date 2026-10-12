import {useMemo,useState,useRef} from 'react'
import {Canvas} from '@react-three/fiber'
import {ChevronRight, Home, Search, FileText, ArrowUpRight, X, Users} from 'lucide-react'
import {City} from './RegionWorld.jsx'
import {WORLD_MODULES,moduleGroups,moduleStatus} from '../crm/moduleWorldModel.js'
import {territoryOf,recordKey,kindOf,assignedRecords} from '../crm/worldModel.js'
import './ModuleWorld.css'

const detailValue=(record,pattern)=>(record.details||[]).find(pair=>Array.isArray(pair)&&pattern.test(String(pair[0])))?.[1]

export default function ModuleWorld({module,territory,records,user,onBack,onAustralia,onSwitch,onSelect,controlsRef,resetToken,animated,evening}){
  const labelPortal=useRef(null)
  const config=WORLD_MODULES[module]
  const [status,setStatus]=useState('all'),[search,setSearch]=useState(''),[mine,setMine]=useState(false)
  const regional=useMemo(()=>records.filter(r=>territoryOf(r)===territory&&r.department===module&&!['person','team'].includes(kindOf(r))),[records,territory,module])
  const groups=moduleGroups(regional,module)
  const assigned=assignedRecords(regional,user)
  const visible=(mine?assigned:regional).filter(r=>(status==='all'||moduleStatus(r,module)===status)&&`${r.id} ${r.name} ${r.status} ${(r.details||[]).flat().join(' ')}`.toLowerCase().includes(search.toLowerCase().trim()))
  const current=groups.find(g=>g.id===status)
  const attention=regional.filter(r=>['expiring','renewals','expired','pending'].includes(moduleStatus(r,module)))
  const summaryGroups=groups.filter(g=>g.count>0)
  return <section className={`module-world ${module}`} aria-label={`${territory} ${config.title} 3D world`}>
    <div className='module-scene'><div ref={labelPortal} className='world-label-layer'/><Canvas key={`${module}-${territory}-${resetToken}`} shadows dpr={[1,1.5]} frameloop={animated?'always':'demand'} camera={{position:[35,43,48],fov:43}} fallback={<div className='scene-fallback'>3D is unavailable. Your records remain available in the panel.</div>}><City labelPortal={labelPortal} districts={groups} region={territory} hubTitle={config.title.toUpperCase()} departmentWorld onModule={setStatus} controlsRef={controlsRef} animated={animated} evening={evening}/></Canvas></div>
    <div className='module-heading'><nav aria-label='World breadcrumb'><button onClick={onAustralia}><Home size={13}/> Australia</button><ChevronRight size={12}/><button onClick={onBack}>{territory}</button><ChevronRight size={12}/><span>{config.title}</span></nav><div className='module-kicker'><span/> {territory} · SPECIALIST WORLD</div><h1>{config.title} city</h1><p>{config.subtitle}</p></div>
    <aside className='module-panel' aria-label={`${config.title} workspace`}>
      <div className='module-person'><span>{user.initials||user.name?.slice(0,2)}</span><div><h2>{user.name}</h2><p>{user.title||'CRM workspace'}</p></div><Users size={19}/></div>
      <div className='module-tabs' aria-label='Specialist worlds'>{['contracts','quotes'].filter(id=>user.modules.includes(id)).map(id=><button key={id} aria-pressed={module===id} onClick={()=>onSwitch(id)}>{WORLD_MODULES[id].title}</button>)}</div>
      <div className='module-panel-title'><div><small>{territory} WORKSPACE</small><h2>{current?.label||`All ${config.title.toLowerCase()}`}</h2></div><b>{visible.length}</b></div>
      <label className='module-search'><Search size={15}/><input aria-label={`Search ${config.title.toLowerCase()}`} placeholder={`Search ${config.title.toLowerCase()}…`} value={search} onChange={e=>setSearch(e.target.value)}/>{search&&<button aria-label='Clear module search' onClick={()=>setSearch('')}><X size={14}/></button>}</label>
      <div className='module-filter-row'><select aria-label={`${config.title} status`} value={status} onChange={e=>setStatus(e.target.value)}><option value='all'>All statuses · {regional.length}</option>{groups.map(g=><option value={g.id} key={g.id}>{g.label} · {g.count}</option>)}</select><button className={mine?'active':''} aria-pressed={mine} onClick={()=>setMine(v=>!v)}>My work</button></div>
      <div className='module-records'>
        {visible.length?<table><thead><tr><th>Customer / record</th><th>Status</th></tr></thead><tbody>{visible.map(r=><tr key={recordKey(r)}><td><button onClick={()=>onSelect(r)}><b>{r.name||r.id}</b><small>{r.id}</small><span>{detailValue(r,/^(value|amount|total)$/i)||'Value not supplied'}</span></button></td><td><button className='module-record-status' onClick={()=>onSelect(r)} style={{'--status':groups.find(g=>g.id===moduleStatus(r,module))?.color}}>{r.status||'Not supplied'}<ArrowUpRight size={12}/></button></td></tr>)}</tbody></table>:<div className='module-empty'><FileText size={26}/><h3>No matching records</h3><p>{mine?'No assigned records match this view.':'No loaded records match this status or search.'}</p><button onClick={()=>{setStatus('all');setSearch('');setMine(false)}}>Show all regional records</button></div>}
      </div><p className='module-data-note'>Accessible snapshot · {regional.length} records in {territory}</p>
    </aside>
    <div className='module-bottom'>
      <section className='module-card'><h2><FileText size={16}/>{config.title} overview <b>{regional.length}</b></h2><div className='module-breakdown'>{groups.map(g=><button key={g.id} onClick={()=>setStatus(g.id)} aria-pressed={status===g.id}><i style={{background:g.color}}/><span>{g.label}</span><b>{g.count}</b><span className='module-bar'><i style={{background:g.color,width:`${regional.length?g.count/regional.length*100:0}%`}}/></span></button>)}</div></section>
      <section className='module-card'><h2><FileText size={16}/>{module==='contracts'?'Renewals & pending work':'Quotations to follow up'}</h2><div className='module-attention'>{attention.slice(0,3).map(r=><button key={recordKey(r)} onClick={()=>onSelect(r)}><span><b>{r.name||r.id}</b><small>{r.id} · {r.status}</small></span><ArrowUpRight size={15}/></button>)}{!attention.length&&<p>No matching follow-ups in this snapshot.</p>}</div></section>
      <section className='module-card module-insight'><h2><Users size={16}/>Your regional workspace</h2><strong>{assigned.length}<span>assigned to you</span></strong><p>{summaryGroups.length} status groups contain records. Select a building to explore its records.</p><button onClick={()=>{setMine(true);setStatus('all');setSearch('')}}>Open my {config.title.toLowerCase()} <ArrowUpRight size={14}/></button></section>
    </div>
    <div className='module-orbit-hint'>Drag to orbit · Scroll to zoom · Select a status building</div>
  </section>
}
