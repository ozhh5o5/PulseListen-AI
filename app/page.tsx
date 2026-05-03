import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/db'
import { format } from 'date-fns'
import {
  Activity, AlertTriangle, Shield, Layers, Globe, Brain,
  TrendingUp, FileText, ArrowRight, Zap, Eye
} from 'lucide-react'

async function getDashboardData() {
  const projects = await prisma.project.findMany()

  const totalMentions = await prisma.mention.count()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const mentionsToday = await prisma.mention.count({
    where: { acquiredAt: { gte: today } }
  })

  const adverseEvents = await prisma.mention.count({
    where: { isAdverseEvent: true }
  })

  const novelSignals = await prisma.mention.count({
    where: { isNovelSignal: true }
  })

  const piiRedacted = await prisma.mention.count({
    where: { piiFlags: { not: null } }
  })

  const icsrReports = await prisma.iCSRReport.count()

  const recentMentions = await prisma.mention.findMany({
    take: 8,
    orderBy: { acquiredAt: 'desc' },
    include: { project: true }
  })

  const sentimentCounts = await prisma.mention.groupBy({
    by: ['sentiment'],
    _count: true
  })

  const languageCounts = await prisma.mention.groupBy({
    by: ['detectedLanguage'],
    _count: true
  })

  const stateCounts = await prisma.mention.groupBy({
    by: ['geoState'],
    where: { geoState: { not: null } },
    _count: true,
    orderBy: { _count: { geoState: 'desc' } },
    take: 10
  })

  return {
    totalProjects: projects.length,
    totalMentions,
    mentionsToday,
    adverseEvents,
    novelSignals,
    piiRedacted,
    icsrReports,
    recentMentions,
    sentimentCounts,
    languageCounts,
    stateCounts
  }
}

function getSignalBadgeClass(signalType: string | null) {
  switch (signalType) {
    case 'ADVERSE_EVENT': return 'badge-adverse'
    case 'POSITIVE_EXPERIENCE': return 'badge-positive'
    case 'COMPLAINT': return 'badge-complaint'
    case 'QUESTION': return 'badge-question'
    default: return 'badge-neutral'
  }
}

function getSentimentBadgeClass(sentiment: string | null) {
  switch (sentiment) {
    case 'POSITIVE': return 'badge-positive'
    case 'NEGATIVE': return 'badge-adverse'
    case 'MIXED': return 'badge-complaint'
    default: return 'badge-neutral'
  }
}

const LANG_LABELS: Record<string, string> = {
  en: 'English', hi: 'Hindi', kn: 'Kannada', ta: 'Tamil',
  te: 'Telugu', bn: 'Bengali', mr: 'Marathi'
}

export default async function HomePage() {
  const data = await getDashboardData()

  const kpiCards = [
    { label: 'Total Mentions', value: data.totalMentions, icon: Activity, color: 'from-sky-500 to-sky-600', glow: 'shadow-sky-500/20' },
    { label: 'Adverse Events', value: data.adverseEvents, icon: AlertTriangle, color: 'from-red-500 to-red-600', glow: 'shadow-red-500/20' },
    { label: 'Novel Signals', value: data.novelSignals, icon: Brain, color: 'from-purple-500 to-purple-600', glow: 'shadow-purple-500/20' },
    { label: 'PII Redacted', value: data.piiRedacted, icon: Shield, color: 'from-emerald-500 to-emerald-600', glow: 'shadow-emerald-500/20' },
    { label: 'ICSR Reports', value: data.icsrReports, icon: FileText, color: 'from-amber-500 to-amber-600', glow: 'shadow-amber-500/20' },
    { label: 'Active Projects', value: data.totalProjects, icon: Layers, color: 'from-indigo-500 to-indigo-600', glow: 'shadow-indigo-500/20' },
  ]

  return (
    <div className="p-6 lg:p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">
            Command Center
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Real-time pharmacovigilance & outbreak signal detection
          </p>
        </div>
        <Link href="/projects/new">
          <Button className="bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white border-0 shadow-lg shadow-sky-500/25">
            <Zap className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </Link>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map((kpi) => (
          <div
            key={kpi.label}
            className={`glass rounded-xl p-4 card-hover animate-slide-up`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${kpi.color} flex items-center justify-center shadow-lg ${kpi.glow}`}>
                <kpi.icon className="w-4.5 h-4.5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{kpi.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Middle Row: Sentiment + Languages + Top States */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sentiment Distribution */}
        <div className="glass rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sky-400" />
            Sentiment Distribution
          </h3>
          <div className="space-y-3">
            {data.sentimentCounts.map((s) => {
              const total = data.totalMentions || 1
              const pct = ((s._count / total) * 100).toFixed(1)
              const colors: Record<string, string> = {
                POSITIVE: 'bg-emerald-500',
                NEGATIVE: 'bg-red-500',
                MIXED: 'bg-amber-500',
                NEUTRAL: 'bg-slate-500',
              }
              return (
                <div key={s.sentiment || 'null'} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">{s.sentiment || 'Unknown'}</span>
                    <span className="text-slate-400">{s._count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colors[s.sentiment || ''] || 'bg-slate-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Language Breakdown */}
        <div className="glass rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-400" />
            Languages Detected
          </h3>
          <div className="space-y-2">
            {data.languageCounts.map((l) => (
              <div key={l.detectedLanguage || 'unknown'} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/5 transition-colors">
                <span className="text-sm text-slate-300">
                  {LANG_LABELS[l.detectedLanguage || ''] || l.detectedLanguage || 'Unknown'}
                </span>
                <span className="text-xs font-medium text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full">
                  {l._count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top States */}
        <div className="glass rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            Top States
          </h3>
          <div className="space-y-2">
            {data.stateCounts.slice(0, 8).map((s, i) => (
              <div key={s.geoState} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-500 w-4">{i + 1}</span>
                  <span className="text-sm text-slate-300">{s.geoState}</span>
                </div>
                <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  {s._count}
                </span>
              </div>
            ))}
          </div>
          <Link href="/heatmap" className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 mt-3 transition-colors">
            View Full Heatmap <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Recent Mentions */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Eye className="w-4 h-4 text-sky-400" />
            Recent Mentions
          </h3>
          <Link href="/projects">
            <Button variant="outline" size="sm" className="text-xs border-slate-600 text-slate-300 hover:bg-white/5 hover:text-white">
              View All Projects <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="space-y-3">
          {data.recentMentions.length === 0 ? (
            <p className="text-slate-500 text-center py-8 text-sm">No mentions yet. Create a project and trigger a crawl.</p>
          ) : (
            data.recentMentions.map((mention) => (
              <div
                key={mention.id}
                className="border border-slate-700/50 rounded-lg p-3.5 hover:bg-white/[0.02] transition-colors animate-slide-up"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getSignalBadgeClass(mention.signalType)}`}>
                        {mention.signalType?.replace('_', ' ')}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getSentimentBadgeClass(mention.sentiment)}`}>
                        {mention.sentiment}
                      </span>
                      {mention.isAdverseEvent && (
                        <span className="badge-adverse inline-flex items-center px-2 py-0.5 rounded text-xs font-bold">
                          ⚠ ADVERSE
                        </span>
                      )}
                      {mention.isNovelSignal && (
                        <span className="badge-novel inline-flex items-center px-2 py-0.5 rounded text-xs font-bold">
                          ✦ NOVEL
                        </span>
                      )}
                      {mention.detectedLanguage && mention.detectedLanguage !== 'en' && (
                        <span className="text-xs text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                          {LANG_LABELS[mention.detectedLanguage] || mention.detectedLanguage}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-300 line-clamp-2">{mention.redactedText || mention.rawText}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      <span>{mention.project.name}</span>
                      <span>•</span>
                      <span>{mention.sourceType.replace('_', ' ')}</span>
                      {mention.geoState && (
                        <>
                          <span>•</span>
                          <span>{mention.geoCity}, {mention.geoState}</span>
                        </>
                      )}
                      {mention.postedAt && (
                        <>
                          <span>•</span>
                          <span>{format(mention.postedAt, 'MMM d, yyyy')}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-600 pb-4">
        <p>PulseListen AI — PanIIT AI for Bharat Hackathon — Theme 6: Social Listening for Patient Experience & Safety Signals</p>
      </div>
    </div>
  )
}
