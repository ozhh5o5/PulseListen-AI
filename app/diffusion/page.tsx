'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Share2, ShieldCheck, AlertTriangle, HelpCircle, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MentionSignal {
  id: string
  signalType: string | null
  diffusionLabel: string | null
  spreadPattern: string | null
  redactedText: string | null
  rawText: string
  authorHandle: string | null
  sourceType: string
  sentiment: string | null
  postedAt: string | null
  geoState: string | null
  geoCity: string | null
  project: { name: string }
}

interface DiffusionNode {
  id: string
  label: string
  type: 'source' | 'amplifier' | 'receiver'
  x: number
  y: number
}

interface DiffusionEdge {
  from: string
  to: string
  weight: number
}

function getDiffusionColor(label: string | null) {
  switch (label) {
    case 'VERIFIED_CLUSTER': return { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/30', fill: '#10b981' }
    case 'MISINFORMATION_FLAG': return { bg: 'bg-red-500/15', text: 'text-red-300', border: 'border-red-500/30', fill: '#ef4444' }
    case 'UNDER_REVIEW': return { bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-500/30', fill: '#f59e0b' }
    default: return { bg: 'bg-slate-500/15', text: 'text-slate-300', border: 'border-slate-500/30', fill: '#64748b' }
  }
}

function DiffusionCanvas({ nodes, edges, label }: { nodes: DiffusionNode[]; edges: DiffusionEdge[]; label: string | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || nodes.length === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = canvas.offsetWidth * dpr
    canvas.height = canvas.offsetHeight * dpr
    ctx.scale(dpr, dpr)

    const w = canvas.offsetWidth
    const h = canvas.offsetHeight

    // Scale nodes to fit
    const xs = nodes.map(n => n.x)
    const ys = nodes.map(n => n.y)
    const minX = Math.min(...xs) - 50
    const maxX = Math.max(...xs) + 50
    const minY = Math.min(...ys) - 50
    const maxY = Math.max(...ys) + 50

    const scaleX = w / (maxX - minX)
    const scaleY = h / (maxY - minY)

    function tx(x: number) { return (x - minX) * scaleX }
    function ty(y: number) { return (y - minY) * scaleY }

    // Clear
    ctx.clearRect(0, 0, w, h)

    // Draw edges
    const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]))
    for (const edge of edges) {
      const from = nodeMap[edge.from]
      const to = nodeMap[edge.to]
      if (!from || !to) continue

      ctx.beginPath()
      ctx.moveTo(tx(from.x), ty(from.y))
      ctx.lineTo(tx(to.x), ty(to.y))
      ctx.strokeStyle = label === 'MISINFORMATION_FLAG'
        ? `rgba(239, 68, 68, ${0.2 + edge.weight * 0.3})`
        : label === 'VERIFIED_CLUSTER'
        ? `rgba(16, 185, 129, ${0.2 + edge.weight * 0.3})`
        : `rgba(245, 158, 11, ${0.2 + edge.weight * 0.3})`
      ctx.lineWidth = 1 + edge.weight * 1.5
      ctx.stroke()
    }

    // Draw nodes
    for (const node of nodes) {
      const x = tx(node.x)
      const y = ty(node.y)
      const r = node.type === 'source' ? 8 : node.type === 'amplifier' ? 10 : 5

      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)

      if (node.type === 'amplifier') {
        ctx.fillStyle = '#ef4444'
        ctx.shadowColor = '#ef4444'
        ctx.shadowBlur = 10
      } else if (node.type === 'source') {
        ctx.fillStyle = '#0ea5e9'
        ctx.shadowColor = '#0ea5e9'
        ctx.shadowBlur = 8
      } else {
        ctx.fillStyle = '#64748b'
        ctx.shadowBlur = 0
      }
      ctx.fill()
      ctx.shadowBlur = 0
    }
  }, [nodes, edges, label])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-64 rounded-lg bg-slate-900/50"
      style={{ display: 'block' }}
    />
  )
}

export default function DiffusionPage() {
  const [signals, setSignals] = useState<MentionSignal[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [graphData, setGraphData] = useState<{ nodes: DiffusionNode[]; edges: DiffusionEdge[]; result: any } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/diffusion')
      .then(r => r.json())
      .then(data => {
        setSignals(data.signals || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const selectSignal = useCallback((id: string) => {
    setSelectedId(id)
    fetch(`/api/diffusion/${id}`)
      .then(r => r.json())
      .then(data => setGraphData(data))
      .catch(console.error)
  }, [])

  const counts = {
    verified: signals.filter(s => s.diffusionLabel === 'VERIFIED_CLUSTER').length,
    misinfo: signals.filter(s => s.diffusionLabel === 'MISINFORMATION_FLAG').length,
    review: signals.filter(s => s.diffusionLabel === 'UNDER_REVIEW').length,
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold gradient-text flex items-center gap-3">
          <Share2 className="w-8 h-8 text-sky-400" />
          Temporal Diffusion Graph
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Signal propagation analysis — distinguish genuine outbreaks from bot-amplified misinformation
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{counts.verified}</p>
            <p className="text-xs text-slate-400">Verified Clusters</p>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{counts.misinfo}</p>
            <p className="text-xs text-slate-400">Misinformation Flags</p>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{counts.review}</p>
            <p className="text-xs text-slate-400">Under Review</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Signal List */}
        <div className="glass rounded-xl p-4 lg:col-span-1 max-h-[600px] overflow-y-auto">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Adverse Event Signals</h3>
          {loading ? (
            <p className="text-slate-500 text-sm text-center py-8">Loading signals...</p>
          ) : signals.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No adverse signals found.</p>
          ) : (
            <div className="space-y-2">
              {signals.map(s => {
                const colors = getDiffusionColor(s.diffusionLabel)
                return (
                  <button
                    key={s.id}
                    onClick={() => selectSignal(s.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedId === s.id
                        ? 'border-sky-500/50 bg-sky-500/10'
                        : 'border-slate-700/50 hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${colors.bg} ${colors.text} ${colors.border}`}>
                        {s.diffusionLabel?.replace('_', ' ') || 'PENDING'}
                      </span>
                      <span className="text-[10px] text-slate-500">{s.spreadPattern}</span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-2">{s.redactedText || s.rawText}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{s.project.name}</p>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Graph Visualization */}
        <div className="glass rounded-xl p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Propagation Graph</h3>
          {!graphData ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <Share2 className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Select a signal to visualize its diffusion pattern</p>
            </div>
          ) : (
            <div className="space-y-4">
              <DiffusionCanvas
                nodes={graphData.result.nodes}
                edges={graphData.result.edges}
                label={graphData.result.label}
              />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-[10px] text-slate-400 uppercase">Verdict</p>
                  <p className={`text-sm font-semibold ${getDiffusionColor(graphData.result.label).text}`}>
                    {graphData.result.label.replace('_', ' ')}
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-[10px] text-slate-400 uppercase">Pattern</p>
                  <p className="text-sm font-semibold text-slate-200">{graphData.result.spreadPattern}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-[10px] text-slate-400 uppercase">Unique Sources</p>
                  <p className="text-sm font-semibold text-slate-200">{graphData.result.uniqueSources}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-[10px] text-slate-400 uppercase">Speed</p>
                  <p className="text-sm font-semibold text-slate-200">{graphData.result.diffusionSpeed}</p>
                </div>
              </div>

              <div className="bg-slate-800/30 rounded-lg p-3">
                <p className="text-[10px] text-slate-400 uppercase mb-1">Analysis</p>
                <p className="text-xs text-slate-300">{graphData.result.reasoning}</p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-sky-500" /> Source
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" /> Bot / Amplifier
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-slate-500" /> Receiver
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
