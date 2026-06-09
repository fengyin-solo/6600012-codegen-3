import { useSimStore } from '../store/simulation'

export default function StatsOverlay() {
  const fps = useSimStore(s => s.fps)
  const particleCount = useSimStore(s => s.particleCount)
  const particles = useSimStore(s => s.particles)
  const mode = useSimStore(s => s.mode)
  const energy = useSimStore(s => s.totalEnergy)
  const emitterMode = useSimStore(s => s.emitterMode)
  const emitters = useSimStore(s => s.emitters)
  const maxParticles = useSimStore(s => s.maxParticles)

  const activeEmitters = emitters.filter(e => e.enabled).length

  return (
    <div className="absolute top-3 left-3 bg-black/60 rounded px-3 py-2 text-xs font-mono space-y-1 pointer-events-none">
      <div className="text-green-400">FPS: {fps}</div>
      <div className="text-blue-400">
        粒子数: {emitterMode ? `${particles.length}/${maxParticles}` : particleCount}
      </div>
      <div className="text-yellow-400">模式: {mode}</div>
      <div className="text-purple-400">
        模式类型: {emitterMode ? `🌟 发射器 (${activeEmitters}/${emitters.length})` : '🎯 静态'}
      </div>
      <div className="text-pink-400">总动能: {energy.toFixed(1)}</div>
    </div>
  )
}
