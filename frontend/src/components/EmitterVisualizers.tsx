import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSimStore } from '../store/simulation'
import type { ParticleEmitter } from '../types'

interface EmitterArrowProps {
  emitter: ParticleEmitter
}

function EmitterArrow({ emitter }: EmitterArrowProps) {
  const groupRef = useRef<THREE.Group>(null)
  const arrowRef = useRef<THREE.ArrowHelper>(null)
  const pulseRef = useRef(0)

  const direction = useMemo(() => {
    const v = new THREE.Vector3(...emitter.direction)
    if (v.lengthSq() === 0) v.set(0, 1, 0)
    v.normalize()
    return v
  }, [emitter.direction])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    pulseRef.current += delta * 2

    if (arrowRef.current) {
      const scale = emitter.enabled
        ? 1 + Math.sin(pulseRef.current) * 0.1
        : 0.6
      arrowRef.current.setLength(2 * scale, 0.5 * scale, 0.3 * scale)
    }
  })

  const color = new THREE.Color(emitter.color)

  return (
    <group
      ref={groupRef}
      position={emitter.position as unknown as THREE.Vector3}
    >
      <mesh>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={emitter.enabled ? 0.9 : 0.4}
        />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.45, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={emitter.enabled ? 0.25 : 0.1}
        />
      </mesh>
      <primitive
        ref={arrowRef as any}
        object={new THREE.ArrowHelper(
          direction,
          new THREE.Vector3(0, 0, 0),
          2,
          color.getHex(),
          0.5,
          0.3
        )}
      />
      <mesh position={[0, -0.35, 0]}>
        <ringGeometry args={[0.25, 0.35, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={emitter.enabled ? 0.5 : 0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}

export default function EmitterVisualizers() {
  const emitters = useSimStore(s => s.emitters)
  const emitterMode = useSimStore(s => s.emitterMode)

  if (!emitterMode) return null

  return (
    <group>
      {emitters.map(emitter => (
        <EmitterArrow key={emitter.id} emitter={emitter} />
      ))}
    </group>
  )
}
