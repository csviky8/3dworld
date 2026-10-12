import {useRef} from 'react'
import {createRoot} from 'react-dom/client'
import {Canvas} from '@react-three/fiber'
import AustraliaScene from '../src/world/AustraliaScene.jsx'
import '../src/CrmWorld.css'
export default function Check(){const ref=useRef();return <main className="crm-app"><Canvas shadows frameloop="demand" camera={{position:[20,96,105],fov:38}}><AustraliaScene records={[]} allRecords={[]} placements={new Map()} controlsRef={ref} onSelect={()=>{}} onTerritory={()=>{}} /></Canvas><div className="world-heading"><span className="eyebrow">RENDER VERIFICATION · NO BUSINESS DATA</span><h2>Company workspace</h2></div></main>}
createRoot(document.getElementById('root')).render(<Check/> )

