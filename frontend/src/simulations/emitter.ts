import type { Particle, ParticleEmitter } from '../types'
import { generateParticleId, lerpColor } from '../store/simulation'

export interface EmitterState {
  emitAccumulator: number
}

const emitterStates = new Map<string, EmitterState>()

function getEmitterState(id: string): EmitterState {
  if (!emitterStates.has(id)) {
    emitterStates.set(id, { emitAccumulator: 0 })
  }
  return emitterStates.get(id)!
}

export function clearEmitterStates() {
  emitterStates.clear()
}

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function normalize(v: [number, number, number]): [number, number, number] {
  const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2])
  if (len === 0) return [0, 1, 0]
  return [v[0] / len, v[1] / len, v[2] / len]
}

function randomInUnitSphere(spread: number): [number, number, number] {
  const u = Math.random()
  const v = Math.random()
  const theta = 2 * Math.PI * u
  const phi = Math.acos(2 * v - 1)
  const r = Math.cbrt(Math.random()) * spread
  return [
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi)
  ]
}

export function emitParticles(
  emitter: ParticleEmitter,
  dt: number
): Particle[] {
  if (!emitter.enabled) return []

  const state = getEmitterState(emitter.id)
  state.emitAccumulator += emitter.frequency * dt

  const particlesToEmit = Math.floor(state.emitAccumulator)
  if (particlesToEmit <= 0) return []

  state.emitAccumulator -= particlesToEmit

  const dir = normalize(emitter.direction)
  const newParticles: Particle[] = []

  for (let i = 0; i < particlesToEmit; i++) {
    const speed = emitter.speed + randomRange(-emitter.speedVariance, emitter.speedVariance)
    const spreadOffset = randomInUnitSphere(emitter.spread)

    const particleDir: [number, number, number] = normalize([
      dir[0] + spreadOffset[0],
      dir[1] + spreadOffset[1],
      dir[2] + spreadOffset[2],
    ])

    const life = emitter.particleLife + randomRange(-emitter.particleLifeVariance, emitter.particleLifeVariance)
    const maxLife = Math.max(0.1, life)

    newParticles.push({
      id: generateParticleId(),
      position: [...emitter.position] as [number, number, number],
      velocity: [
        particleDir[0] * speed,
        particleDir[1] * speed,
        particleDir[2] * speed,
      ],
      mass: emitter.mass,
      color: emitter.color,
      radius: emitter.startRadius,
      life: maxLife,
      maxLife,
    })
  }

  return newParticles
}

export function updateEmitterParticles(particles: Particle[]): Particle[] {
  const alive: Particle[] = []

  for (const p of particles) {
    if (p.maxLife === Infinity) {
      alive.push(p)
      continue
    }

    const newLife = p.life - 1 / 60

    if (newLife <= 0) continue

    const lifeRatio = newLife / p.maxLife
    const t = 1 - lifeRatio

    const newRadius = p.radius
    const lerpedRadius = p.maxLife !== Infinity
      ? (p as any).startRadius !== undefined
        ? (p as any).startRadius + ((p as any).endRadius - (p as any).startRadius) * t
        : newRadius
      : newRadius

    alive.push({
      ...p,
      life: newLife,
      radius: lerpedRadius,
    })
  }

  return alive
}

export function getParticleRenderColor(p: Particle): string {
  if (p.maxLife === Infinity) return p.color
  const t = 1 - (p.life / p.maxLife)
  return lerpColor(p.color, (p as any).colorEnd || p.color, t)
}

export function getParticleRenderRadius(p: Particle, startRadius: number, endRadius: number): number {
  if (p.maxLife === Infinity) return p.radius
  const t = 1 - (p.life / p.maxLife)
  return startRadius + (endRadius - startRadius) * t
}
