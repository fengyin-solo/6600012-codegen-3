import { useState } from 'react'
import { useSimStore } from '../store/simulation'
import type { SimMode, ParticleEmitter } from '../types'

const MODES: { value: SimMode; label: string; icon: string }[] = [
  { value: 'gravity', label: '重力吸引', icon: '🌍' },
  { value: 'collision', label: '弹性碰撞', icon: '💥' },
  { value: 'fluid', label: '流体模拟', icon: '💧' },
  { value: 'vortex', label: '漩涡旋转', icon: '🌀' },
]

const PRESETS = [
  { id: 'solar', name: '太阳系', params: { mode: 'gravity' as SimMode, gravity: 5, attractorStrength: 8, damping: 0.01, particleCount: 200, emitterMode: false } },
  { id: 'billiards', name: '台球碰撞', params: { mode: 'collision' as SimMode, gravity: 0, damping: 0.005, bounce: 0.95, particleCount: 50, emitterMode: false } },
  { id: 'lava', name: '熔岩灯', params: { mode: 'fluid' as SimMode, gravity: 3, damping: 0.05, particleCount: 150, emitterMode: false } },
  { id: 'tornado', name: '龙卷风', params: { mode: 'vortex' as SimMode, gravity: 2, attractorStrength: 12, damping: 0.02, particleCount: 400, emitterMode: false } },
  { id: 'fireworks', name: '烟花效果', params: { mode: 'gravity' as SimMode, gravity: 8, attractorStrength: 0, damping: 0.01, emitterMode: true, maxParticles: 3000 } },
  { id: 'fountain', name: '喷泉效果', params: { mode: 'gravity' as SimMode, gravity: 12, attractorStrength: 0, damping: 0.02, bounce: 0.5, emitterMode: true, maxParticles: 2000 } },
]

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  accent?: string
  format?: (v: number) => string
}

function Slider({ label, value, min, max, step, onChange, accent = 'blue-500', format }: SliderProps) {
  return (
    <div>
      <label className="text-xs text-gray-400">{label}: {format ? format(value) : value}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className={`w-full accent-${accent}`}
      />
    </div>
  )
}

interface EmitterEditorProps {
  emitter: ParticleEmitter
  index: number
}

function EmitterEditor({ emitter, index }: EmitterEditorProps) {
  const updateEmitter = useSimStore(s => s.updateEmitter)
  const removeEmitter = useSimStore(s => s.removeEmitter)
  const [collapsed, setCollapsed] = useState(false)

  const update = <K extends keyof ParticleEmitter>(key: K, value: ParticleEmitter[K]) => {
    updateEmitter(emitter.id, { [key]: value } as Partial<ParticleEmitter>)
  }

  const updateVec3 = (key: 'position' | 'direction', idx: number, value: number) => {
    const current = emitter[key]
    const newVal: [number, number, number] = [...current] as [number, number, number]
    newVal[idx] = value
    update(key, newVal)
  }

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-800"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: emitter.color }}
          />
          <span className="text-sm font-medium text-white">{emitter.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); update('enabled', !emitter.enabled) }}
            className={`w-10 h-5 rounded-full relative transition ${emitter.enabled ? 'bg-green-600' : 'bg-gray-600'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${emitter.enabled ? 'left-5' : 'left-0.5'}`} />
          </button>
          <span className="text-gray-400 text-xs">{collapsed ? '▼' : '▲'}</span>
          <button
            onClick={(e) => { e.stopPropagation(); removeEmitter(emitter.id) }}
            className="text-red-400 hover:text-red-300 text-sm"
          >
            ✕
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="p-3 space-y-3 bg-gray-800/50 border-t border-gray-700">
          <div className="grid grid-cols-3 gap-2">
            <Slider label="X" value={emitter.position[0]} min={-12} max={12} step={0.5}
              onChange={v => updateVec3('position', 0, v)} accent="red-500" format={v => v.toFixed(1)} />
            <Slider label="Y" value={emitter.position[1]} min={-12} max={12} step={0.5}
              onChange={v => updateVec3('position', 1, v)} accent="green-500" format={v => v.toFixed(1)} />
            <Slider label="Z" value={emitter.position[2]} min={-12} max={12} step={0.5}
              onChange={v => updateVec3('position', 2, v)} accent="blue-500" format={v => v.toFixed(1)} />
          </div>
          <p className="text-xs text-gray-500 -mt-2">发射位置</p>

          <div className="grid grid-cols-3 gap-2">
            <Slider label="Dir X" value={emitter.direction[0]} min={-1} max={1} step={0.1}
              onChange={v => updateVec3('direction', 0, v)} accent="red-500" format={v => v.toFixed(1)} />
            <Slider label="Dir Y" value={emitter.direction[1]} min={-1} max={1} step={0.1}
              onChange={v => updateVec3('direction', 1, v)} accent="green-500" format={v => v.toFixed(1)} />
            <Slider label="Dir Z" value={emitter.direction[2]} min={-1} max={1} step={0.1}
              onChange={v => updateVec3('direction', 2, v)} accent="blue-500" format={v => v.toFixed(1)} />
          </div>
          <p className="text-xs text-gray-500 -mt-2">发射方向</p>

          <Slider label="发射频率 (个/秒)" value={emitter.frequency} min={1} max={200} step={1}
            onChange={v => update('frequency', v)} accent="purple-500" />

          <Slider label="扩散角度" value={emitter.spread} min={0} max={2} step={0.05}
            onChange={v => update('spread', v)} accent="pink-500" format={v => v.toFixed(2)} />

          <Slider label="初始速度" value={emitter.speed} min={0.1} max={15} step={0.1}
            onChange={v => update('speed', v)} accent="cyan-500" format={v => v.toFixed(1)} />

          <Slider label="速度方差" value={emitter.speedVariance} min={0} max={5} step={0.1}
            onChange={v => update('speedVariance', v)} accent="cyan-500" format={v => v.toFixed(1)} />

          <Slider label="粒子寿命 (秒)" value={emitter.particleLife} min={0.5} max={15} step={0.1}
            onChange={v => update('particleLife', v)} accent="yellow-500" format={v => v.toFixed(1)} />

          <Slider label="寿命方差" value={emitter.particleLifeVariance} min={0} max={5} step={0.1}
            onChange={v => update('particleLifeVariance', v)} accent="yellow-500" format={v => v.toFixed(1)} />

          <div className="grid grid-cols-2 gap-2">
            <Slider label="起始大小" value={emitter.startRadius} min={0.05} max={2} step={0.05}
              onChange={v => update('startRadius', v)} accent="orange-500" format={v => v.toFixed(2)} />
            <Slider label="结束大小" value={emitter.endRadius} min={0.01} max={2} step={0.05}
              onChange={v => update('endRadius', v)} accent="orange-500" format={v => v.toFixed(2)} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-400 block mb-1">起始颜色</label>
              <input
                type="color"
                value={emitter.color}
                onChange={e => update('color', e.target.value)}
                className="w-full h-8 rounded border-0 bg-transparent cursor-pointer"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">结束颜色</label>
              <input
                type="color"
                value={emitter.colorEnd}
                onChange={e => update('colorEnd', e.target.value)}
                className="w-full h-8 rounded border-0 bg-transparent cursor-pointer"
              />
            </div>
          </div>

          <Slider label="粒子质量" value={emitter.mass} min={0.1} max={5} step={0.1}
            onChange={v => update('mass', v)} accent="indigo-500" format={v => v.toFixed(1)} />
        </div>
      )}
    </div>
  )
}

export default function ControlPanel() {
  const store = useSimStore()
  const [tab, setTab] = useState<'simulation' | 'emitter'>('simulation')

  return (
    <div className="w-80 bg-gray-900 border-l border-gray-700 flex flex-col h-full">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-bold text-white mb-3">粒子物理模拟器</h2>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => { setTab('simulation'); store.setParam('emitterMode', false) }}
            className={`px-3 py-2 rounded text-sm font-medium transition ${
              tab === 'simulation'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            🎯 静态模式
          </button>
          <button
            onClick={() => { setTab('emitter'); store.setParam('emitterMode', true) }}
            className={`px-3 py-2 rounded text-sm font-medium transition ${
              tab === 'emitter'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            🌟 发射器模式
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {MODES.map(m => (
            <button
              key={m.value}
              onClick={() => store.setMode(m.value)}
              className={`px-3 py-2 rounded text-sm font-medium transition ${
                store.mode === m.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="text-xs text-gray-400 block mb-1">预设场景</label>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(p => (
              <button
                key={p.id}
                onClick={() => {
                  store.applyPreset(p.params)
                  if (p.params.emitterMode) setTab('emitter')
                  else setTab('simulation')
                }}
                className="px-3 py-1 bg-purple-700 hover:bg-purple-600 text-white text-xs rounded-full"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {tab === 'simulation' ? (
          <>
            <div>
              <label className="text-xs text-gray-400">粒子数量: {store.particleCount}</label>
              <input type="range" min={10} max={800} step={10}
                value={store.particleCount}
                onChange={e => store.setParticleCount(Number(e.target.value))}
                className="w-full accent-blue-500" />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="text-xs text-gray-400">最大粒子数: {store.maxParticles}</label>
              <input type="range" min={500} max={5000} step={100}
                value={store.maxParticles}
                onChange={e => store.setParam('maxParticles', Number(e.target.value))}
                className="w-full accent-purple-500" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400 font-medium">
                  粒子发射器 ({store.emitters.length})
                </label>
                <button
                  onClick={() => store.addEmitter()}
                  className="px-2 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded"
                >
                  + 添加发射器
                </button>
              </div>

              {store.emitters.map((emitter, i) => (
                <EmitterEditor key={emitter.id} emitter={emitter} index={i} />
              ))}

              {store.emitters.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-4">
                  暂无发射器，点击上方按钮添加
                </p>
              )}
            </div>
          </>
        )}

        <Slider
          label="重力"
          value={store.gravity}
          min={-20}
          max={20}
          step={0.5}
          onChange={v => store.setParam('gravity', v)}
          accent="green-500"
          format={v => v.toFixed(1)}
        />

        <Slider
          label="阻尼"
          value={store.damping}
          min={0}
          max={0.5}
          step={0.005}
          onChange={v => store.setParam('damping', v)}
          accent="yellow-500"
          format={v => v.toFixed(3)}
        />

        <Slider
          label="弹性"
          value={store.bounce}
          min={0}
          max={1}
          step={0.05}
          onChange={v => store.setParam('bounce', v)}
          accent="orange-500"
          format={v => v.toFixed(2)}
        />

        <Slider
          label="吸引力"
          value={store.attractorStrength}
          min={0}
          max={20}
          step={0.5}
          onChange={v => store.setParam('attractorStrength', v)}
          accent="pink-500"
          format={v => v.toFixed(1)}
        />
      </div>

      <div className="p-4 border-t border-gray-700 space-y-2">
        <div className="flex gap-2">
          <button
            onClick={() => store.setParam('paused', !store.paused)}
            className={`flex-1 py-2 rounded font-medium text-sm ${store.paused ? 'bg-green-600' : 'bg-red-600'} text-white`}
          >
            {store.paused ? '▶ 继续' : '⏸ 暂停'}
          </button>
          <button
            onClick={() => store.setParam('slowMotion', !store.slowMotion)}
            className={`flex-1 py-2 rounded font-medium text-sm ${store.slowMotion ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300'}`}
          >
            🐌 慢动作
          </button>
        </div>
        <button
          onClick={() => store.reset()}
          className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
        >
          🔄 重置粒子
        </button>
      </div>
    </div>
  )
}
