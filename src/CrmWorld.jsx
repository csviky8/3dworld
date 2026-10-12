import { Component, lazy, Suspense, useEffect, useMemo, useRef, useState  } from 'react'
import { ArrowRight, ArrowUpRight, Building2, Check, ChevronRight, Compass, FileText, Globe2, Headset, Home, Info, Layers, LoaderCircle, LogOut, Mail, MapPin, Minus, Moon, Pause, Play, Plus, RefreshCw, Search, ShieldCheck, Sun, Users, X  } from 'lucide-react'
import { Canvas  } from '@react-three/fiber'
import { getMetawebCustomer360, getMetawebRecord, getMetawebSession, getMetawebTeams, getMetawebWorld, liveAuthEnabled, logoutFromMetaweb, requestMetawebOtp, searchMetawebWorld, verifyMetawebOtp  } from './metawebApi.js'
import { assignedRecords, cameraZoom, filterRecords, kindOf, mergeRecords, MODULES, permitted, placementsFor, recordKey, roleOf, sceneSample, teamDepartments, TERRITORIES, territoryOf, workspaceRecords  } from './crm/worldModel.js'
import { demoRecords, demoUser  } from './crm/demoData.js'
import './CrmWorld.css'
import WorldOverview from './world/WorldOverview.jsx'

const ModuleWorld = lazy(() => import('./world/ModuleWorld.jsx'))
const RegionWorld = lazy(() => import('./world/RegionWorld.jsx'))
const ExploreScene = lazy(() => import('./world/WelcomeScene.jsx'))
const WelcomeScene = lazy(() => import('./world/WelcomeScene.jsx'))
const icons = { customers: Building2, sales: ArrowUpRight, quotes: FileText, contracts: ShieldCheck, onboarding: Layers, support: Headset, contacts: Users, teams: Users  }
const emptyDetail = { key: null, loading: false, record: null, related: [], error: ''  }

class SceneBoundary extends Component {
  state = { failed: false  }
  static getDerivedStateFromError() { return { failed: true  }  }
  render() {
    if (this.state.failed) return <div className='scene-fallback'><Globe2 size={36 }/><h2>The world needs WebGL</h2><p>Your CRM directory and record panels are still available. Try a browser with hardware acceleration to explore the 3D map.</p></div>
    return this.props.children
   }
 }

function Brand() {
  return <div className='brand'><span className='brand-icon'><Globe2 size={23 }/></span><span>META<b>WEB</b><small>AUSTRALIAN CRM WORLD</small></span></div>
 }

function RecordRow({ record, active, onSelect  }) {
  const Icon = icons[record.department] || FileText
  return <button className={`record-row ${active?'is-selected':'' }` } onClick={()=>onSelect(record) }><span className={`record-icon ${record.department }` }><Icon size={16 }/></span><span className='row-copy'><b>{record.name || record.id }</b><small>{record.id } <span>· {record.type }</span></small></span><ChevronRight size={13 }/></button>
 }

async function fetchSnapshot(signal) {
  const options = { signal  }
  const session = await getMetawebSession(options)
  const world = await getMetawebWorld(options)
  if (!session.user || !Array.isArray(world.records)) throw new Error('The CRM snapshot is incomplete. Please try again.')
  const user = { ...session.user, ...world.user, modules: world.user?.modules || session.user.modules || []  }
  let teams = [], warning = ''
  if (user.modules.includes('teams')) {
    try { const response = await getMetawebTeams(options); teams = response.records || []  }
    catch (error) { if (error.name==='AbortError'||error.status===401) throw error; warning = 'Team directory could not be loaded. Refresh to retry.'  }
   }
  const records=mergeRecords(world.records, teams).filter(r=>permitted(r,user)).map(r=>{
    if(kindOf(r)==='person'&&String(r.id)===`EMP-${user.id }`)return {...r,summary:user.title,status:'Signed in',details:[...(r.details||[]).filter(([label])=>label!=='Role'),['Role',user.title]] }
    return r
   })
  return { user, records, metrics: world.metrics || { }, warning, loadedAt: new Date(), demo: false  }
 }

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function Login({ checking, error, busy, email, setEmail, otp, setOtp, otpSent, setOtpSent, onSubmit, onResend, onDemo }) {
  const [localError, setLocalError] = useState('')
  const [touched, setTouched] = useState({ email: false, otp: false })
  const emailRef = useRef(null)
  const otpRef = useRef(null)

  const emailValue = String(email || '').trim()
  const otpValue = String(otp || '').replace(/\D/g, '')
  const emailLooksValid = EMAIL_PATTERN.test(emailValue)
  const otpLooksValid = otpValue.length === 6

  useEffect(() => { if (otpSent && otpRef.current) otpRef.current.focus() }, [otpSent])

  function handleEmailChange(value) {
    setEmail(value)
    if (localError) setLocalError('')
   }

  function handleOtpChange(value) {
    setOtp(value.replace(/\D/g, '').slice(0, 6))
    if (localError) setLocalError('')
   }

  function validate() {
    if (!otpSent) {
      if (!emailValue) { setLocalError('Enter your work email to receive a sign-in code.'); emailRef.current?.focus(); return false }
      if (!emailLooksValid) { setLocalError('That email address does not look valid. Please check it and try again.'); emailRef.current?.focus(); return false }
     } else {
      if (!otpValue) { setLocalError('Enter the 6-digit code from your email.'); otpRef.current?.focus(); return false }
      if (!otpLooksValid) { setLocalError('The sign-in code is exactly 6 digits.'); otpRef.current?.focus(); return false }
     }
    setLocalError('')
    return true
   }

  function handleSubmit(event) {
    event.preventDefault()
    if (busy || checking) return
    setTouched({ email: true, otp: true })
    if (!validate()) return
    onSubmit(event)
   }

  function backToEmail(event) {
    event.preventDefault()
    setOtpSent(false); setOtp(''); setLocalError(''); setTouched({ email: false, otp: false })
    requestAnimationFrame(() => emailRef.current?.focus())
   }

  const message = localError || error

  if (checking) return (
    <div className='welcome-overlay' aria-busy='true'>
      <div className='welcome-card is-checking'>
        <span className='welcome-mark'><Globe2 size={26 }/></span>
        <h1>Opening your world</h1>
        <p className='welcome-copy'>Restoring your secure session…</p>
        <span className='welcome-progress'><LoaderCircle className='spin' size={18 }/> Checking sign-in…</span>
      </div>
     </div>
   )

  return (
    <div className='welcome-overlay'>
      <form className='welcome-card' onSubmit={handleSubmit} noValidate aria-labelledby='welcome-title'>
        <span className='eyebrow'><span className='status-dot'/> SECURE SIGN IN</span>
        <h1 id='welcome-title'>{otpSent ? 'Enter your sign-in code' : 'Sign in to the Australian CRM world' }</h1>
        <p className='welcome-copy'>
          {otpSent
            ? <>We emailed a 6-digit code to <b>{emailValue }</b>. It expires in 5 minutes.</>
            : 'Use your work email and we will send you a one-time sign-in code. No password required.'}
         </p>

        <div className='welcome-fields'>
          {!otpSent ? (
            <label className={`welcome-field ${touched.email && !emailLooksValid && emailValue ? 'has-error' : '' }`}>
              <span>Work email</span>
              <span className='welcome-input'>
                <Mail size={15 }/>
                <input ref={emailRef } type='email' inputMode='email' autoComplete='email' spellCheck='false'
                  placeholder='name@metaweb.net.au' value={email } disabled={busy }
                  aria-label='Work email'
                  onChange={e=>handleEmailChange(e.target.value) }
                  onBlur={()=>setTouched(t=>({ ...t, email: true })) }/>
               </span>
             </label>
           ) : (
            <label className={`welcome-field ${touched.otp && !otpLooksValid && otpValue ? 'has-error' : '' }`}>
              <span>6-digit code</span>
              <span className='welcome-input'>
                <ShieldCheck size={15 }/>
                <input ref={otpRef } className='otp-input' type='text' inputMode='numeric' autoComplete='one-time-code'
                  maxLength={6 } placeholder='000000' value={otp } disabled={busy }
                  aria-label='6-digit sign-in code'
                  onChange={e=>handleOtpChange(e.target.value) }
                  onBlur={()=>setTouched(t=>({ ...t, otp: true })) }/>
               </span>
             </label>
           )}
         </div>

        {message && <p className='welcome-error' role='alert'><Info size={14 }/>{message }</p> }

        <button className='primary-button welcome-submit' type='submit' disabled={busy || checking }>
          {busy ? <><LoaderCircle className='spin' size={16 }/>{otpSent ? 'Verifying…' : 'Sending code…' }</>
                : <>{otpSent ? 'Sign in' : 'Email me a sign-in code' }<ArrowRight size={16 }/></>}
         </button>

        <div className='welcome-links'>
          {otpSent && <button type='button' className='text-button' onClick={onResend } disabled={busy }>Resend code</button> }
          {otpSent && <button type='button' className='text-button' onClick={backToEmail } disabled={busy }>Use a different email</button> }
          {onDemo && <button type='button' className='text-button welcome-demo' onClick={onDemo } disabled={busy }>Explore the demo world</button> }
         </div>

        <p className='welcome-note'><ShieldCheck size={13 }/> Codes are single-use and expire in 5 minutes. Staff access only.</p>
      </form>
     </div>
   )
}

export default function CrmWorld() {
  const [snapshot,setSnapshot]=useState(null)
  const [checking,setChecking]=useState(liveAuthEnabled)
  const [authError,setAuthError]=useState('')
  const [busy,setBusy]=useState(false)
  const [email,setEmail]=useState('')
  const [otp,setOtp]=useState('')
  const [otpSent,setOtpSent]=useState(false)
  const [query,setQuery]=useState('')
  const [module,setModule]=useState('all')
  const [workspace,setWorkspace]=useState('all')
  const [territory,setTerritory]=useState('all')
  const [selected,setSelected]=useState(null)
  const [detail,setDetail]=useState(emptyDetail)
  const [detailRetry,setDetailRetry]=useState(0)
  const [search,setSearch]=useState({term:'',records:[],loading:false,error:'' })
  const [refreshing,setRefreshing]=useState(false)
  const [notice,setNotice]=useState('')
  const [showHelp,setShowHelp]=useState(false)
  const [directoryOpen,setDirectoryOpen]=useState(false)
  const [sceneMode,setSceneMode]=useState('image')
  const [moduleWorld,setModuleWorld]=useState(null)
  const [animated,setAnimated]=useState(()=>!window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [evening,setEvening]=useState(false)
  const [cameraTarget,setCameraTarget]=useState(null)
  const [resetToken,setResetToken]=useState(0)
  const guideRef=useRef(null)
  const controlsRef=useRef(null), snapshotRequest=useRef(null), searchInput=useRef(null)
  const sessionEpoch=useRef(0)
  const [orgDepartment,setOrgDepartment]=useState('')
  const user=snapshot?.user
  const WorldScene=snapshot?ExploreScene:WelcomeScene
  const live=!!snapshot&&!snapshot.demo
  useEffect(()=>{if(directoryOpen)searchInput.current?.focus()},[directoryOpen])

  useEffect(()=>{
    if(!liveAuthEnabled)return undefined
    const controller=new AbortController();snapshotRequest.current=controller
    fetchSnapshot(controller.signal).then(next=>{if(!controller.signal.aborted)setSnapshot(next) }).catch(error=>{
      if(error.name!=='AbortError'&&error.status!==401)setAuthError(error.message)
     }).finally(()=>{if(!controller.signal.aborted)setChecking(false) })
    return ()=>controller.abort()
   },[])

  useEffect(()=>{
    if(!showHelp)return undefined
    const previous=document.activeElement
    const element=guideRef.current
    const focusable=()=>[...element.querySelectorAll('button, a, input, select, [tabindex="0"]')].filter(el=>!el.disabled)
    focusable()[0]?.focus()
    const trap=e=>{
      if(e.key!=='Tab')return
      const items=focusable(),first=items[0],last=items.at(-1)
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus() }
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus() }
     }
    element.addEventListener('keydown',trap)
    return ()=>{element.removeEventListener('keydown',trap);previous?.focus() }
   },[showHelp])

  useEffect(()=>{
    const media=window.matchMedia('(max-width: 800px)')
    const change=()=>{if(media.matches&&selected)setDirectoryOpen(false) }
    media.addEventListener('change',change)
    return ()=>media.removeEventListener('change',change)
   },[selected])

  useEffect(()=>{
    const handler=e=>{
      if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)){e.preventDefault();setDirectoryOpen(true);searchInput.current?.focus() }
      if(e.key==='Escape'){setShowHelp(false);setSelected(null) }
     }
    window.addEventListener('keydown',handler)
    return ()=>window.removeEventListener('keydown',handler)
   },[])

  useEffect(()=>{
    if(!live||query.trim().length<2)return undefined
    const controller=new AbortController(),term=query.trim(),epoch=sessionEpoch.current
    const timer=setTimeout(()=>{
      setSearch({term,records:[],loading:true,error:'' })
      searchMetawebWorld(term,{signal:controller.signal }).then(p=>{
        if(!controller.signal.aborted&&epoch===sessionEpoch.current)setSearch({term,records:(p.records||[]).filter(r=>permitted(r,user)),loading:false,error:'' })
       }).catch(error=>{
        if(controller.signal.aborted||epoch!==sessionEpoch.current)return
        if(error.status===401){sessionEpoch.current++;snapshotRequest.current?.abort();setSnapshot(null);setSelected(null);setDetail(emptyDetail);setSearch({term:'',records:[],loading:false,error:'' });setAuthError('Your session has expired. Please sign in again.') }
        else setSearch({term,records:[],loading:false,error:'Search could not reach the CRM. Showing matching loaded records.' })
       })
     },300)
    return ()=>{clearTimeout(timer);controller.abort() }
   },[query,live,user])

  useEffect(()=>{
    if(!selected||!live||['person','team'].includes(kindOf(selected)))return undefined
    const controller=new AbortController(),key=recordKey(selected),epoch=sessionEpoch.current
    const load=kindOf(selected)==='customer'?getMetawebCustomer360:getMetawebRecord
    load(selected.id,{signal:controller.signal }).then(p=>{
      if(controller.signal.aborted||epoch!==sessionEpoch.current)return
      setDetail({key,loading:false,record:p.record||selected,related:(p.related||[]).filter(r=>permitted(r,user)),error:'' })
     }).catch(error=>{
      if(controller.signal.aborted||epoch!==sessionEpoch.current)return
      if(error.status===401){sessionEpoch.current++;snapshotRequest.current?.abort();setSnapshot(null);setSelected(null);setDetail(emptyDetail);setSearch({term:'',records:[],loading:false,error:'' });setAuthError('Your session has expired. Please sign in again.') }
      else setDetail({key,loading:false,record:null,related:[],error:error.status===404?'This record is outside the detail endpoint’s current snapshot. Its loaded summary is shown below.':error.message })
     })
    return ()=>controller.abort()
   },[selected,live,user,detailRetry])

  const allRecords=snapshot?.records||[]
  const currentSearch=search.term===query.trim()?search:null
  const browsable=mergeRecords(allRecords,currentSearch?.records||[])
  const scoped=workspaceRecords(browsable,workspace,user)
  const departments=teamDepartments(allRecords)
  const departmentRecords=orgDepartment?departments.find(d=>d.name===orgDepartment)?.records||[]:null
  const filtered=filterRecords(departmentRecords||scoped,{query,module,territory })
  const unassigned=allRecords.filter(r=>territoryOf(r)==='UNASSIGNED').length
  const sceneRecords=useMemo(()=>{
    const candidates=snapshot?filterRecords(orgDepartment?(teamDepartments(snapshot.records).find(d=>d.name===orgDepartment)?.records||[]):workspaceRecords(snapshot.records,workspace,snapshot.user),{module,territory,query }):[]
    const first=sceneSample(candidates)
    if(selected&&!first.some(r=>recordKey(r)===recordKey(selected)))first.push(selected)
    return first
   },[snapshot,module,territory,query,workspace,selected,orgDepartment])
  const placements=useMemo(()=>placementsFor(sceneRecords),[sceneRecords])
  const selectedDetail=selected&&detail.key===recordKey(selected)?detail:null
  const displayRecord=selected?{...selected,...selectedDetail?.record }:null
  const linkedRecords=selected?(selected.links||[]).map(id=>allRecords.find(r=>r.id===id)).filter(Boolean):[]
  const related=selected&&kindOf(selected)==='person'?assignedRecords(allRecords,selected):mergeRecords(linkedRecords,selectedDetail?.related||[])
  const activeTerritory=TERRITORIES.find(t=>t.id===territory)

  function clearWorkspace() {
    setModuleWorld(null)
    setSceneMode('image');setDirectoryOpen(false)
    setOrgDepartment('')
    sessionEpoch.current++;snapshotRequest.current?.abort();setSnapshot(null);setSelected(null);setDetail(emptyDetail);setSearch({term:'',records:[],loading:false,error:'' });setQuery('');setModule('all');setWorkspace('all');setTerritory('all');setNotice('');setOtp('');setOtpSent(false);setCameraTarget(null);setResetToken(v=>v+1)
   }

  function enterDemo() {
    clearWorkspace();setSnapshot({user:demoUser,records:demoRecords,metrics:{ },demo:true,loadedAt:new Date(),warning:'' });setChecking(false);setAuthError('')
   }

  async function submitLogin(e) {
    e.preventDefault();setBusy(true);setAuthError('')
    try{
      if(!otpSent){await requestMetawebOtp(email);setOtpSent(true);setOtp('') }
      else{
        await verifyMetawebOtp(email,otp)
        const controller=new AbortController();snapshotRequest.current=controller
        const next=await fetchSnapshot(controller.signal)
        sessionEpoch.current++;setSnapshot(next);setOtp('');setOtpSent(false)
       }
     }catch(error){if(error.name!=='AbortError')setAuthError(error.message) }finally{setBusy(false) }
   }

  async function resend() {
    setBusy(true);setAuthError('')
    try{await requestMetawebOtp(email);setOtp('') }catch(error){setAuthError(error.message) }finally{setBusy(false) }
   }

  async function refresh() {
    if(!live||refreshing)return
    const controller=new AbortController();snapshotRequest.current?.abort();snapshotRequest.current=controller
    setRefreshing(true);setNotice('')
    try{
      const next=await fetchSnapshot(controller.signal)
      if(controller.signal.aborted)return
      setSnapshot(next);setSelected(null);setDetail(emptyDetail);setSearch({term:'',records:[],loading:false,error:'' })
     }catch(error){
      if(error.name==='AbortError')return
      if(error.status===401){clearWorkspace();setAuthError('Your session has expired. Please sign in again.') }
      else setNotice(`Refresh failed. Your previous snapshot is still shown. ${error.message }`)
     }finally{setRefreshing(false) }
   }

  async function signOut() {
    setBusy(true);setNotice('')
    try{if(live)await logoutFromMetaweb();clearWorkspace() }
    catch(error){if(error.status===401)clearWorkspace();else setNotice(`Could not confirm sign-out. Please try again. ${error.message }`) }
    finally{setBusy(false) }
   }

  function choose(record) {
    if(!permitted(record,user))return
    setSelected(record);setDetail({key:recordKey(record),loading:live&&!['person','team'].includes(kindOf(record)),record:null,related:[],error:'' })
    const nextSample=sceneSample(filterRecords(orgDepartment?(teamDepartments(snapshot.records).find(d=>d.name===orgDepartment)?.records||[]):workspaceRecords(snapshot.records,workspace,snapshot.user),{module,territory,query }))
    if(!nextSample.some(r=>recordKey(r)===recordKey(record)))nextSample.push(record)
    const pos=placementsFor(nextSample).get(recordKey(record))
    setCameraTarget([pos[0],1,pos[2]])
    if(window.matchMedia('(max-width: 800px)').matches)setDirectoryOpen(false)
   }

  function changeWorkspace(view) {
    setModuleWorld(null)
    setOrgDepartment('');setWorkspace(view);setSelected(null);setModule('all');setQuery('');setTerritory('all');setCameraTarget(null);setResetToken(v=>v+1)
   }

  function chooseTerritory(id) {
    if(!snapshot)return
    setModuleWorld(null)
    setTerritory(id);setSelected(null);setModule('all');setQuery('');setOrgDepartment('');setWorkspace('all');setDirectoryOpen(false)
    if(id==='all')setSceneMode('image')
    if(id==='all'){setCameraTarget(null);setResetToken(v=>v+1) }
    else setCameraTarget([...TERRITORIES.find(t=>t.id===id).position])
   }

  function openModuleWorld(id) {
    if(!user.modules.includes(id)&&id!=='all')return
    setModule(id);setWorkspace('all');setOrgDepartment('');setQuery('');setSelected(null)
    if(['contracts','quotes'].includes(id)){setModuleWorld(id);setDirectoryOpen(false)}
    else {setModuleWorld(null);setDirectoryOpen(true)}
  }

  const totalInScope=Object.values(snapshot?.metrics||{ }).filter(v=>Number.isFinite(Number(v))).reduce((sum,v)=>sum+Number(v),0)

  return <main className={`crm-app ${!snapshot?'welcome-mode':''} ${directoryOpen?'directory-visible':''} ${snapshot&&territory!=='all'?'regional-world':''} ${snapshot&&moduleWorld&&territory!=='all'?'specialist-world':''} ${snapshot&&territory==='all'&&sceneMode==='image'?'image-world':''}`}>
    <div className='world-canvas'>{snapshot&&territory!=='all'?<SceneBoundary><Suspense fallback={<div className='scene-loading'>Building your regional world…</div>}>{moduleWorld?<ModuleWorld key={`${territory}-${moduleWorld}`} module={moduleWorld} territory={territory} records={allRecords} user={user} onBack={()=>chooseTerritory(territory)} onAustralia={()=>chooseTerritory('all')} onSwitch={openModuleWorld} onSelect={choose} controlsRef={controlsRef} resetToken={resetToken} animated={animated} evening={evening}/>:<RegionWorld territory={territory} records={allRecords} user={user} onBack={()=>chooseTerritory('all')} onModule={openModuleWorld} controlsRef={controlsRef} resetToken={resetToken} animated={animated} evening={evening}/>}</Suspense></SceneBoundary>:snapshot&&sceneMode==='image'?<WorldOverview territory={territory} onTerritory={chooseTerritory} controlsRef={controlsRef} resetToken={resetToken}/>:<SceneBoundary><Suspense fallback={<div className='scene-loading'><LoaderCircle className='spin'/> Building your world…</div> }><Canvas shadows frameloop={snapshot?'demand':animated?'always':'demand' } dpr={[1,1.5] } camera={{position:[96,112,128],fov:38,near:.1,far:1500 } } gl={{antialias:true,powerPreference:'high-performance' } } fallback={<div className='scene-fallback'>3D is unavailable. Use the record directory to continue.</div> }><WorldScene allRecords={allRecords } records={sceneRecords } placements={placements } selectedKey={selected?recordKey(selected):null } territory={territory } onSelect={choose } onTerritory={chooseTerritory } controlsRef={controlsRef } cameraTarget={cameraTarget } resetToken={resetToken } user={user } animated={animated } evening={evening }/></Canvas></Suspense></SceneBoundary>}</div>
    <header className='topbar'><Brand/><div className='header-center'><span className='country-mark'>AU</span><span>Australia <span className='muted'>/</span> {snapshot?user.name+' · '+(user.title||'CRM workspace'):'A world of relationships' }</span></div><div className='header-actions'>
      {snapshot&&<span className={`mode-badge ${snapshot.demo?'demo':'' }` }><i/>{snapshot.demo?'DEMO WORLD':'LIVE API SNAPSHOT' }</span> }
      <button className='icon-button help-button' title='About this world' aria-label='About this world' onClick={()=>setShowHelp(true) }><Info size={18 }/></button>
      {snapshot&&<><span className='account-avatar' title={`${user.name } · ${user.title }` }>{user.initials||user.name?.slice(0,2) }</span><button className='icon-button' onClick={signOut } disabled={busy } title={snapshot.demo?'Leave demo':'Sign out' } aria-label={snapshot.demo?'Leave demo':'Sign out' }><LogOut size={17 }/></button></> }
    </div></header>
    {!snapshot?<Login checking={checking } error={authError } busy={busy } email={email } setEmail={setEmail } otp={otp } setOtp={setOtp } otpSent={otpSent } setOtpSent={setOtpSent } onSubmit={submitLogin } onResend={resend } onDemo={enterDemo }/>:<>
      <button className='directory-toggle' onClick={()=>setDirectoryOpen(v=>!v) } aria-expanded={directoryOpen } aria-controls='record-directory'><Search size={16 }/>{directoryOpen?'Hide directory':'Find a record' }</button>
      <aside className={`directory ${directoryOpen?'open':'' }` } id='record-directory'>
        <div className='workspace-tabs' aria-label='Workspace views'>{[['all','Overview'],['mine','My work'],['people','People'],['customers','Customers'],['attention','Attention']].map(([id,label])=><button key={id } aria-pressed={workspace===id } className={workspace===id?'active':'' } onClick={()=>changeWorkspace(id) }>{label }</button>) }</div><div className='directory-title'><div><span className='eyebrow'>YOUR WORKSPACE</span><h1>{({all:'Your connected world',mine:'My work',people:'People & teams',customers:'Customer accounts',attention:'Needs attention' })[workspace] }</h1></div><span className='directory-count'>{scoped.length }</span></div>
        <label className='search-field'><Search size={17 }/><input ref={searchInput } aria-label='Search CRM records' value={query } onChange={e=>setQuery(e.target.value) } placeholder='Search name, code or owner…'/>{query?<button aria-label='Clear search' onClick={()=>setQuery('') }><X size={14 }/></button>:<kbd>/</kbd> }</label>
        <div className='directory-filters'><label>Record type<select value={module } onChange={e=>{setModule(e.target.value);setSelected(null) } }><option value='all'>All record types</option>{MODULES.map(m=><option key={m.id } value={m.id } disabled={!user.modules.includes(m.id) }>{m.label }{!user.modules.includes(m.id)?' · unavailable':'' }</option>) }</select></label><label>Location<select value={territory } onChange={e=>chooseTerritory(e.target.value) }><option value='all'>All Australia</option>{TERRITORIES.map(t=><option key={t.id } value={t.id }>{t.id==='UNASSIGNED'?'Unassigned':`${t.id } · ${t.name }` }</option>) }</select></label></div>
        {workspace==='people'&&departments.length>0&&<label className='department-filter'>Department · known teams<select aria-label='Department' value={orgDepartment } onChange={e=>{setOrgDepartment(e.target.value);setSelected(null);setQuery('');setTerritory('all');setCameraTarget(null);setResetToken(v=>v+1) } }><option value=''>All people and teams</option>{departments.map(d=><option key={d.name } value={d.name }>{d.name } · {d.records.length } teams</option>) }</select></label> }<div className='results-caption'><span>{filtered.length } loaded {filtered.length===1?'record':'records' }</span>{currentSearch?.loading?<LoaderCircle className='spin' size={13 }/>:<span>{query?'SEARCH RESULTS':'DIRECTORY' }</span> }</div>
        {currentSearch?.error&&<p className='inline-warning' role='status'>{currentSearch.error }</p> }
        {workspace==='mine'&&<p className='scope-note'>Assigned records matched to your user ID or the exact owner name supplied by Metaweb. This snapshot may not include all your work.</p> }{workspace==='people'&&<p className='scope-note'>Actual staff and teams. Reporting lines and team membership are not supplied in this view.</p> }{workspace==='attention'&&<p className='scope-note'>Records marked red or amber by Metaweb. Open a record to check its actual status.</p> }<div className='record-scroll'>{filtered.map(r=><RecordRow key={recordKey(r) } record={r } active={selected&&recordKey(selected)===recordKey(r) } onSelect={choose }/>) }
          {!filtered.length&&<div className='empty-state'><MapPin size={28 }/><b>{territory!=='all'?'No loaded records here':'No matching records' }</b><p>{territory!=='all'&&unassigned?'Location is missing for some records. Try the Unassigned precinct.':'Try another name, code or filter. Search covers the API’s loaded snapshot.' }</p><button className='text-button' onClick={()=>{changeWorkspace('all') } }>Show all loaded records</button></div> }
        </div>
        <div className='directory-footer'><ShieldCheck size={15 }/><span>{snapshot.demo?'Illustrative Australian assignments':'Records supplied within your API access' }<small>{snapshot.demo?'Demo only · no CRM writes':'Search is snapshot-limited, not a full database search' }</small></span></div>
      </aside>
      <section className='world-heading'><span className='eyebrow'><span className='status-dot'/> AUSTRALIA / {territory==='all'?'NATIONAL OVERVIEW':territory }</span><h2>{activeTerritory?.name||(workspace==='mine'?'Your work, in perspective.':workspace==='people'?'The people behind your business.':'Your company. Connected.') }</h2><p>{snapshot.demo?'A miniature world. An illustrative CRM journey.':`${user.name } · ${user.title || 'CRM workspace' }` }</p></section>
      <div className='world-top-actions'>{live&&<button className='refresh-button' onClick={refresh } disabled={refreshing||busy }><RefreshCw size={14 } className={refreshing?'spin':'' }/>{refreshing?'Refreshing':'Refresh data' }</button> }<span className='snapshot-time'>{snapshot.demo?'Illustrative data':`Updated ${snapshot.loadedAt.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit' }) }` }</span></div>
      {(notice||snapshot.warning)&&<div className='workspace-notice' role='alert'><Info size={16 }/><span>{notice||snapshot.warning }</span><button className='icon-button' aria-label='Dismiss notice' onClick={()=>{setNotice('');setSnapshot(cur=>({...cur,warning:'' })) } }><X size={14 }/></button></div> }
      {selected&&<aside className='inspector' aria-label='Record details'>
        <button className='inspector-close icon-button' aria-label='Close details' onClick={()=>{setSelected(null);if(!selected)chooseTerritory('all') } }><X size={17 }/></button>
        {displayRecord?<>
          <span className='eyebrow'>{displayRecord.type } <span className='muted'>/</span> {snapshot.demo?'DEMO RECORD':'CRM RECORD' }</span><h2>{displayRecord.name }</h2><p className='record-code'>{displayRecord.id }</p><span className={`status-chip ${displayRecord.tone||'blue' }` }><i/>{displayRecord.status||'Status not supplied' }</span><p className='record-summary'>{kindOf(displayRecord)==='person'?roleOf(displayRecord):displayRecord.summary }</p>{kindOf(displayRecord)==='person'&&<span className='person-context'><Users size={14 }/> Actual Metaweb staff record</span> }
          <div className='location-fact'><MapPin size={16 }/><span>{territoryOf(displayRecord)==='UNASSIGNED'?'Unassigned location':TERRITORIES.find(t=>t.id===territoryOf(displayRecord)).name }<small>{territoryOf(displayRecord)==='UNASSIGNED'?'No Australian location supplied by the API':snapshot.demo?'Illustrative demo assignment':'From the record’s location field' }</small></span></div>
          {selectedDetail?.loading&&<p className='detail-loading' role='status'><LoaderCircle className='spin' size={15 }/> Loading record details…</p> }
          {selectedDetail?.error&&<div className='inline-warning' role='alert'>{selectedDetail.error }<button className='text-button' onClick={()=>{setDetail(d=>({...d,loading:true,error:'' }));setDetailRetry(v=>v+1) } }>Retry details</button></div> }
          <dl className='record-facts'>{(displayRecord.details||[]).filter(pair=>Array.isArray(pair)&&pair.length>1).map(([label,value],i)=><div key={`${label }-${i }` }><dt>{label }</dt><dd>{value===null||value===''?'Not supplied':String(value) }</dd></div>) }</dl>
          <div className='section-label'>{kindOf(displayRecord)==='person'?'ASSIGNED IN THIS SNAPSHOT':'CONNECTED RECORDS' } <span>{related.length }</span></div>{kindOf(displayRecord)==='person'&&<p className='quiet-note'>Matches explicit ownership fields. This is not a complete workload or performance measure.</p> }{related.length?related.map(r=><RecordRow key={recordKey(r) } record={r } onSelect={choose }/>):<p className='quiet-note'>{selectedDetail?.loading?'Checking available relationships…':'No related records supplied in this view.' }</p> }
          {displayRecord.insight&&snapshot.demo&&<div className='demo-insight'><span>ILLUSTRATIVE INSIGHT</span><p>{displayRecord.insight }</p></div> }<div className='inspector-foot'><ShieldCheck size={13 }/>{snapshot.demo?'Sample data, clearly marked':'Read-only · existing CRM access applies' }</div>
        </>:<>
          <span className='eyebrow'>AUSTRALIAN DISTRICT</span><h2>{activeTerritory.name }</h2><p className='record-summary'>{territory==='UNASSIGNED'?'A central home for records whose Australian location has not been supplied. No state or territory is inferred.':'An interactive geographic district. Record placements use explicit Australian location fields when supplied.' }</p><div className='district-number'>{filterRecords(allRecords,{territory }).length }<span>loaded records in this district</span></div><p className='quiet-note'>Counts reflect loaded records. Regional landmarks are navigation hubs, not customer offices. CRM records appear here only when explicit location fields are supplied.</p><button className='secondary-button' onClick={()=>{setModule('all');setQuery('');setDirectoryOpen(true) } }>Browse this district <ArrowRight size={15 }/></button>
        </> }
      </aside> }
      <nav className='workflow-nav' aria-label='CRM workflow modules'><span>WORKFLOW</span>{MODULES.filter(m=>['sales','quotes','contracts','onboarding','support'].includes(m.id)&&user.modules.includes(m.id)).map(m=><button key={m.id } aria-pressed={module===m.id } className={module===m.id?'active':'' } onClick={()=>{setWorkspace('all');setModule(m.id);setQuery('');setTerritory('all');setSelected(null);setDirectoryOpen(true) } }>{m.label }<b>{allRecords.filter(r=>r.department===m.id&&kindOf(r)!=='person').length }</b><ChevronRight size={11 }/></button>) }</nav>
      <div className='world-summary'><div><span className='summary-icon'><Building2 size={18 }/></span><span><b>{allRecords.length }</b><small>records loaded</small></span></div><div><span className='summary-icon'><MapPin size={18 }/></span><span><b>{unassigned }</b><small>unassigned location</small></span></div>{live&&<div><span><b>{totalInScope.toLocaleString() }</b><small>API total · all CRM types</small></span></div> }</div>
    </> }
    {snapshot&&<button className='scene-mode-toggle' onClick={()=>{setSceneMode(m=>m==='image'?'3d':'image');setCameraTarget(null);setResetToken(v=>v+1)}}><Globe2 size={16}/>{sceneMode==='image'?'Explore 3D':'Image overview'}</button>}<div className='map-tools' aria-label='World controls'><button title='Zoom in' aria-label='Zoom in' onClick={()=>cameraZoom(controlsRef.current,true) }><Plus size={18 }/></button><button title='Zoom out' aria-label='Zoom out' onClick={()=>cameraZoom(controlsRef.current,false) }><Minus size={18 }/></button><span/><button title='Reset overview' aria-label='Reset overview' onClick={()=>{setCameraTarget(null);setResetToken(v=>v+1) } }><Home size={17 }/></button><button title={animated?'Pause movement':'Resume movement' } aria-label={animated?'Pause movement':'Resume movement' } onClick={()=>setAnimated(v=>!v) }>{animated?<Pause size={16 }/>:<Play size={16 }/> }</button><button title={evening?'Daylight':'Golden hour' } aria-label={evening?'Daylight':'Golden hour' } onClick={()=>setEvening(v=>!v) }>{evening?<Sun size={17 }/>:<Moon size={17 }/> }</button></div>
    <div className='compass'><Compass size={31 }/><span>N</span></div><footer className='world-footer'><span><i/> {snapshot?.demo?'DEMO · ILLUSTRATIVE WORLD':'META WEB / AUSTRALIA' }</span><span>{snapshot&&territory==='all'&&sceneMode==='image'?'Select a region or headquarters · Zoom to explore':'Drag to orbit · Scroll to zoom · Click to explore'}</span><button onClick={()=>setShowHelp(true) }>World guide <ArrowUpRight size={12 }/></button></footer>
    {showHelp&&<div className='guide-backdrop' onClick={e=>{if(e.target===e.currentTarget)setShowHelp(false) } }><section ref={guideRef } className='world-guide' role='dialog' aria-modal='true' aria-labelledby='guide-title'><button autoFocus className='icon-button inspector-close' aria-label='Close guide' onClick={()=>setShowHelp(false) }><X size={18 }/></button><span className='eyebrow'>A WORLD WITH CONTEXT</span><h2 id='guide-title'>Find your way around.</h2><p>The image overview preserves the approved world artwork. Select a regional label for its CRM records, or the headquarters for your workspace. Explore 3D opens the separate orbitable scene. The artwork is illustrative; live data appears in the directory and detail panels.</p><div className='guide-legend'><span><Building2/>Company buildings<small>Customer accounts</small></span><span><Home/>Staff workspaces<small>Actual staff records</small></span><span><Users/>Team pavilions<small>Actual team records</small></span><span><Layers/>Service buildings<small>Onboarding & services</small></span></div><p><b>Live data, honest boundaries.</b> The current API supplies snapshots, not streaming updates. Refresh manually. Records without Australian location fields stay in Unassigned. Contacts appear only if the API supplies them and permits the module.</p><p>Regional landmarks open geographic filters; they do not represent companies or employees. Each record building opens a real CRM record. Building height identifies record type, not revenue, seniority or performance. The map is a spatial navigation model, not an office-address map. A balanced sample of up to 48 filtered records plus your selection is shown in 3D; every loaded record remains in the directory. My work uses explicit owner fields, not invented task assignments.</p><button className='primary-button' onClick={()=>setShowHelp(false) }>Got it <Check size={16 }/></button></section></div> }
  </main>
 }





