import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import { BufferGeometry, CatmullRomCurve3, Color, Float32BufferAttribute, Object3D, Shape, Vector3 } from 'three'
import { buildingKind, MODULES, recordKey, TERRITORIES } from '../crm/worldModel.js'

const COAST = [[-47,-7],[-44,-14],[-39,-17],[-35,-22],[-31,-22],[-28,-28],[-23,-30],[-21,-35],[-15,-33],[-12,-37],[-7,-35],[-3,-38],[2,-34],[6,-34],[7,-28],[12,-23],[16,-25],[18,-32],[20,-40],[23,-33],[24,-27],[29,-22],[33,-17],[35,-10],[39,-3],[42,6],[40,15],[36,22],[31,29],[24,33],[18,31],[13,33],[7,28],[2,28],[-1,22],[-5,20],[-11,20],[-17,22],[-24,24],[-31,24],[-36,20],[-41,19],[-44,12],[-43,7],[-47,2]]
const TASMANIA = [[15,39],[21,40],[25,39],[26,43],[23,48],[20,50],[17,47],[16,43]]
const ORIGIN = [2,0.5,0]
const STATE_POINTS = TERRITORIES.filter((t) => !['UNASSIGNED','TAS'].includes(t.id))
const INITIAL_CAMERA = [24, 96, 110]

function shapeFrom(points) {
  const shape = new Shape()
  points.forEach(([x,z],i) => i ? shape.lineTo(x,-z) : shape.moveTo(x,-z))
  shape.closePath()
  return shape
}

function inside(x,z,points) {
  let result = false
  for (let i=0,j=points.length-1;i<points.length;j=i++) {
    const [xi,zi]=points[i], [xj,zj]=points[j]
    if (((zi>z)!==(zj>z)) && x < (xj-xi)*(z-zi)/(zj-zi)+xi) result=!result
  }
  return result
}

function roadCurve(to) {
  const [x,,z]=to
  return new CatmullRomCurve3([new Vector3(...ORIGIN),new Vector3(x*.28,0.54,z*.52-2),new Vector3(x*.66,0.54,z*.73+2),new Vector3(x,0.54,z)])
}

function Ribbon({ curve, width=1.5, color='#616967', y=0 }) {
  const geometry = useMemo(() => {
    const points=curve.getPoints(60), vertices=[], indices=[]
    points.forEach((p,i) => {
      const tangent=curve.getTangent(i/60)
      const normal=new Vector3(-tangent.z,0,tangent.x).normalize().multiplyScalar(width/2)
      vertices.push(p.x+normal.x,p.y+y,p.z+normal.z,p.x-normal.x,p.y+y,p.z-normal.z)
      if(i<60){ const a=i*2; indices.push(a,a+2,a+1,a+1,a+2,a+3) }
    })
    const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals()
    return g
  },[curve,width,y])
  useEffect(() => () => geometry.dispose(), [geometry])
  return <mesh geometry={geometry} receiveShadow><meshStandardMaterial color={color} roughness={0.95} side={2}/></mesh>
}

function Road({ curve }) {
  return <><Ribbon curve={curve} width={2.15} color='#d0c4a8'/><Ribbon curve={curve} y={.012} />
    {curve.getSpacedPoints(26).slice(1,-1).filter((_,i)=>i%2===0).map((p,i)=><mesh key={i} position={[p.x,p.y+.03,p.z]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.085,6]}/><meshBasicMaterial color='#ece3be'/></mesh>)}
  </>
}

function Land({ points, color }) {
  const shape=useMemo(()=>shapeFrom(points),[points])
  return <>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-1.2,0]} castShadow receiveShadow>
      <extrudeGeometry args={[shape,{depth:1.45,bevelEnabled:true,bevelSize:.28,bevelThickness:.12,bevelSegments:2,steps:1}]}/>
      <meshStandardMaterial attach='material-0' color={color} roughness={.94}/><meshStandardMaterial attach='material-1' color='#9f8761' roughness={1}/>
    </mesh>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.9,0]} scale={[1.025,1.025,1]}>
      <shapeGeometry args={[shape]}/><meshStandardMaterial color='#dec897' roughness={1}/>
    </mesh>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-1.16,0]} scale={[1.085,1.085,1]}>
      <shapeGeometry args={[shape]}/><meshStandardMaterial color='#62b7be' transparent opacity={.6} roughness={.3}/>
    </mesh>
  </>
}

function Box({ position, size, color, ...props }) {
  return <mesh position={position} castShadow receiveShadow {...props}><boxGeometry args={size}/><meshStandardMaterial color={color} roughness={.67}/></mesh>
}

function Office({ color='#b9c8c4', height=2.8, company=false }) {
  return <>
    <Box position={[0,height/2,0]} size={[1.7,height,1.4]} color={company?'#dbe3dc':'#eee5d1'}/>
    <Box position={[0,height+.12,0]} size={[1.95,.22,1.65]} color='#d7d5c2'/>
    <Box position={[0,height*.51,.72]} size={[1.45,height*.73,.035]} color={color}/>
    <Box position={[.87,height*.51,0]} size={[.035,height*.73,1.18]} color={color}/>
    {[.28,.55,.82].map(y=><Box key={y} position={[0,height*y,.755]} size={[1.6,.065,.05]} color='#f2edda'/>)}
    {[-.52,0,.52].map(x=><Box key={x} position={[x,height*.53,.76]} size={[.06,height*.8,.05]} color='#e9e9d9'/>)}
    <Box position={[0,.36,.79]} size={[.4,.72,.09]} color='#314b4d'/>
    <Box position={[.42,height+.34,-.25]} size={[.56,.24,.55]} color='#a6aaa0'/>
    {company&&<Box position={[-.8,.32,.92]} size={[.4,.5,.35]} color='#497351'/>}
  </>
}

function House() {
  return <>
    <Box position={[0,.62,0]} size={[1.5,1.25,1.3]} color='#e9d7b8'/>
    <mesh position={[0,1.5,0]} rotation={[0,Math.PI/4,0]} castShadow><coneGeometry args={[1.32,.8,4]}/><meshStandardMaterial color='#a56850' roughness={.85}/></mesh>
    <Box position={[-.36,.72,.66]} size={[.37,.38,.04]} color='#678e98'/><Box position={[.3,.45,.67]} size={[.35,.9,.06]} color='#716953'/>
    <Box position={[.7,.1,.9]} size={[.34,.25,.5]} color='#5b794f'/>
  </>
}

function Gateway() {
  return <>
    {[-.8,.8].map(x=><Box key={x} position={[x,1.15,0]} size={[.42,2.3,.6]} color='#efe0bd'/>)}
    <Box position={[0,2.2,0]} size={[2.3,.6,.75]} color='#dfc99b'/>
    <Box position={[0,2.25,.4]} size={[1.6,.27,.03]} color='#315f5a'/>
    <Box position={[0,.06,.4]} size={[2.4,.12,1.5]} color='#c2b799'/>
  </>
}

function CivicHQ({ onSelect, user }) {
  return <group position={ORIGIN} onClick={(e)=>{e.stopPropagation();onSelect()}}>
    <mesh receiveShadow position={[0,.08,0]}><cylinderGeometry args={[7.5,7.8,.16,64]}/><meshStandardMaterial color='#c8bfa3'/></mesh>
    <mesh position={[0,.2,0]}><cylinderGeometry args={[6.2,6.5,.25,12]}/><meshStandardMaterial color='#eee3c6'/></mesh>
    <Box position={[0,1.6,0]} size={[7.6,2.8,4.4]} color='#e9dec6'/>
    <Box position={[0,3.15,0]} size={[8.2,.3,4.9]} color='#eee7d2'/>
    <Box position={[0,1.8,2.24]} size={[7,2,.12]} color='#648e99'/>
    {[-3,-2,-1,0,1,2,3].map(x=><mesh key={x} position={[x,1.85,2.52]} castShadow><cylinderGeometry args={[.15,.19,2.9,10]}/><meshStandardMaterial color='#f5ebd3'/></mesh>)}
    {[-1,1].map(side=><group key={side} position={[side*4.7,0,0]}><Office height={3.3} color='#7d9ca5'/></group>)}
    <mesh position={[0,4.1,0]} castShadow><cylinderGeometry args={[2.05,2.05,1.6,24]}/><meshStandardMaterial color='#e7d9b8'/></mesh>
    <mesh position={[0,4.9,0]} castShadow><sphereGeometry args={[2.16,32,18,0,Math.PI*2,0,Math.PI/2]}/><meshStandardMaterial color='#668c97' metalness={.45} roughness={.3}/></mesh>
    <mesh position={[0,7.9,0]} castShadow><cylinderGeometry args={[.035,.04,2.4,6]}/><meshStandardMaterial color='#d6b872'/></mesh>
    <Box position={[.4,8.5,0]} size={[.8,.43,.035]} color='#244c6c'/>
    <Html position={[0,9.4,0]} center distanceFactor={75} zIndexRange={[10,0]}><button className='hq-label' onClick={onSelect}><span>META<span>WEB</span></span><small>{user?`${user.name.split(' ')[0].toUpperCase()}’S WORKSPACE`:'NATIONAL WORKSPACE'}</small></button></Html>
  </group>
}

function Trees() {
  const trunks=useRef(), crowns=useRef(), tops=useRef()
  const points=useMemo(()=>{
    const result=[]
    for(let i=0;i<550;i++){
      const x=Math.sin(i*127.1+11)*46,z=Math.sin(i*311.7+7)*48
      if(!inside(x,z,COAST)&&!inside(x,z,TASMANIA))continue
      if(Math.hypot(x-2,z)<10 || (Math.abs(x-1)<12 && z>7 && z<25))continue
      if(TERRITORIES.some(t=>Math.hypot(x-t.position[0],z-t.position[2])<7))continue
      result.push([x,z,.65+Math.abs(Math.sin(i))*1.25])
    }
    return result
  },[])
  useLayoutEffect(()=>{
    const dummy=new Object3D(),color=new Color()
    points.forEach(([x,z,s],i)=>{
      dummy.position.set(x,.5+s*.5,z);dummy.scale.set(s,s,s);dummy.updateMatrix();trunks.current.setMatrixAt(i,dummy.matrix)
      dummy.position.y=.5+s*1.35;dummy.updateMatrix();crowns.current.setMatrixAt(i,dummy.matrix)
      dummy.position.y=.5+s*1.9;dummy.scale.set(s*.75,s*.8,s*.75);dummy.updateMatrix();tops.current.setMatrixAt(i,dummy.matrix)
      color.set(x < -10 ? '#688354' : '#48735b');color.offsetHSL(0,(i%3)*.015,(i%7)*.015)
      crowns.current.setColorAt(i,color);tops.current.setColorAt(i,color)
    })
    for(const ref of [trunks,crowns,tops]){ref.current.instanceMatrix.needsUpdate=true;if(ref.current.instanceColor)ref.current.instanceColor.needsUpdate=true}
  },[points])
  return <>
    <instancedMesh ref={trunks} args={[null,null,points.length]} castShadow><cylinderGeometry args={[.1,.16,1.3,5]}/><meshStandardMaterial color='#7a6850'/></instancedMesh>
    <instancedMesh ref={crowns} args={[null,null,points.length]} castShadow><icosahedronGeometry args={[.85,1]}/><meshStandardMaterial roughness={1}/></instancedMesh>
    <instancedMesh ref={tops} args={[null,null,points.length]} castShadow><icosahedronGeometry args={[.8,1]}/><meshStandardMaterial roughness={1}/></instancedMesh>
  </>
}

function Landscape() {
  const terrain=useMemo(()=>{
    const vertices=[],colors=[],indices=[]
    const color=new Color()
    for(let z=-40;z<=34;z+=1.5)for(let x=-48;x<=43;x+=1.5){
      if(![[x,z],[x+1.5,z],[x,z+1.5],[x+1.5,z+1.5]].every(([px,pz])=>inside(px,pz,COAST)))continue
      const index=vertices.length/3
      for(const [dx,dz] of [[0,0],[1.5,0],[0,1.5],[1.5,1.5]]){
        const px=x+dx,pz=z+dz
        vertices.push(px,.515,pz)
        color.set(px<-18?'#b5a475':pz<-10&&px<12?'#bb9870':px>15?'#849966':'#a6aa77')
        color.offsetHSL(0,0,Math.sin(px*1.3+pz*.6)*.014+Math.sin(px*.6-pz*.7)*.016)
        colors.push(color.r,color.g,color.b)
      }
      indices.push(index,index+2,index+1,index+1,index+2,index+3)
    }
    const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute(vertices,3));geometry.setAttribute('color',new Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry
  },[])
  useEffect(()=>()=>terrain.dispose(),[terrain])
  return <>
    <mesh geometry={terrain} receiveShadow><meshStandardMaterial vertexColors roughness={1}/></mesh>
    {[[-24,-20],[-21,-23],[-18,-25],[-12,-24],[9,-17],[33,-6],[34,-2],[32,3],[29,8],[-37,10]].map(([x,z],i)=><group key={i} position={[x,.4,z]}>
      <mesh castShadow receiveShadow rotation={[0,i*.7,.1]} scale={[2.1,1.3+(i%3)*.5,1.4]}><icosahedronGeometry args={[1.5,1]}/><meshStandardMaterial color={x<0?'#ac805e':'#879174'} roughness={1}/></mesh>
      <mesh castShadow position={[1.6,.15,1]} scale={[1.2,.7,1]}><dodecahedronGeometry args={[1,0]}/><meshStandardMaterial color={x<0?'#b88e66':'#949a7a'} roughness={1}/></mesh>
    </group>)}
    <group position={[39,.55,9]}>
      <Box position={[0,.12,0]} size={[3.4,.24,2.1]} color='#d9ceac'/>
      {[0,1,2].map(i=><mesh key={i} position={[-1+i, .5+i*.13,0]} rotation={[0,0,-.25]} scale={[.5,1.1+i*.2,1]} castShadow><sphereGeometry args={[.9,16,12,0,Math.PI]}/><meshStandardMaterial color='#f2ecd9' side={2} roughness={.6}/></mesh>)}
    </group>
  </>
}

function Town({ territory, onSelect }) {
  const [x,,z]=territory.position
  return <group position={[x,.6,z-4.6]} onClick={(e)=>{e.stopPropagation();onSelect(territory.id)}}>
    <Box position={[0,-.02,0]} size={[9,.1,4.3]} color='#b4af91'/>
    {[-3.2,-1.1,1.1,3.2].map((offset,i)=><group key={i} position={[offset,0,0]}>{i===0?<House/>:<Office height={1.6+(i%3)*.75} color={i%2?'#7999a1':'#93a9a1'}/>}</group>)}
    <Box position={[0,.025,2.1]} size={[11,.08,.9]} color='#616d65'/>
    {[-3.3,-1.1,1.1,3.3].map((offset,i)=><group key={`home-${i}`} position={[offset,0,3.8]} rotation={[0,Math.PI,0]}><House/></group>)}
  </group>
}

function Car({ curve, index, animated }) {
  const ref=useRef()
  useFrame(({clock})=>{
    if(!ref.current)return
    const t=((animated?clock.elapsedTime*.018:0)+index*.23)%1
    const p=curve.getPointAt(t), tangent=curve.getTangentAt(t)
    ref.current.position.set(p.x+tangent.z*.35,p.y+.1,p.z-tangent.x*.35)
    ref.current.rotation.y=Math.atan2(tangent.x,tangent.z)
  })
  return <group ref={ref}>
    <Box position={[0,.16,0]} size={[.46,.29,.88]} color={['#f2e9cc','#ba6552','#557f89','#b9aa70'][index%4]}/>
    <Box position={[0,.37,-.04]} size={[.36,.2,.43]} color='#42616b'/>
    {[-.19,.19].map(x=><mesh key={x} position={[x,.19,.45]}><boxGeometry args={[.1,.06,.025]}/><meshBasicMaterial color='#fff4c4'/></mesh>)}
  </group>
}

function Walker({ index, animated }) {
  const body=useRef(), left=useRef(), right=useRef()
  useFrame(({clock})=>{
    const t=(animated?clock.elapsedTime:0)+index*3
    const angle=t*.12+index*1.6, radius=8.5+(index%3)*.55
    body.current.position.set(2+Math.sin(angle)*radius,.58,Math.cos(angle)*radius)
    body.current.rotation.y=angle+Math.PI/2
    left.current.rotation.x=Math.sin(t*6)*.42;right.current.rotation.x=-Math.sin(t*6)*.42
  })
  return <group ref={body}>
    <Box position={[0,.63,0]} size={[.25,.4,.17]} color={['#355979','#c18359','#e7d7b7','#6b7953'][index%4]}/>
    <mesh position={[0,.98,0]} castShadow><sphereGeometry args={[.14,8,8]}/><meshStandardMaterial color={index%2?'#ba8967':'#d9b48d'}/></mesh>
    <group position={[-.075,.46,0]} ref={left}><Box position={[0,-.21,0]} size={[.095,.43,.1]} color='#435156'/></group>
    <group position={[.075,.46,0]} ref={right}><Box position={[0,-.21,0]} size={[.095,.43,.1]} color='#435156'/></group>
  </group>
}

function StreetLights() {
  return <>{STATE_POINTS.flatMap((territory,i)=>{
    const [x,,z]=territory.position
    return [0,1].map(n=><group key={`${i}-${n}`} position={[x-4+n*8,.58,z-1.9]}>
      <mesh position={[0,1.05,0]} castShadow><cylinderGeometry args={[.035,.045,2.1,6]}/><meshStandardMaterial color='#4a5952'/></mesh>
      <mesh position={[0,2.15,0]}><sphereGeometry args={[.13,8,8]}/><meshStandardMaterial color='#ffe6a0' emissive='#ffe6a0' emissiveIntensity={2}/></mesh>
    </group>)
  })}</>
}

function RecordBuilding({ record, position, selected, onSelect }) {
  const [hovered,setHovered]=useState(false)
  const color=MODULES.find(m=>m.id===record.department)?.color||'#719598'
  const kind=buildingKind(record)
  return <group position={position} onClick={(e)=>{e.stopPropagation();onSelect(record)}} onPointerOver={(e)=>{e.stopPropagation();setHovered(true)}} onPointerOut={()=>setHovered(false)}>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,.035,0]}><ringGeometry args={[1.08,selected?1.4:1.18,32]}/><meshBasicMaterial color={selected?'#ffdb7a':color} transparent opacity={selected||hovered?1:.65}/></mesh>
    {kind==='house'?<House/>:kind==='gateway'?<Gateway/>:<Office company={kind==='company'} height={kind==='leader'?3.7:kind==='company'?2.6:1.6} color={color}/>}
    {(hovered||selected)&&<Html position={[0,4.7,0]} center zIndexRange={[18,10]}><button className='record-map-label' onClick={()=>onSelect(record)}><small>{record.type} · {record.id}</small><b>{record.name}</b></button></Html>}
  </group>
}

function MapBoundaries() {
  const lines=[[[-18,-31],[-18,21]],[[-18,-7],[6,-7]],[[6,-30],[6,-7]],[[6,-7],[17,-7],[17,9],[40,9]],[[6,-7],[6,27]],[[6,24],[16,24],[28,30]]]
  return <>{lines.map((points,i)=><Ribbon key={i} curve={new CatmullRomCurve3(points.map(([x,z])=>new Vector3(x,.57,z)))} width={.1} color='#e2cf9c'/>)}</>
}

function Water({ animated }) {
  const ref=useRef()
  useFrame(({clock})=>{if(ref.current)ref.current.rotation.z=animated?Math.sin(clock.elapsedTime*.025)*.018:0})
  return <group>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-1.25,0]} receiveShadow><planeGeometry args={[2000,2000]}/><meshStandardMaterial color='#498eab' roughness={.32} metalness={.25}/></mesh>
    <group ref={ref}>
      {Array.from({length:30},(_,i)=><mesh key={i} position={[-88+(i%6)*33,-1.2,-65+Math.floor(i/6)*30]} rotation={[-Math.PI/2,0,.2]}><planeGeometry args={[5+(i%4)*2,.06]}/><meshBasicMaterial color='#acdae0' transparent opacity={.28}/></mesh>)}
    </group>
  </group>
}

export default function AustraliaScene({ records, placements, selectedKey, territory, onSelect, onTerritory, controlsRef, cameraTarget, resetToken, user, animated=true, evening=false }) {
  const roads=useMemo(()=>STATE_POINTS.map(t=>roadCurve(t.position)),[])
  const controls=useRef()
  const size=useThree(state=>state.size)
  useEffect(()=>{
    const c=controls.current
    if(!c)return
    const scale=Math.max(1,1.2/(size.width/size.height))
    c.object.position.set(...INITIAL_CAMERA.map(value=>value*scale));c.target.set(0,0,8);c.update()
  },[resetToken,size.width,size.height])
  useEffect(()=>{
    const c=controls.current
    if(!c||!cameraTarget)return
    const next=new Vector3(...cameraTarget)
    const delta=next.clone().sub(c.target)
    c.object.position.add(delta);c.target.copy(next);c.update()
  },[cameraTarget])
  return <>
    <color attach='background' args={[evening?'#607d8b':'#b9d8df']}/>
    <fog attach='fog' args={[evening?'#607d8b':'#b9d8df',340,750]}/>
    <ambientLight intensity={evening?.35:.45}/>
    <hemisphereLight args={['#e0f3ff','#a99570',.9]}/>
    <directionalLight position={[-35,65,30]} intensity={evening?2:2.3} color={evening?'#ffc17d':'#fff1d3'} castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-75} shadow-camera-right={75} shadow-camera-top={75} shadow-camera-bottom={-75} shadow-normalBias={.07}/>
    <Water animated={animated}/>
    <Land points={COAST} color='#a7ad7c'/><Land points={TASMANIA} color='#88a17d'/>
    <Landscape/>
    <MapBoundaries/>
    {roads.map((curve,i)=><Road key={i} curve={curve}/>)}
    <Trees/>
    {TERRITORIES.filter(t=>t.id!=='UNASSIGNED').map(t=><Town key={t.id} territory={t} onSelect={onTerritory}/>)}
    <CivicHQ onSelect={()=>onTerritory('all')} user={user}/>
    <StreetLights/>
    {roads.flatMap((curve,i)=>[0,1].map(n=><Car key={`${i}-${n}`} curve={curve} index={i+n*3} animated={animated}/>))}
    {Array.from({length:14},(_,i)=><Walker key={i} index={i} animated={animated}/>)}
    {records.map(r=><RecordBuilding key={recordKey(r)} record={r} position={placements.get(recordKey(r))} selected={selectedKey===recordKey(r)} onSelect={onSelect}/>)}
    {TERRITORIES.filter(t=>t.id!=='UNASSIGNED').map(t=><Html key={t.id} position={[t.label[0],.8,t.label[1]]} center distanceFactor={95} zIndexRange={[8,0]}><button className={`territory-label ${territory===t.id?'active':''}`} onClick={()=>onTerritory(t.id)}><span>{t.id}</span></button></Html>)}
    <OrbitControls ref={value=>{controls.current=value;controlsRef.current=value}} makeDefault target={[0,0,8]} minDistance={22} maxDistance={450} minPolarAngle={.15} maxPolarAngle={Math.PI/2.4} enableDamping dampingFactor={.09}/>
  </>
}
