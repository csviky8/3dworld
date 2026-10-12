import {useRef,useState} from 'react'
import {createRoot} from 'react-dom/client'
import {Plus,Minus,Home,Globe2,X} from 'lucide-react'
import WorldOverview from '../src/world/WorldOverview.jsx'
import {cameraZoom,TERRITORIES} from '../src/crm/worldModel.js'
import '../src/CrmWorld.css'
export default function OverviewPreview(){const ref=useRef(),[reset,setReset]=useState(0),[territory,setTerritory]=useState('all'),[open,setOpen]=useState(false);return <main className='crm-app image-world'><WorldOverview controlsRef={ref} resetToken={reset} territory={territory} onTerritory={id=>{setTerritory(id);setOpen(true)}}/>{open&&<aside className='inspector'><button aria-label='Close details' className='inspector-close icon-button' onClick={()=>setOpen(false)}><X size={18}/></button><h2>{territory==='all'?'Company workspace':TERRITORIES.find(t=>t.id===territory).name}</h2><p className='quiet-note'>Artwork interaction preview. Sign in to access your actual CRM records.</p><a href='/'>Open CRM</a></aside>}<div className='map-tools'><button aria-label='Zoom in' onClick={()=>cameraZoom(ref.current,true)}><Plus/></button><button aria-label='Zoom out' onClick={()=>cameraZoom(ref.current,false)}><Minus/></button><button aria-label='Reset overview' onClick={()=>{setReset(r=>r+1);setOpen(false);setTerritory('all')}}><Home/></button></div><a className='scene-mode-toggle' href='/'><Globe2 size={16}/>Open CRM</a></main>}
createRoot(document.getElementById('root')).render(<OverviewPreview/> )
