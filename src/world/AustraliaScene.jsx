import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import { BufferGeometry, Float32BufferAttribute, PMREMGenerator, Vector3 } from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import NaturalLandscape from './NaturalLandscape.jsx'
import { routeTo } from './naturalGeometry.js'
import { kindOf, MODULES, recordKey, TERRITORIES, territoryOf } from '../crm/worldModel.js'

const STEEL='#a9c4d4', GLASS='#24566d'
function Reflections(){
  const get=useThree(state=>state.get)
  useEffect(()=>{const {gl,scene,invalidate}=get();const room=new RoomEnvironment(),generator=new PMREMGenerator(gl),map=generator.fromScene(room,.04),previous=scene.environment;scene.environment=map.texture;invalidate();room.dispose();generator.dispose();return()=>{scene.environment=previous;map.dispose()}},[get])
  return null
}
function Slab({position,size,color=STEEL,glass=false,glow=false}){
  return <mesh position={position} castShadow receiveShadow><boxGeometry args={size}/><meshPhysicalMaterial color={color} metalness={glass?.65:.7} roughness={glass?.12:.32} clearcoat={glass?1:.3} emissive={glow?color:'#000000'} emissiveIntensity={glow?1.1:0}/></mesh>
}
function Connection({to}){
  const curve=useMemo(()=>routeTo(to),[to])
  const geometry=useMemo(()=>{const vertices=[],indices=[];curve.getPoints(80).forEach((p,i)=>{const t=curve.getTangent(i/80),n=new Vector3(-t.z,0,t.x).normalize().multiplyScalar(.64);vertices.push(p.x+n.x,p.y,p.z+n.z,p.x-n.x,p.y,p.z-n.z);if(i<80){const a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3)}});const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g},[curve])
  useEffect(()=>()=>geometry.dispose(),[geometry])
  return <group><mesh geometry={geometry} receiveShadow><meshStandardMaterial color='#64706b' roughness={.85} side={2}/></mesh>{[-.56,.56].map(side=><mesh key={side} position={[side,.07,0]}><tubeGeometry args={[curve,80,.055,5,false]}/><meshStandardMaterial color='#d8d7c8'/></mesh>)}{curve.getSpacedPoints(40).slice(1,-1).map((p,i)=><mesh key={i} position={[p.x,p.y+.015,p.z]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.06,6]}/><meshBasicMaterial color='#f4edcf'/></mesh>)}{to[2]>35&&curve.getPoints(14).filter(p=>p.z>32&&p.z<41).map((p,i)=><mesh key={i} position={[p.x,-.35,p.z]} castShadow><cylinderGeometry args={[.16,.3,2,8]}/><meshStandardMaterial color='#ccc8b3'/></mesh>)}</group>
}
function Tower({height=3,color='#5ca5c5',person=false,team=false}){
  const width=team?1.8:person?1.05:1.55, depth=person?1.1:1.45
  return <group>
    <Slab position={[0,.1,0]} size={[width+.3,.2,depth+.3]} color='#698496'/>
    <Slab position={[0,height/2+.2,0]} size={[width,height,depth]} color={GLASS} glass/>
    {Array.from({length:Math.max(2,Math.floor(height/.6))},(_,i)=><Slab key={i} position={[0,.55+i*.6,0]} size={[width+.045,.045,depth+.045]} color='#a4bdc7'/>)}
    {[-1,1].map(side=><Slab key={side} position={[side*width/2,height/2+.2,depth/2+.015]} size={[.065,height,.045]} color={STEEL}/>)}
    <Slab position={[0,height+.24,0]} size={[width+.15,.16,depth+.15]} color='#c4d6df'/>
    <Slab position={[0,height+.34,0]} size={[width*.8,.035,depth*.75]} color={color} glow/>
    <Slab position={[0,.5,depth/2+.04]} size={[width*.27,.6,.06]} color='#b2e8ee' glass/>
    {team&&<Slab position={[0,1.1,depth/2+.15]} size={[width+.5,.16,.4]} color={color}/>}
  </group>
}
function RegionalHub({territory,onSelect}){
  return <group position={[territory.position[0],.55,territory.position[2]-3]} onClick={e=>{e.stopPropagation();onSelect(territory.id)}}>
    <mesh receiveShadow><cylinderGeometry args={[3.5,3.65,.18,64]}/><meshStandardMaterial color='#d6cdb1' roughness={.8}/></mesh>
    <mesh position={[0,.17,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[2.75,3.1,64]}/><meshStandardMaterial color='#459fba' roughness={.25} metalness={.3}/></mesh>
    <mesh position={[0,1.1,0]} castShadow><cylinderGeometry args={[1.35,1.55,1.8,32]}/><meshPhysicalMaterial color='#498caf' metalness={.5} roughness={.2}/></mesh>
    <mesh position={[0,2.1,0]} castShadow><cylinderGeometry args={[1.7,1.7,.16,32]}/><meshStandardMaterial color='#eee4c8'/></mesh>
    {[-1,1].map(side=><group key={side} position={[side*2,.12,-1.4]}><Tower height={side===1?4.5:3.3} color='#bfd6df'/></group>)}
  </group>
}
function Headquarters({onSelect}){
  return <group position={[2,.6,-2]} onClick={e=>{e.stopPropagation();onSelect('all')}}>
    <mesh receiveShadow><cylinderGeometry args={[8,8.2,.25,96]}/><meshStandardMaterial color='#d5cfb4' roughness={.85}/></mesh>
    <mesh position={[0,.14,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[6.8,7.5,96]}/><meshStandardMaterial color='#449990' metalness={.3} roughness={.25}/></mesh>
    <mesh position={[0,1.9,0]} castShadow receiveShadow><cylinderGeometry args={[4.7,5,3.5,64]}/><meshPhysicalMaterial color='#347ba4' metalness={.55} roughness={.17} clearcoat={1}/></mesh>
    {[.25,1.4,2.65,3.75].map(y=><mesh key={y} position={[0,y,0]} castShadow><cylinderGeometry args={[5.15,5.15,.15,64]}/><meshStandardMaterial color='#e8e1ce' metalness={.25} roughness={.45}/></mesh>)}
    {Array.from({length:24},(_,i)=>{const a=i*Math.PI/12;return <mesh key={i} position={[Math.sin(a)*4.92,1.9,Math.cos(a)*4.92]} castShadow><cylinderGeometry args={[.085,.12,3.65,8]}/><meshStandardMaterial color='#f0e7cf' roughness={.4}/></mesh>})}
    <mesh position={[0,5.45,0]} castShadow><sphereGeometry args={[2.55,64,48]}/><meshPhysicalMaterial color='#248bcc' metalness={.6} roughness={.1} clearcoat={1} emissive='#0963ae' emissiveIntensity={.25}/></mesh>
    {[0,Math.PI/3,Math.PI*2/3].map(angle=><mesh key={angle} position={[0,5.45,0]} rotation={[Math.PI/2,angle,0]}><torusGeometry args={[2.57,.018,8,96]}/><meshBasicMaterial color='#8ce4ff'/></mesh>)}
    {[-1.35,0,1.35].map(y=><mesh key={y} position={[0,5.45+y,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[Math.sqrt(2.57**2-y**2),.018,8,96]}/><meshBasicMaterial color='#8ce4ff'/></mesh>)}
    <Slab position={[0,.12,6.7]} size={[2.2,.2,4]} color='#e5d9ba'/>
    <group position={[-5.8,0,-2.8]}><Tower height={6.7} color='#87c1ce'/></group>
    <group position={[5.8,0,-2.8]}><Tower height={8.3} color='#87c1ce'/></group>
  </group>
}
function RecordBuilding({record,position,selected,onSelect}){
  const [hover,setHover]=useState(false)
  const kind=kindOf(record),person=kind==='person',team=kind==='team'
  const color=MODULES.find(m=>m.id===record.department)?.color||'#6cbdcf'
  const height=person?1.6:team?2.4:kind==='customer'?3.6:2.7
  return <group position={position} onClick={e=>{e.stopPropagation();onSelect(record)}} onPointerOver={e=>{e.stopPropagation();setHover(true)}} onPointerOut={()=>setHover(false)}>
    <Tower height={height} color={selected?'#eac486':color} person={person} team={team}/>
    {(hover||selected)&&<><mesh position={[0,.04,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[1.12,1.22,48]}/><meshBasicMaterial color='#bceeff'/></mesh><Html position={[0,height+1,0]} center zIndexRange={[18,10]}><button className='record-map-label' onClick={()=>onSelect(record)}><small>{record.type} · {record.id}</small><b>{record.name}</b></button></Html></>}
  </group>
}
function CameraMotion({localControlsRef,controlsRef,cameraTarget,resetToken,animated}){
  const {size,invalidate}=useThree(),motion=useRef(null)
  useEffect(()=>{
    const c=localControlsRef.current;if(!c)return
    const scale=Math.max(1,1.05/(size.width/size.height))
    motion.current={position:new Vector3(12*scale,83*scale,102*scale),target:new Vector3(0,0,7)};invalidate()
  },[resetToken,size.width,size.height,localControlsRef,invalidate])
  useEffect(()=>{
    const c=localControlsRef.current;if(!c||!cameraTarget)return
    const target=new Vector3(...cameraTarget)
    const offset=c.object.position.clone().sub(c.target).normalize().multiplyScalar(46)
    motion.current={target,position:target.clone().add(offset)};invalidate()
  },[cameraTarget,localControlsRef,invalidate])
  useFrame((_,delta)=>{
    const c=localControlsRef.current,destination=motion.current;if(!c||!destination)return
    const factor=animated?1-Math.exp(-delta*5):1
    c.object.position.lerp(destination.position,factor);c.target.lerp(destination.target,factor);c.update()
    if(c.object.position.distanceTo(destination.position)<.025){c.object.position.copy(destination.position);c.target.copy(destination.target);motion.current=null}else invalidate()
  })
  return <OrbitControls ref={value=>{localControlsRef.current=value;controlsRef.current=value}} makeDefault target={[0,0,7]} minDistance={15} maxDistance={450} minPolarAngle={.15} maxPolarAngle={Math.PI/2.4} enableDamping dampingFactor={.09} onStart={()=>{motion.current=null}}/>
}
export default function AustraliaScene({records,allRecords=[],placements,selectedKey,territory,onSelect,onTerritory,controlsRef,cameraTarget,resetToken,user,animated=true,evening=false}){
  const localControlsRef=useRef()
  const counts=useMemo(()=>allRecords.reduce((result,r)=>{const id=territoryOf(r);result[id]=(result[id]||0)+1;return result},{}),[allRecords])
  return <>
    <color attach='background' args={[evening?'#52758a':'#91c6df']}/>
    <fog attach='fog' args={[evening?'#52758a':'#91c6df',230,580]}/>
    <ambientLight intensity={.4}/><hemisphereLight args={['#d0edff','#8d8660',1.35]}/>
    <directionalLight position={[-30,65,35]} intensity={evening?2:3} color={evening?'#ffc17a':'#fff1cf'} castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-75} shadow-camera-right={75} shadow-camera-top={75} shadow-camera-bottom={-75} shadow-normalBias={.08}/>
    <Reflections/>
    <NaturalLandscape/>
    {TERRITORIES.filter(t=>t.id!=='UNASSIGNED').map(t=><group key={t.id}><Connection to={t.position}/><RegionalHub territory={t} onSelect={onTerritory}/></group>)}
    <Headquarters onSelect={onTerritory}/>
    <Html position={[2,9.5,-2]} center distanceFactor={85} zIndexRange={[10,0]}><button className='hq-label' onClick={()=>onTerritory('all')}><span>META<b>WEB</b></span><small>{user?.name || 'Company'} workspace</small></button></Html>
    <Slab position={[1,.34,17.5]} size={[18,.14,16.5]} color='#c4c1a7'/>
    {records.map(r=><RecordBuilding key={recordKey(r)} record={r} position={placements.get(recordKey(r))} selected={selectedKey===recordKey(r)} onSelect={onSelect}/>)}
    {TERRITORIES.map(t=><Html key={t.id} position={[t.label[0],1,t.id==='UNASSIGNED'?29:t.label[1]]} center distanceFactor={100} zIndexRange={[8,0]}><button className={`territory-label ${territory===t.id?'active':''} ${t.id==='UNASSIGNED'?'unassigned-label':''}`} onClick={()=>onTerritory(t.id)} aria-label={`${t.name}: ${counts[t.id]||0} loaded records`}><span>{t.id==='UNASSIGNED'?'COMPANY WORKSPACE':t.id}</span><small>{counts[t.id]||0} records{t.id==='UNASSIGNED'?' · location not supplied':''}</small></button></Html>)}
    <CameraMotion localControlsRef={localControlsRef} controlsRef={controlsRef} cameraTarget={cameraTarget} resetToken={resetToken} animated={animated}/>
  </>
}



