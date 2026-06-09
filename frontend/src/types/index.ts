export type SimMode = 'gravity' | 'collision' | 'fluid' | 'vortex'

export interface Particle {
  id: number
  position: [number, number, number]
  velocity: [number, number, number]
  mass: number
  color: string
  radius: number
  life: number
  maxLife: number
}

export interface ParticleEmitter {
  id: string
  name: string
  enabled: boolean
  position: [number, number, number]
  direction: [number, number, number]
  spread: number
  frequency: number
  speed: number
  speedVariance: number
  particleLife: number
  particleLifeVariance: number
  startRadius: number
  endRadius: number
  color: string
  colorEnd: string
  mass: number
}

export interface SimulationParams {
  mode: SimMode
  particleCount: number
  gravity: number
  damping: number
  bounce: number
  attractorStrength: number
  slowMotion: boolean
  paused: boolean
  emitterMode: boolean
  maxParticles: number
}

export interface Preset {
  id: string
  name: string
  params: Partial<SimulationParams>
}
