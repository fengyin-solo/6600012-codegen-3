import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSimStore, lerpColor } from '../store/simulation'
import { applyPhysics, updateParticleLifetimes } from '../simulations/physics'
import { emitParticles, clearEmitterStates } from '../simulations/emitter'

const tempObject = new THREE.Object3D()
const tempColor = new THREE.Color()

export default function ParticleSystem() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const particles = useSimStore(s => s.particles)
  const mode = useSimStore(s => s.mode)
  const gravity = useSimStore(s => s.gravity)
  const damping = useSimStore(s => s.damping)
  const bounce = useSimStore(s => s.bounce)
  const attractorStrength = useSimStore(s => s.attractorStrength)
  const slowMotion = useSimStore(s => s.slowMotion)
  const paused = useSimStore(s => s.paused)
  const emitterMode = useSimStore(s => s.emitterMode)
  const emitters = useSimStore(s => s.emitters)
  const maxParticles = useSimStore(s => s.maxParticles)
  const setFps = useSimStore(s => s.setFps)
  const setTotalEnergy = useSimStore(s => s.setTotalEnergy)
  const setParticles = useSimStore(s => s.setParticles)
  const addEmitterParticles = useSimStore(s => s.addEmitterParticles)

  const effectiveMax = emitterMode ? maxParticles : particles.length

  const colorArray = useMemo(
    () => new Float32Array(effectiveMax * 3),
    [effectiveMax]
  )

  useEffect(() => {
    if (emitterMode) {
      clearEmitterStates()
    }
  }, [emitterMode])

  const fpsCounter = useRef({ frames: 0, lastTime: performance.now() })

  useFrame((_, delta) => {
    if (!meshRef.current || paused) return
    const dt = slowMotion ? delta * 0.1 : delta

    let currentParticles = particles

    if (emitterMode) {
      const allNewParticles: ReturnType<typeof emitParticles> = []
      for (const emitter of emitters) {
        const newPs = emitParticles(emitter, delta)
        if (newPs.length > 0) {
          for (const p of newPs) {
            ;(p as any).startRadius = emitter.startRadius
            ;(p as any).endRadius = emitter.endRadius
            ;(p as any).colorStart = emitter.color
            ;(p as any).colorEnd = emitter.colorEnd
          }
          allNewParticles.push(...newPs)
        }
      }
      if (allNewParticles.length > 0) {
        addEmitterParticles(allNewParticles)
        currentParticles = useSimStore.getState().particles
      }
    }

    let updated = applyPhysics(currentParticles, mode, gravity, damping, bounce, attractorStrength, dt)
    updated = updateParticleLifetimes(updated, dt)

    if (emitterMode && updated.length !== currentParticles.length) {
      setParticles(updated)
    }

    let totalEnergy = 0
    const displayCount = Math.min(updated.length, effectiveMax)

    for (let i = 0; i < displayCount; i++) {
      const p = updated[i]
      tempObject.position.set(...p.position)

      let renderRadius = p.radius
      if (p.maxLife !== Infinity) {
        const pr = (p as any)
        if (pr.startRadius !== undefined && pr.endRadius !== undefined) {
          const t = 1 - (p.life / p.maxLife)
          renderRadius = pr.startRadius + (pr.endRadius - pr.startRadius) * t
        }
      }

      const scale = renderRadius * 2
      tempObject.scale.set(scale, scale, scale)
      tempObject.updateMatrix()
      meshRef.current!.setMatrixAt(i, tempObject.matrix)

      let renderColor = p.color
      if (p.maxLife !== Infinity) {
        const pr = (p as any)
        if (pr.colorEnd !== undefined) {
          const t = 1 - (p.life / p.maxLife)
          renderColor = lerpColor(pr.colorStart || p.color, pr.colorEnd, t)
        }
      }

      tempColor.set(renderColor)
      colorArray[i * 3] = tempColor.r
      colorArray[i * 3 + 1] = tempColor.g
      colorArray[i * 3 + 2] = tempColor.b

      totalEnergy += 0.5 * p.mass * (p.velocity[0]**2 + p.velocity[1]**2 + p.velocity[2]**2)
    }

    for (let i = displayCount; i < effectiveMax; i++) {
      tempObject.position.set(0, -10000, 0)
      tempObject.scale.set(0.001, 0.001, 0.001)
      tempObject.updateMatrix()
      meshRef.current!.setMatrixAt(i, tempObject.matrix)
      colorArray[i * 3] = 0
      colorArray[i * 3 + 1] = 0
      colorArray[i * 3 + 2] = 0
    }

    meshRef.current.instanceMatrix.needsUpdate = true
    const colorAttr = meshRef.current.geometry.getAttribute('color') as THREE.InstancedBufferAttribute
    if (colorAttr) {
      colorAttr.needsUpdate = true
    }
    setTotalEnergy(totalEnergy)

    fpsCounter.current.frames++
    const now = performance.now()
    if (now - fpsCounter.current.lastTime > 1000) {
      setFps(fpsCounter.current.frames)
      fpsCounter.current.frames = 0
      fpsCounter.current.lastTime = now
    }
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, effectiveMax]}>
      <sphereGeometry args={[1, 8, 8]}>
        <instancedBufferAttribute attach="attributes-color" args={[colorArray, 3]} />
      </sphereGeometry>
      <meshPhongMaterial vertexColors toneMapped={false} shininess={80} transparent opacity={0.95} />
    </instancedMesh>
  )
}
