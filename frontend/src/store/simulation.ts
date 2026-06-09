import { create } from 'zustand'
import type { SimMode, SimulationParams, Particle, ParticleEmitter } from '../types'

const COLORS = ['#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#c084fc','#f472b6','#38bdf8']

let particleIdCounter = 801

function randomParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    position: [
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20,
    ] as [number, number, number],
    velocity: [
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
    ] as [number, number, number],
    mass: 0.5 + Math.random() * 2,
    color: COLORS[i % COLORS.length],
    radius: 0.15 + Math.random() * 0.35,
    life: Infinity,
    maxLife: Infinity,
  }))
}

function createDefaultEmitter(id: string, name: string, position: [number, number, number], color: string): ParticleEmitter {
  return {
    id,
    name,
    enabled: true,
    position,
    direction: [0, 1, 0],
    spread: 0.3,
    frequency: 30,
    speed: 3,
    speedVariance: 1,
    particleLife: 3,
    particleLifeVariance: 1,
    startRadius: 0.3,
    endRadius: 0.05,
    color,
    colorEnd: color,
    mass: 1,
  }
}

interface SimStore extends SimulationParams {
  particles: Particle[]
  fps: number
  totalEnergy: number
  emitters: ParticleEmitter[]
  setMode: (mode: SimMode) => void
  setParticleCount: (count: number) => void
  setParam: <K extends keyof SimulationParams>(key: K, value: SimulationParams[K]) => void
  reset: () => void
  setFps: (fps: number) => void
  setTotalEnergy: (e: number) => void
  applyPreset: (preset: Partial<SimulationParams>) => void
  setParticles: (particles: Particle[]) => void
  addEmitter: () => void
  removeEmitter: (id: string) => void
  updateEmitter: (id: string, updates: Partial<ParticleEmitter>) => void
  setEmitterPosition: (id: string, position: [number, number, number]) => void
  addEmitterParticles: (newParticles: Particle[]) => void
}

export const useSimStore = create<SimStore>((set, get) => ({
  mode: 'gravity',
  particleCount: 300,
  gravity: 9.8,
  damping: 0.02,
  bounce: 0.7,
  attractorStrength: 5,
  slowMotion: false,
  paused: false,
  emitterMode: false,
  maxParticles: 2000,
  particles: randomParticles(300),
  fps: 0,
  totalEnergy: 0,
  emitters: [
    createDefaultEmitter('emitter-1', '发射器 1', [-5, 0, 0], '#ff6b6b'),
    createDefaultEmitter('emitter-2', '发射器 2', [5, 0, 0], '#4d96ff'),
  ],
  setMode: (mode) => set({ mode }),
  setParticleCount: (count) => {
    particleIdCounter = count
    set({ particleCount: count, particles: randomParticles(count) })
  },
  setParam: (key, value) => set({ [key]: value } as any),
  reset: () => {
    const { particleCount } = get()
    particleIdCounter = particleCount
    set({ particles: randomParticles(particleCount) })
  },
  setFps: (fps) => set({ fps }),
  setTotalEnergy: (e) => set({ totalEnergy: e }),
  applyPreset: (preset) => {
    set({ ...preset } as any)
    const { particleCount } = get()
    particleIdCounter = particleCount
    set({ particles: randomParticles(particleCount) })
  },
  setParticles: (particles) => set({ particles }),
  addEmitter: () => {
    const { emitters } = get()
    const num = emitters.length + 1
    const newEmitter = createDefaultEmitter(
      `emitter-${Date.now()}`,
      `发射器 ${num}`,
      [(Math.random() - 0.5) * 10, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 10],
      COLORS[num % COLORS.length]
    )
    set({ emitters: [...emitters, newEmitter] })
  },
  removeEmitter: (id) => {
    set({ emitters: get().emitters.filter(e => e.id !== id) })
  },
  updateEmitter: (id, updates) => {
    set({
      emitters: get().emitters.map(e =>
        e.id === id ? { ...e, ...updates } : e
      )
    })
  },
  setEmitterPosition: (id, position) => {
    set({
      emitters: get().emitters.map(e =>
        e.id === id ? { ...e, position } : e
      )
    })
  },
  addEmitterParticles: (newParticles) => {
    const { maxParticles, particles } = get()
    let combined = [...particles, ...newParticles]
    if (combined.length > maxParticles) {
      combined = combined.slice(combined.length - maxParticles)
    }
    set({ particles: combined })
  },
}))

export function generateParticleId(): number {
  return particleIdCounter++
}

export function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1)
  const c2 = hexToRgb(color2)
  const r = Math.round(c1.r + (c2.r - c1.r) * t)
  const g = Math.round(c1.g + (c2.g - c1.g) * t)
  const b = Math.round(c1.b + (c2.b - c1.b) * t)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 255, g: 255, b: 255 }
}
