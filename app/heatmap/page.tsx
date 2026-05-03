import { prisma } from '@/lib/db'
import { aggregateByState } from '@/lib/geo'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Map, AlertTriangle, Brain, TrendingUp } from 'lucide-react'

async function getHeatmapData() {
  const mentions = await prisma.mention.findMany({
    where: { geoState: { not: null } },
    select: {
      geoState: true,
      geoCity: true,
      isAdverseEvent: true,
      isNovelSignal: true,
    }
  })

  const stateData = aggregateByState(mentions)

  const totalMentions = mentions.length
  const totalAdverse = mentions.filter(m => m.isAdverseEvent).length
  const totalNovel = mentions.filter(m => m.isNovelSignal).length

  return { stateData, totalMentions, totalAdverse, totalNovel }
}

// Color intensity based on mention count
function getHeatColor(count: number, max: number): string {
  const intensity = Math.min(count / Math.max(max, 1), 1)
  if (intensity > 0.7) return 'from-red-500/80 to-red-600/80'
  if (intensity > 0.4) return 'from-amber-500/70 to-orange-500/70'
  if (intensity > 0.2) return 'from-yellow-500/60 to-amber-500/60'
  return 'from-sky-500/40 to-sky-600/40'
}

function getBarWidth(count: number, max: number): string {
  return `${Math.max((count / Math.max(max, 1)) * 100, 5)}%`
}

export default async function HeatmapPage() {
  const { stateData, totalMentions, totalAdverse, totalNovel } = await getHeatmapData()
  const maxMentions = stateData[0]?.totalMentions || 1

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold gradient-text flex items-center gap-3">
          <Map className="w-8 h-8 text-sky-400" />
          Geographic Heatmap
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Signal density across Indian states — adverse events and emerging signals by region
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{totalMentions}</p>
            <p className="text-xs text-slate-400">Geo-Tagged Mentions</p>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{totalAdverse}</p>
            <p className="text-xs text-slate-400">Adverse Events</p>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{totalNovel}</p>
            <p className="text-xs text-slate-400">Novel Signals</p>
          </div>
        </div>
      </div>

      {/* State Heatmap Grid */}
      <div className="glass rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">State-wise Signal Density</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {stateData.map((state, idx) => (
            <div
              key={state.state}
              className="border border-slate-700/50 rounded-lg p-4 hover:bg-white/[0.02] transition-all card-hover animate-slide-up"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm text-white">{state.state}</h4>
                <span className="text-xs text-slate-400">{state.topCity}</span>
              </div>

              {/* Bar */}
              <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${getHeatColor(state.totalMentions, maxMentions)} transition-all`}
                  style={{ width: getBarWidth(state.totalMentions, maxMentions) }}
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-400">
                  <span className="font-semibold text-white">{state.totalMentions}</span> mentions
                </span>
                {state.adverseEvents > 0 && (
                  <span className="badge-adverse text-xs px-1.5 py-0.5 rounded">
                    {state.adverseEvents} adverse
                  </span>
                )}
                {state.novelSignals > 0 && (
                  <span className="badge-novel text-xs px-1.5 py-0.5 rounded">
                    {state.novelSignals} novel
                  </span>
                )}
              </div>

              {/* City breakdown */}
              {state.cities.length > 1 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {state.cities.slice(0, 3).map(c => (
                    <span key={c.city} className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                      {c.city}: {c.count}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {stateData.length === 0 && (
          <p className="text-slate-500 text-center py-12">No geographic data available. Run a crawl to generate mention data.</p>
        )}
      </div>

      {/* Legend */}
      <div className="glass rounded-xl p-4">
        <h4 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Heat Scale Legend</h4>
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-2 rounded-full bg-gradient-to-r from-sky-500/40 to-sky-600/40" />
            <span className="text-xs text-slate-400">Low (&lt;20%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-2 rounded-full bg-gradient-to-r from-yellow-500/60 to-amber-500/60" />
            <span className="text-xs text-slate-400">Medium (20-40%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-2 rounded-full bg-gradient-to-r from-amber-500/70 to-orange-500/70" />
            <span className="text-xs text-slate-400">High (40-70%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-2 rounded-full bg-gradient-to-r from-red-500/80 to-red-600/80" />
            <span className="text-xs text-slate-400">Critical (&gt;70%)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
