import {useRef,useState} from 'react'
import {createRoot} from 'react-dom/client'
import {Canvas} from '@react-three/fiber'
import AustraliaScene from '../src/world/AustraliaScene.jsx'
import {cameraZoom,TERRITORIES} from '../src/crm/worldModel.js'
import '../src/CrmWorld.css'
export default function NaturalWorldPreview(){
  const ref=useRef(),[territory,setTerritory]=useState('all'),[target,setTarget]=useState(null),[reset,setReset]=useState(0)
  function select(id){setTerritory(id);setTarget(TERRITORIES.find(t=>t.id===id)?.position||null);if(id==='all')setReset(v=>v+1)}
  return <main className="crm-app"><Canvas shadows frameloop="demand" dpr={[1,1.5]} camera={{position:[12,83,102],fov:38}}><AustraliaScene records={[]} allRecords={[]} placements={new Map()} controlsRef={ref} onSelect={()=>{}} onTerritory={select} territory={territory} cameraTarget={target} resetToken={reset}/></Canvas><div className="world-heading" style={{left:24,top:24}}><span className="eyebrow">STEP 01 / NATURAL WORLD</span><h2>Meta World CRM</h2><p>Environment preview · no business data</p></div><div className="map-tools"><button aria-label="Zoom in" onClick={()=>cameraZoom(ref.current,true)}>+</button><button aria-label="Zoom out" onClick={()=>cameraZoom(ref.current,false)}>−</button><button style={{width:90}} onClick={()=>select('all')}>Reset view</button></div><footer className="world-footer"><span>{territory==='all'?'AUSTRALIA':TERRITORIES.find(t=>t.id===territory)?.name}</span><span>Drag to orbit · Scroll to zoom · Select a regional landmark</span><a href="/" style={{color:'inherit'}}>Open CRM</a></footer></main>
}
createRoot(document.getElementById('root')).render(<NaturalWorldPreview/> )
