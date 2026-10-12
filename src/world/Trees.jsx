export function Tree({ position, scale }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.22, 1.1, 8]} />
        <meshStandardMaterial color="#8b6f52" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.45, 0]} castShadow>
        <coneGeometry args={[0.95, 1.55, 10]} />
        <meshStandardMaterial color="#4b8166" roughness={0.8} />
      </mesh>
      <mesh position={[0, 2.35, 0]} castShadow>
        <coneGeometry args={[0.68, 1.05, 10]} />
        <meshStandardMaterial color="#5b9a78" roughness={0.8} />
      </mesh>
    </group>
  )
}

