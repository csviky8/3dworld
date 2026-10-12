import {useEffect,useLayoutEffect,useRef,useState} from 'react'
import {TERRITORIES} from '../crm/worldModel.js'
import './WorldOverview.css'

// Coordinates are measured against the approved 1536 × 1024 artwork.
const HUBS=[{id:'WA',x:29.2,y:15.5},{id:'NT',x:48,y:6.8},{id:'QLD',x:71.2,y:13.3},{id:'SA',x:21.9,y:37.8},{id:'NSW',x:80.6,y:35.3},{id:'VIC',x:41.4,y:58.4},{id:'ACT',x:82.2,y:51.2},{id:'TAS',x:71.2,y:81.6},{id:'all',x:49.8,y:36.7}]
export default function WorldOverview({onTerritory,territory='all',controlsRef,resetToken=0}){
  const frame=useRef(null),[size,setSize]=useState({width:0,height:0}),[zoom,setZoom]=useState(1),[failed,setFailed]=useState(false)
  useLayoutEffect(()=>{const element=frame.current;const observer=new ResizeObserver(([entry])=>setSize({width:entry.contentRect.width,height:entry.contentRect.height}));observer.observe(element);return()=>observer.disconnect()},[])
  useEffect(()=>{controlsRef.current={dollyIn:scale=>setZoom(z=>Math.min(3,z/scale)),dollyOut:scale=>setZoom(z=>Math.max(1,z*scale)),update:()=>{}};return()=>{controlsRef.current=null}},[controlsRef])
  useEffect(()=>{frame.current?.scrollTo({left:0,top:0});setZoom(1)},[resetToken]) // eslint-disable-line react-hooks/set-state-in-effect
  const width=Math.min(size.width,size.height*1.5)*zoom,height=width/1.5
  return <section ref={frame} className='world-overview' aria-label='Australian CRM world map' tabIndex={0}>
    <div className='overview-scroll' style={{minWidth:width,minHeight:height}}><div className='overview-art' style={{width,height}}>
      <img src={`${import.meta.env.BASE_URL}references/meta-world-natural-v2.png`} alt='Australian island CRM world with a central glass-globe headquarters, connected regional cities, forests, mountains, beaches and Tasmania.' draggable={false} onError={()=>setFailed(true)}/>
      {!failed&&HUBS.map(h=>{const label=h.id==='all'?'Open company workspace':`Explore ${TERRITORIES.find(t=>t.id===h.id).name}`;return <button key={h.id} className={`world-hotspot ${h.id==='all'?'headquarters-hotspot':''} ${territory===h.id&&h.id!=='all'?'selected':''}`} style={{left:`${h.x}%`,top:`${h.y}%`}} aria-label={label} title={label} onClick={()=>onTerritory(h.id)}><span className='sr-only'>{label}</span></button>})}
      {failed&&<p className='overview-error' role='alert'>World artwork could not load. Use Find a record to access your CRM data.</p>}
    </div></div>
  </section>
}
