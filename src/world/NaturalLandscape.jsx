import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { BufferGeometry, CatmullRomCurve3, Color, DataTexture, Float32BufferAttribute, IcosahedronGeometry, Object3D, RepeatWrapping, RGBAFormat, Shape, Vector3 } from 'three'
import { COAST, TAS, routeTo } from './naturalGeometry.js'
import { TERRITORIES } from '../crm/worldModel.js'

const hash=n=>{const s=Math.sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s)}
function inside(x,z,points){let yes=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const [xi,zi]=points[i],[xj,zj]=points[j];if(((zi>z)!==(zj>z))&&x<(xj-xi)*(z-zi)/(zj-zi)+xi)yes=!yes}return yes}
const paths=TERRITORIES.filter(t=>t.id!=='UNASSIGNED').flatMap(t=>routeTo(t.position).getPoints(80))
function reserve(x,z){
  let d=Math.hypot(x-2,z+2)-9
  d=Math.min(d,Math.max(Math.abs(x-1)-10,Math.abs(z-17.5)-9))
  for(const t of TERRITORIES)d=Math.min(d,Math.hypot(x-t.position[0],z-t.position[2])-6)
  for(const p of paths)d=Math.min(d,Math.hypot(x-p.x,z-p.z)-1.3)
  return Math.max(0,Math.min(1,d/3))
}
function height(x,z){
  const west=5.2*Math.exp(-((x+33)**2/100+(z+7)**2/270))
  const north=7.5*Math.exp(-((x+13)**2/160+(z+22)**2/65))
  const east=8*Math.exp(-((x-30)**2/28+(z-2)**2/200))
  const texture=(Math.sin(x*.8+Math.cos(z*.6))*Math.cos(z*.65)+Math.sin(x*1.6+z*.9)*.3)*.6
  return .43+reserve(x,z)*Math.max(0,(west+north+east)*(1+texture*.4)+texture*.35)
}
function smoothOutline(points){return new CatmullRomCurve3(points.map(([x,z])=>new Vector3(x,0,z)),true,'catmullrom',.2).getPoints(points.length*6).map(p=>[p.x,p.z])}
function CoastLand({points}){
  const grain=useMemo(()=>{const data=new Uint8Array(128*128*4);for(let i=0;i<128*128;i++){const v=110+hash(i)*145;data.set([v,v,v,255],i*4)}const t=new DataTexture(data,128,128,RGBAFormat);t.wrapS=t.wrapT=RepeatWrapping;t.repeat.set(35,35);t.needsUpdate=true;return t},[])
  useEffect(()=>()=>grain.dispose(),[grain])
  const outline=useMemo(()=>smoothOutline(points),[points])
  const shape=useMemo(()=>{const s=new Shape();outline.forEach(([x,z],i)=>i?s.lineTo(x,-z):s.moveTo(x,-z));s.closePath();return s},[outline])
  const terrain=useMemo(()=>{
    const vs=[],cs=[],indices=[],color=new Color(),grass=new Color('#557c39'),sand=new Color('#b29c56'),rust=new Color('#ad7141'),stone=new Color('#9c9980')
    const step=.65
    for(let z=-41;z<52;z+=step)for(let x=-49;x<44;x+=step){
      if(![[x,z],[x+step,z],[x,z+step],[x+step,z+step]].every(([a,b])=>inside(a,b,outline)))continue
      const start=vs.length/3
      for(const [dx,dz] of [[0,0],[step,0],[0,step],[step,step]]){const px=x+dx,pz=z+dz,y=height(px,pz);vs.push(px,y,pz)
        color.copy(grass).lerp(sand,Math.max(0,Math.min(.9,(-px+12)/55)))
        if(pz<-11&&px<10)color.lerp(rust,Math.min(.85,(-pz-11)/15))
        if(y>3)color.lerp(stone,Math.min(.8,(y-3)/5))
        color.multiplyScalar(.92+.12*Math.sin(px*2.1+pz*1.8)*Math.cos(pz*2.7))
        cs.push(color.r,color.g,color.b)}
      indices.push(start,start+2,start+1,start+1,start+2,start+3)
    }
    const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(vs,3));g.setAttribute('color',new Float32BufferAttribute(cs,3));g.setAttribute('uv',new Float32BufferAttribute(vs.flatMap((_,i)=>i%3===0?[vs[i]/95,vs[i+2]/95]:[]),2));g.setIndex(indices);g.computeVertexNormals();return g
  },[outline])
  useEffect(()=>()=>terrain.dispose(),[terrain])
  return <>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-1.65,0]} receiveShadow castShadow><extrudeGeometry args={[shape,{depth:1.85,bevelEnabled:true,bevelSize:.45,bevelThickness:.22,bevelSegments:3}]}/><meshStandardMaterial color='#c2aa78' roughness={.95}/></mesh>
    <mesh geometry={terrain} castShadow receiveShadow><meshStandardMaterial vertexColors roughness={.93} bumpMap={grain} bumpScale={.14}/></mesh>
    {[1.025,1.065,1.12].map((scale,i)=><mesh key={scale} rotation={[-Math.PI/2,0,0]} position={[0,-1.42-i*.035,0]} scale={[scale,scale,1]}><shapeGeometry args={[shape]}/><meshBasicMaterial color={['#82cfc6','#38b5bd','#138fba'][i]} transparent opacity={.44-i*.08}/></mesh>)}
  </>
}
function Forest(){
  const trunks=useRef(),leaves=useRef()
  const crown=useMemo(()=>{const g=new IcosahedronGeometry(1,3),p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),r=.85+.15*Math.sin(x*24+z*17)*Math.cos(y*21-z*11);p.setXYZ(i,x*r,y*r*1.35,z*r)}g.computeVertexNormals();return g},[])
  useEffect(()=>()=>crown.dispose(),[crown])
  const points=useMemo(()=>{const out=[];for(let i=0;i<3400;i++){const x=hash(i*3)*91-47,z=hash(i*3+1)*91-40;if(!inside(x,z,COAST)&&!inside(x,z,TAS))continue;if(reserve(x,z)<.28)continue;if(x<4&&z<-10&&hash(i+7)>.14)continue;if(x<-18&&hash(i+9)>.38)continue;out.push([x,height(x,z),z,.55+hash(i+2)*.85])}return out},[])
  useLayoutEffect(()=>{const o=new Object3D(),c=new Color();points.forEach(([x,y,z,s],i)=>{
    o.position.set(x,y+s*.7,z);o.scale.set(s,s,s);o.rotation.set(0,hash(i)*6.28,0);o.updateMatrix();trunks.current.setMatrixAt(i,o.matrix)
    for(let n=0;n<3;n++){o.position.set(x+Math.sin(n*2.1+i)*s*.3,y+s*(1.05+n*.32),z+Math.cos(n*2.1+i)*s*.3);o.scale.set(s*(.72-n*.12),s*(.75-n*.1),s*(.62-n*.1));o.updateMatrix();leaves.current.setMatrixAt(i*3+n,o.matrix);c.set(['#285b30','#39723a','#547d3b','#6c853e'][i%4]);c.multiplyScalar(.9+hash(i+n)*.3);leaves.current.setColorAt(i*3+n,c)}
  });trunks.current.instanceMatrix.needsUpdate=true;leaves.current.instanceMatrix.needsUpdate=true;leaves.current.instanceColor.needsUpdate=true},[points])
  return <><instancedMesh ref={trunks} args={[null,null,points.length]} castShadow><cylinderGeometry args={[.055,.13,1.8,6]}/><meshStandardMaterial color='#655139'/></instancedMesh><instancedMesh ref={leaves} args={[crown,null,points.length*3]} castShadow receiveShadow><meshStandardMaterial roughness={1}/></instancedMesh></>
}
function Ocean(){
  return <mesh rotation={[-Math.PI/2,0,0]} position={[0,-1.65,0]}><planeGeometry args={[2200,2200]}/><shaderMaterial vertexShader={`varying vec3 world; void main(){world=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);}`} fragmentShader={`varying vec3 world;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
    float waves(vec2 p){return noise(p)*.55+noise(p*2.1)*.25+noise(p*4.3)*.13+noise(p*8.1)*.07;}
    void main(){vec2 p=world.xz*1.2;float h=waves(p);float dx=waves(p+vec2(.08,0))-h,dz=waves(p+vec2(0,.08))-h;
    vec3 n=normalize(vec3(dx*.9,1.,dz*.9));vec3 view=normalize(cameraPosition-world);float fresnel=pow(1.-max(dot(n,view),0.),3.);float sun=pow(max(dot(reflect(-normalize(vec3(-.5,.9,.4)),n),view),0.),80.);
    vec3 color=mix(vec3(.018,.18,.32),vec3(.09,.35,.47),fresnel);color+=(h-.5)*.07+pow(h,9.)*.5+sun*.4;gl_FragColor=vec4(color,1.);}`}/></mesh>
}
function OffshoreIslands(){
  return <>{[[-58,-27,3],[-52,26,2.2],[43,-29,2.7],[52,3,2],[-29,38,1.8],[40,42,2.5],[6,48,1.4]].map(([x,z,s],i)=><group key={i} position={[x,-1.35,z]}><mesh rotation={[-Math.PI/2,0,0]}><circleGeometry args={[s*1.6,40]}/><meshBasicMaterial color='#2cb5bc' transparent opacity={.4}/></mesh><mesh scale={[s,s*.7,s*.7]} position={[0,.4,0]} castShadow receiveShadow><sphereGeometry args={[1,20,14]}/><meshStandardMaterial color={i%2?'#83905b':'#a9986e'} roughness={.95}/></mesh><mesh scale={[s*.7,s*.4,s*.55]} position={[0,s*.3,0]} castShadow><sphereGeometry args={[1,16,12]}/><meshStandardMaterial color='#527846' roughness={1}/></mesh></group>)}</>
}
export default function NaturalLandscape(){return <><Ocean/><CoastLand points={COAST}/><CoastLand points={TAS}/><Forest/><OffshoreIslands/></>}


