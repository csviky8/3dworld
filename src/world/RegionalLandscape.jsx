import {useEffect, useLayoutEffect, useMemo, useRef} from 'react'
import {useFrame} from '@react-three/fiber'
import {BufferGeometry, Float32BufferAttribute, Color, Object3D} from 'three'

const TAU=Math.PI*2
const coast=a=>29+2.2*Math.sin(a*3)+1.2*Math.cos(a*7)+.6*Math.sin(a*11)
const height=(x,z)=>.12+Math.max(0,-z-18)*.24+Math.sin(x*.6)*Math.cos(z*.5)*.09

function Box({p,s,c,...props}){return <mesh position={p} castShadow receiveShadow {...props}><boxGeometry args={s}/><meshStandardMaterial color={c} roughness={.72}/></mesh>}

export function NaturalGround(){
  const geometry=useMemo(()=>{
    const positions=[],colors=[],indices=[],color=new Color(),steps=128,rings=22
    for(let j=0;j<=rings;j++)for(let i=0;i<=steps;i++){
      const a=i/steps*TAU,f=j/rings,r=coast(a)*f,x=Math.sin(a)*r,z=Math.cos(a)*r
      let y=height(x,z)
      if(f>.88)y-=((f-.88)/.12)*1.55
      positions.push(x,y,z)
      color.set(f>.93?'#d9c9a3':z<-19?'#758367':'#8eaa70')
      color.offsetHSL(0,0,Math.sin(x*2+z)*.025+Math.cos(z*1.7-x*.8)*.018)
      colors.push(color.r,color.g,color.b)
      if(j<rings&&i<steps){const n=j*(steps+1)+i;indices.push(n,n+1,n+steps+1,n+1,n+steps+2,n+steps+1)}
    }
    const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(positions,3));g.setAttribute('color',new Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();return g
  },[])
  useEffect(()=>()=>geometry.dispose(),[geometry])
  return <mesh geometry={geometry} receiveShadow><meshStandardMaterial vertexColors roughness={1} side={2}/></mesh>
}

export function CoastalForest(){
  const trunks=useRef(),leaves=useRef(),rocks=useRef()
  const points=useMemo(()=>Array.from({length:420},(_,i)=>{
    const a=i*2.39996,r=20.4+(i%17)*.39,x=Math.sin(a)*r,z=Math.cos(a)*r
    if(r>coast(a)-1.7|| (x>17&&z>4) || (x<-18&&z>10))return null
    return [x,height(x,z),z,.7+(Math.sin(i*19)+1)*.45]
  }).filter(Boolean),[])
  useLayoutEffect(()=>{
    const o=new Object3D(),c=new Color()
    points.forEach(([x,y,z,s],i)=>{
      o.position.set(x,y+s*.6,z);o.scale.set(s,s,s);o.updateMatrix();trunks.current.setMatrixAt(i,o.matrix)
      for(let n=0;n<3;n++){
        o.position.set(x+Math.sin(n*2.4+i)*s*.35,y+s*(1.3+n*.32),z+Math.cos(n*2.4+i)*s*.3)
        o.scale.set(s*(.85-n*.12),s*(.75-n*.08),s*(.8-n*.1));o.updateMatrix();leaves.current.setMatrixAt(i*3+n,o.matrix)
        c.set(['#496b43','#627e4c','#385f49','#7f925a'][i%4]);c.offsetHSL(0,0,n*.025);leaves.current.setColorAt(i*3+n,c)
      }
    })
    for(let i=0;i<100;i++){const a=i/100*TAU,r=coast(a)-.5;o.position.set(Math.sin(a)*r,-.8,Math.cos(a)*r);o.scale.set(.6+i%3*.25,.5+i%4*.2,.7);o.rotation.set(i*.3,i*.6,0);o.updateMatrix();rocks.current.setMatrixAt(i,o.matrix)}
    for(const ref of [trunks,leaves,rocks]){ref.current.instanceMatrix.needsUpdate=true;if(ref.current.instanceColor)ref.current.instanceColor.needsUpdate=true}
  },[points])
  return <><instancedMesh ref={trunks} args={[null,null,points.length]} castShadow><cylinderGeometry args={[.09,.16,1.5,6]}/><meshStandardMaterial color='#786c51'/></instancedMesh><instancedMesh ref={leaves} args={[null,null,points.length*3]} castShadow><icosahedronGeometry args={[1,2]}/><meshStandardMaterial roughness={1}/></instancedMesh><instancedMesh ref={rocks} args={[null,null,100]} castShadow><dodecahedronGeometry args={[1,1]}/><meshStandardMaterial color='#968f7a' roughness={1}/></instancedMesh></>
}

function Car({index,animated}){
  const ref=useRef(),phase=useRef(index*.57)
  useFrame((_,delta)=>{if(animated)phase.current+=Math.min(delta,.05)*(.07+index%3*.018)*(index%2?1:-1);const a=phase.current,r=index%2?16.85:17.9;ref.current.position.set(Math.sin(a)*r,.25,Math.cos(a)*r);ref.current.rotation.y=a+(index%2?Math.PI/2:-Math.PI/2)})
  const color=['#ede5d2','#b05e4c','#365d72','#dbb45e','#f6f5e9','#536c58'][index%6]
  return <group ref={ref}><Box p={[0,.25,0]} s={[.6,.3,1.2]} c={color}/><Box p={[0,.49,-.08]} s={[.5,.28,.6]} c={color}/><Box p={[0,.5,.23]} s={[.44,.2,.025]} c='#426275'/><Box p={[0,.5,-.39]} s={[.44,.18,.025]} c='#426275'/>{[-1,1].flatMap(side=>[-.37,.37].map(z=><mesh key={`${side}${z}`} position={[side*.3,.18,z]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.15,.15,.1,10]}/><meshStandardMaterial color='#293536'/></mesh>))}{[-.2,.2].map(x=><Box key={x} p={[x,.27,.61]} s={[.13,.08,.03]} c='#fff2bd'/>)}</group>
}

function Person({index,animated}){
  const body=useRef(),left=useRef(),right=useRef(),time=useRef(index*2.1)
  useFrame((_,delta)=>{if(animated)time.current+=Math.min(delta,.05);const a=time.current*.026+index*.9,r=index%3===0?8.65:19.1;body.current.position.set(Math.sin(a)*r,.2,Math.cos(a)*r);body.current.rotation.y=a+Math.PI/2;left.current.rotation.x=Math.sin(time.current*5)*.4;right.current.rotation.x=-Math.sin(time.current*5)*.4})
  const shirt=['#e7e3cd','#b5664d','#446d8c','#84825a','#c29c6c'][index%5]
  return <group ref={body}><Box p={[0,.64,0]} s={[.24,.37,.16]} c={shirt}/><mesh position={[0,.96,0]} castShadow><sphereGeometry args={[.13,10,8]}/><meshStandardMaterial color={index%2?'#b38462':'#d8b08a'}/></mesh>{[-1,1].map(side=><group key={side} ref={side<0?left:right} position={[side*.075,.46,0]}><Box p={[0,-.2,0]} s={[.095,.4,.1]} c='#394f59'/><Box p={[side*.09,.16,0]} s={[.075,.32,.09]} c={shirt}/></group>)}</group>
}

function Boat({index,animated,ship=false}){
  const ref=useRef(),time=useRef(index*1.1)
  useFrame((_,delta)=>{if(animated)time.current+=Math.min(delta,.05);const a=time.current*(ship?.012:.024)+index*1.8,r=ship?42:35;ref.current.position.set(Math.sin(a)*r,-1.2+Math.sin(time.current*1.2)*.05,Math.cos(a)*r);ref.current.rotation.set(Math.sin(time.current)*.012,a+Math.PI/2,Math.cos(time.current*.9)*.025)})
  return <group ref={ref} scale={ship?1.5:1}>
    <mesh rotation={[Math.PI/2,0,0]} scale={[.8,2.2,.5]} castShadow><capsuleGeometry args={[.65,1.5,4,12]}/><meshStandardMaterial color={ship?'#344e60':'#f1ead9'} roughness={.45}/></mesh>
    <Box p={[0,.28,0]} s={[.85,.16,2.9]} c='#c6ac7e'/>
    {ship?<><Box p={[0,.65,-.9]} s={[.85,.8,.7]} c='#ece7d6'/><Box p={[0,1.13,-.9]} s={[.75,.24,.5]} c='#74949c'/>{[-.25,.35,.95].map((z,i)=><Box key={z} p={[0,.65,z]} s={[.78,.6,.49]} c={['#a46e48','#738578','#adab8c'][i]}/>)}<Box p={[0,1.45,-1]} s={[.22,.4,.2]} c='#ac6950'/></>:<><Box p={[0,.65,-.45]} s={[.58,.62,.85]} c='#eae9da'/><Box p={[0,.72,0]} s={[.48,.26,.03]} c='#51899d'/><mesh position={[0,1.65,.25]}><cylinderGeometry args={[.035,.035,2.7,6]}/><meshStandardMaterial color='#eee8d2'/></mesh><mesh position={[.02,1.85,.3]} rotation={[0,0,-.23]}><coneGeometry args={[.75,1.8,3]}/><meshStandardMaterial color='#fff5db' side={2}/></mesh></>}
    {[-1,1].map(side=><mesh key={side} position={[side*.55,-.18,-2.1]} rotation={[-Math.PI/2,0,side*.18]}><planeGeometry args={[.14,2.8]}/><meshBasicMaterial color='#c3e4de' transparent opacity={.55}/></mesh>)}
  </group>
}

export function RegionalLife({animated}){return <>{Array.from({length:16},(_,i)=><Car key={`car${i}`} index={i} animated={animated}/>)}{Array.from({length:30},(_,i)=><Person key={`person${i}`} index={i} animated={animated}/>)}{Array.from({length:5},(_,i)=><Boat key={`boat${i}`} index={i} animated={animated} ship={i===4}/>)}</>}

export function Harbour(){return <group position={[23,0,13]} rotation={[0,-.5,0]}>
  <Box p={[0,-.12,0]} s={[4,.3,9]} c='#d4c6a8'/><Box p={[3,-.3,0]} s={[8,.28,1]} c='#a49372'/>
  {[-3,0,3].map(z=><group key={z}><Box p={[5,-.3,z]} s={[.65,.24,6]} c='#aa9675'/>{[3,6].map(x=><Box key={x} p={[x,-.7,z]} s={[.18,1.4,.18]} c='#786d5c'/>)}</group>)}
  <Box p={[-.7,.85,-2]} s={[2,1.7,2.3]} c='#eadcc0'/><Box p={[-.7,1.8,-2]} s={[2.3,.22,2.6]} c='#758a80'/>
  <mesh position={[0,2.2,3]} castShadow><cylinderGeometry args={[.5,.8,4.5,16]}/><meshStandardMaterial color='#eae3ca'/></mesh><mesh position={[0,4.5,3]}><cylinderGeometry args={[.7,.7,.65,12]}/><meshStandardMaterial color='#658b92'/></mesh><mesh position={[0,5,3]}><coneGeometry args={[.85,.6,12]}/><meshStandardMaterial color='#a76650'/></mesh>
</group>}

export function Neighbourhoods(){return <>
  {Array.from({length:26},(_,i)=>{const a=i/26*TAU,r=21+(i%2)*2;return <group key={i} position={[Math.sin(a)*r,height(Math.sin(a)*r,Math.cos(a)*r),Math.cos(a)*r]} rotation={[0,a,0]}><Box p={[0,.65,0]} s={[1.4,1.3,1.5]} c={i%3?'#e8dfc8':'#d2c6ae'}/><mesh position={[0,1.6,0]} rotation={[0,Math.PI/4,0]} castShadow><coneGeometry args={[1.25,.85,4]}/><meshStandardMaterial color={i%2?'#9b7256':'#737e76'}/></mesh><Box p={[.34,.65,.76]} s={[.35,.42,.03]} c='#6e969e'/><Box p={[-.32,.45,.76]} s={[.32,.9,.03]} c='#726b59'/></group>})}
  {Array.from({length:28},(_,i)=>{const a=i/28*TAU;return <group key={`lamp${i}`} position={[Math.sin(a)*19.7,.2,Math.cos(a)*19.7]}><Box p={[0,1.1,0]} s={[.055,2.2,.055]} c='#55645b'/><mesh position={[0,2.25,0]}><sphereGeometry args={[.13,8,8]}/><meshStandardMaterial color='#ffebba' emissive='#ffd789' emissiveIntensity={.7}/></mesh></group>})}
</>}

export function RoadDetails({districts}){return <>
  {Array.from({length:96},(_,i)=>{const a=i/96*TAU;return <mesh key={i} position={[Math.sin(a)*17.4,.2,Math.cos(a)*17.4]} rotation={[-Math.PI/2,0,-a]}><planeGeometry args={[.055,.48]}/><meshStandardMaterial color='#e4dcb8'/></mesh>})}
  {districts.map((d,i)=>{const a=i/districts.length*TAU;return <group key={d.id} rotation={[0,a,0]}><Box p={[0,.16,10.9]} s={[1.8,.08,7]} c='#63706b'/><Box p={[0,.21,10.3]} s={[.05,.015,5.8]} c='#e2d8b6'/>{Array.from({length:5},(_,n)=><Box key={n} p={[0,.22,18.2+n*.23]} s={[1.4,.02,.12]} c='#e5dfc7'/>)}</group>})}
</>}

export function Ocean({animated,evening}){
  const water=useRef(),time=useRef(0)
  useFrame((_,delta)=>{if(animated)time.current+=Math.min(delta,.05);water.current.position.x=Math.sin(time.current*.12)*.6;water.current.position.z=Math.cos(time.current*.1)*.5})
  return <><mesh rotation={[-Math.PI/2,0,0]} position={[0,-1.5,0]}><planeGeometry args={[600,600]}/><meshStandardMaterial color={evening?'#315969':'#397f99'} metalness={.3} roughness={.35}/></mesh><group ref={water}>{Array.from({length:150},(_,i)=>{const x=Math.sin(i*127.1)*85,z=Math.cos(i*311.7)*85;if(Math.hypot(x,z)<29)return null;return <mesh key={i} position={[x,-1.44,z]} rotation={[-Math.PI/2,0,.2]}><planeGeometry args={[1.5+i%5,.045]}/><meshBasicMaterial color='#a9d7d5' transparent opacity={.2+i%3*.08}/></mesh>})}</group></>
}

export function WaterfrontLandmarks({region}){return <>
  <group position={[-23,0,10]} rotation={[0,-.4,0]}>
    <Box p={[0,.08,0]} s={[6,.3,6]} c='#d7cbb0'/>
    {Array.from({length:region==='NSW'?5:3},(_,i)=><mesh key={i} position={[-2+i*.9,1.1,0]} rotation={[0,0,-.35+i*.08]} scale={[.8,1.6+i%3*.5,1.8]} castShadow><sphereGeometry args={[1,24,16,0,Math.PI,0,Math.PI*.6]}/><meshStandardMaterial color='#eee9d5' roughness={.55} side={2}/></mesh>)}
  </group>
  <group position={[-20,0,-17]} rotation={[0,-.55,0]}>
    <Box p={[0,1.1,0]} s={[2,.4,17]} c='#75817a'/>
    {[-7,7].map(z=><group key={z}><Box p={[-1.25,1.4,z]} s={[.65,4,.8]} c='#b6ad97'/><Box p={[1.25,1.4,z]} s={[.65,4,.8]} c='#b6ad97'/></group>)}
    {[-1.1,1.1].map(x=><group key={x}>{Array.from({length:21},(_,i)=>{const z=-8+i*.8,y=1.6+3.2*(1-(z/8)**2);return <group key={i}><Box p={[x,y,z]} s={[.16,.2,.95]} c='#657975'/><Box p={[x,(y+1.3)/2,z]} s={[.06,y-1.3,.06]} c='#758681'/></group>})}</group>)}
  </group>
  {Array.from({length:7},(_,i)=><mesh key={i} position={[-10+i*3,1,-24-Math.sin(i)*1.5]} scale={[3.2,2+i%3*.7,3]} castShadow receiveShadow><sphereGeometry args={[1,16,12]}/><meshStandardMaterial color={i%2?'#7c8a66':'#8c9470'} roughness={1}/></mesh>)}
</>}
