import { Text } from '@react-three/drei'
import { toneColor, recordKind } from '../crm/recordTypes.js'

function initials(name) {
  return String(name || '?').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?'
}

export function Person({ position, record, selected, dimmed, onSelect }) {
  const kind = recordKind(record)
  const color = toneColor(record.tone)
  const tall = kind === 'employee'
  const body = tall ? [0.62, 0.72, 0.62] : [0.5, 1.5, 0.5]
  const py = tall ? 0.36 : 0.75
  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onSelect(record) }} onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer' }} onPointerOut={() => { document.body.style.cursor = 'auto' }}>
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.62, 0.8, 28]} />
        <meshBasicMaterial color={selected ? '#20342d' : color} transparent opacity={selected ? 0.9 : 0.55} />
      </mesh>
      <mesh position={[0, py, 0]} castShadow>
        <cylinderGeometry args={[body[0] / 2, body[0] / 2, body[1], 18]} />
        <meshStandardMaterial color={dimmed ? '#c9d3cb' : color} roughness={0.6} />
      </mesh>
      <mesh position={[0, py + body[1] / 2 + 0.28, 0]} castShadow>
        <sphereGeometry args={[0.3, 18, 18]} />
        <meshStandardMaterial color={dimmed ? '#d7ded8' : '#f2ddc4'} roughness={0.65} />
      </mesh>
      <Text position={[0, 2.35, 0]} fontSize={0.36} color={selected ? '#16281f' : '#395046'} anchorX="center" anchorY="middle">
        {record.name}
      </Text>
      <Text position={[0, 1.92, 0]} fontSize={0.28} color={color} anchorX="center" anchorY="middle">
        {`${record.id} · ${record.status}`}
      </Text>
      {kind === 'employee' && (
        <Text position={[0, 1.55, 0]} fontSize={0.26} color="#20342d" anchorX="center" anchorY="middle">
        {initials(record.name)}
        </Text>
      )}
    </group>
  )
}

export function RecordPost({ position, record, selected, dimmed, onSelect }) {
  const color = toneColor(record.tone)
  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onSelect(record) }} onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer' }} onPointerOut={() => { document.body.style.cursor = 'auto' }}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[0.42, 0.9, 0.42]} />
        <meshStandardMaterial color={dimmed ? '#c9d3cb' : color} roughness={0.55} />
      </mesh>
      <mesh position={[0, 1.05, 0]}>
        <sphereGeometry args={[0.2, 14, 14]} />
        <meshStandardMaterial color={selected ? '#20342d' : '#ffffff'} emissive={color} emissiveIntensity={selected ? 0.1 : 0.65} />
      </mesh>
      <Text position={[0, 1.62, 0]} fontSize={0.3} color="#2c4238" anchorX="center" anchorY="middle">
        {record.id}
      </Text>
    </group>
  )
}

