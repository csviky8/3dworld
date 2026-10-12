import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import { ArrowLeft, Building2, Users, FileText, Headset, Layers, TrendingUp, ShieldCheck } from 'lucide-react'
import { MODULES, TERRITORIES, territoryOf, assignedRecords } from '../crm/worldModel.js'
import './RegionWorld.css'
import { NaturalGround, CoastalForest, RegionalLife, Harbour, Neighbourhoods, RoadDetails, Ocean, WaterfrontLandmarks } from './RegionalLandscape.jsx'

const ICONS = { customers: Building2, sales: TrendingUp, quotes: FileText, contracts: ShieldCheck, onboarding: Layers, support: Headset, contacts: Users, teams: Users }
const COLORS = ['#19bcd3','#9677ee','#91b944','#ee708b','#bc6ed1','#f5aa4c','#50ada0','#78a6e0']

function Block({position, size, color, glow=false}) {
  return <mesh position={position} castShadow receiveShadow><boxGeometry args={size}/><meshStandardMaterial color={color} metalness={.22} roughness={.58} emissive={glow?color:'#000000'} emissiveIntensity={glow?.35:0}/></mesh>
}

function Tower({x=0,z=0,height=5,color='#679daa'}) {
  return <group position={[x,0,z]}>
    <Block position={[0,height/2,0]} size={[2.3,height,2.3]} color={color}/>
    {Array.from({length:Math.floor(height/.65)},(_,i)=><Block key={i} position={[0,.6+i*.65,0]} size={[2.4,.09,2.4]} color='#d6e7da'/>)}
    {[-.85,0,.85].map(v=><Block key={v} position={[v,height/2,1.16]} size={[.07,height,.06]} color='#e4eee4'/>)}
    <Block position={[0,height+.15,0]} size={[2.6,.3,2.6]} color='#e6e9db'/>
  </group>
}

function Ring({radius,width,color,y=.13}) {
  return <mesh rotation={[-Math.PI/2,0,0]} position={[0,y,0]} receiveShadow><ringGeometry args={[radius-width,radius,96]}/><meshStandardMaterial color={color} roughness={.8}/></mesh>
}

export function City({districts,region,onModule,controlsRef,animated,evening,hubTitle,departmentWorld=false,labelPortal}) {
  const size=useThree(state=>state.size)
  useEffect(()=>{const c=controlsRef.current;if(!c)return;const scale=Math.max(1,1.15/(size.width/size.height));c.object.position.set(35*scale,43*scale,48*scale);c.target.set(0,1,0);c.update()},[size.width,size.height,controlsRef])
  useEffect(()=>()=>{controlsRef.current=null},[controlsRef])
  return <>
    <color attach='background' args={[evening?'#243e54':'#86c5d1']}/>
    <fog attach='fog' args={[evening?'#243e54':'#86c5d1',100,210]}/>
    <ambientLight intensity={evening?.4:.65}/><hemisphereLight args={['#dbeaf0','#9a8969',1.05]}/>
    <directionalLight castShadow position={[-25,45,20]} intensity={evening?2:3} color={evening?'#ffc58c':'#fff4df'} shadow-mapSize={[2048,2048]} shadow-camera-left={-35} shadow-camera-right={35} shadow-camera-top={35} shadow-camera-bottom={-35} shadow-bias={-.0005}/>
    <Ocean animated={animated} evening={evening}/>
    <NaturalGround/><CoastalForest/><Harbour/><Neighbourhoods/><WaterfrontLandmarks region={region}/>
    <Ring radius={19.5} width={3.5} color='#c5bea5'/><Ring radius={18.5} width={2.2} color='#65716b'/><Ring radius={8.9} width={2.8} color='#c9c3ad'/><Ring radius={8} width={1.6} color='#65716b'/>
    {departmentWorld&&<><Ring radius={13.2} width={3.5} y={.18} color='#4e9ca6'/><Ring radius={13.4} width={.2} y={.2} color='#e0cfad'/><Ring radius={9.8} width={.2} y={.2} color='#e0cfad'/></>}<RoadDetails districts={districts}/><RegionalLife animated={animated}/>
    {districts.map((d,i)=>{
      const angle=i/districts.length*Math.PI*2, x=Math.sin(angle)*15,z=Math.cos(angle)*15
      const Icon=ICONS[d.id]||FileText
      return <group key={d.id} position={[x,0,z]}>
        <mesh receiveShadow position={[0,.22,0]}><cylinderGeometry args={[4,4,.25,40]}/><meshStandardMaterial color='#dddcca'/></mesh>
        <Tower height={departmentWorld?3.6:4+i%3} color={i%2?'#78969a':'#829da4'}/><Tower x={2.2} z={-1.1} height={2.4+i%2} color='#8b9c93'/><Block position={[0,.7,1.7]} size={[2.5,1.2,.8]} color='#e2dbc5'/><Block position={[0,.65,2.12]} size={[1.7,.9,.035]} color='#617f85'/>
        {departmentWorld&&<mesh rotation={[-Math.PI/2,0,0]} position={[0,3.94,0]}><ringGeometry args={[.65,.8,40]}/><meshBasicMaterial color={d.color}/></mesh>}<mesh rotation={[-Math.PI/2,0,0]} position={[0,.38,2]}><ringGeometry args={[.8,1.05,40]}/><meshBasicMaterial color={d.color}/></mesh>
        <Html portal={labelPortal} style={{pointerEvents:'auto'}} center position={[Math.sin(angle)*2,7.2,Math.cos(angle)*2]} distanceFactor={departmentWorld?50:65} zIndexRange={[12,1]}><button className='district-label' style={{'--district':d.color}} onClick={()=>onModule(d.id)}><Icon size={20}/><span><b>{d.id==='onboarding'?'Onboarding':d.id==='teams'?'People':d.label}</b><small>{d.count} loaded records <span>↗</span></small></span></button></Html>
      </group>
    })}
    <mesh position={[0,.25,0]} receiveShadow><cylinderGeometry args={[5.8,6,.45,64]}/><meshStandardMaterial color='#e1dfc6'/></mesh>
    <Ring radius={5.2} width={.22} y={.51} color='#6ae3df'/>
    {departmentWorld?<>
      <mesh position={[0,2.1,0]} castShadow receiveShadow><cylinderGeometry args={[4.8,5,3.5,48]}/><meshStandardMaterial color='#d8d6bd'/></mesh>
      <mesh position={[0,2.25,0]}><cylinderGeometry args={[4.87,4.87,2.7,48]}/><meshStandardMaterial color='#628d99' metalness={.45} roughness={.25}/></mesh>
      {[.8,2,3.5,4].map(y=><mesh key={y} position={[0,y,0]}><cylinderGeometry args={[5,5,.18,48]}/><meshStandardMaterial color='#ede6cc'/></mesh>)}
      {Array.from({length:20},(_,i)=>{const a=i/20*Math.PI*2;return <Block key={i} position={[Math.sin(a)*4.9,2.1,Math.cos(a)*4.9]} size={[.15,3.4,.15]} color='#e9e3cd'/>})}
      <mesh position={[0,4.15,0]} castShadow><sphereGeometry args={[3.4,32,20,0,Math.PI*2,0,Math.PI/2]}/><meshStandardMaterial color='#79abb2' metalness={.5} roughness={.2} transparent opacity={.85}/></mesh>
      <mesh position={[0,4.17,0]}><sphereGeometry args={[3.44,16,10,0,Math.PI*2,0,Math.PI/2]}/><meshBasicMaterial color='#e1debf' wireframe/></mesh>
      <Block position={[0,.35,5.6]} size={[3,.5,2]} color='#e9dfc1'/>
    </>:<><Tower height={10} color='#429eb5'/><Tower x={-2.6} z={.4} height={7} color='#609daa'/><Tower x={2.6} z={.4} height={7} color='#609daa'/><mesh position={[0,11,0]}><sphereGeometry args={[.85,24,24]}/><meshStandardMaterial color='#c1ffed' emissive='#26c5bd' emissiveIntensity={1.1}/></mesh></>}
    <Html center position={[0,departmentWorld?8.5:11.8,0]} zIndexRange={[13,1]}><button className='region-hq' onClick={()=>onModule('all')}><small>CONNECTED WORKSPACE</small><b>{hubTitle||`${region} CRM`}</b><span>Explore the hub ↗</span></button></Html>
    <OrbitControls ref={controlsRef} target={[0,1,0]} minDistance={30} maxDistance={160} maxPolarAngle={Math.PI/2.25} minPolarAngle={.25} enablePan enableDamping dampingFactor={.08}/>
  </>
}

export default function RegionWorld({territory,records,user,onBack,onModule,controlsRef,resetToken,animated,evening}) {
  const labelPortal=useRef(null)
  const regional=useMemo(()=>records.filter(r=>territoryOf(r)===territory),[records,territory])
  const districts=MODULES.filter(m=>user.modules.includes(m.id)).map(m=>({...m,color:COLORS[MODULES.indexOf(m)],count:regional.filter(r=>r.department===m.id).length}))
  const assigned=assignedRecords(regional,user).length
  return <section className='region-world' aria-label={`${territory} 3D CRM world`}>
    <div ref={labelPortal} className='world-label-layer'/><Canvas key={`${territory}-${resetToken}`} shadows dpr={[1,1.5]} frameloop={animated?'always':'demand'} camera={{position:[35,43,48],fov:43}} fallback={<div className='scene-fallback'>3D is unavailable. Use Find a record to browse this region.</div>}><City labelPortal={labelPortal} districts={districts} region={territory} onModule={onModule} controlsRef={controlsRef} animated={animated} evening={evening}/></Canvas>
    <div className='region-title'><button onClick={onBack}><ArrowLeft size={15}/> Australia</button><span> / {territory}</span><h1>{territory} CRM WORLD</h1><p>{TERRITORIES.find(t=>t.id===territory)?.name} · Connect. Manage. Grow.</p></div>
    <aside className='region-profile'><span className='region-avatar'>{user.initials||user.name?.slice(0,2)}</span><h2>{user.name}</h2><p>{user.title||'CRM workspace'}</p><div><span>Assigned in this region</span><b>{assigned}</b></div><div><span>Available modules</span><b>{districts.length}</b></div><button onClick={()=>onModule('all')}>View regional records <span>↗</span></button></aside>
    <aside className='region-stats'><small>REGION OVERVIEW</small><h2>{territory} at a glance</h2><div><span>Loaded records</span><b>{regional.length}</b></div><div><span>Customers</span><b>{regional.filter(r=>r.department==='customers').length}</b></div><div><span>Needs attention</span><b>{regional.filter(r=>['red','amber'].includes(r.tone)).length}</b></div><p>Counts reflect your accessible snapshot.</p></aside>
    <p className='region-hint'>Drag to explore · Scroll to zoom · A living coastal CRM world</p>
  </section>
}
