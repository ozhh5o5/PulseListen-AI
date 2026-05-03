import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { prisma } from '@/lib/db'
import { format } from 'date-fns'
import { SentimentChart, SignalChart, TimelineChart } from './charts'
import { ArrowLeft, Activity, AlertTriangle, Brain, Shield, Globe } from 'lucide-react'
import { getNovelClusters } from '@/lib/zero-shot'

async function getProjectData(id: string) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      sources: true,
      mentions: {
        orderBy: { postedAt: 'desc' },
        take: 50
      }
    }
  })

  if (!project) return null

  const adverseCount = await prisma.mention.count({
    where: { projectId: id, isAdverseEvent: true }
  })

  const novelCount = await prisma.mention.count({
    where: { projectId: id, isNovelSignal: true }
  })

  const sentimentCounts = await prisma.mention.groupBy({
    by: ['sentiment'],
    where: { projectId: id },
    _count: true
  })

  const signalCounts = await prisma.mention.groupBy({
    by: ['signalType'],
    where: { projectId: id },
    _count: true
  })

  const adverseMentions = await prisma.mention.findMany({
    where: { projectId: id, isAdverseEvent: true },
    orderBy: { postedAt: 'desc' },
    take: 20
  })

  const novelMentions = await prisma.mention.findMany({
    where: { projectId: id, isNovelSignal: true },
    orderBy: { noveltyScore: 'desc' },
    take: 20
  })

  // Build timeline from mentions (Prisma-compatible, no raw SQL)
  const allMentionsForTimeline = await prisma.mention.findMany({
    where: { projectId: id, postedAt: { not: null } },
    select: { postedAt: true },
    orderBy: { postedAt: 'desc' },
    take: 500
  })
  const timelineMap = new Map<string, number>()
  for (const m of allMentionsForTimeline) {
    if (m.postedAt) {
      const dateStr = format(m.postedAt, 'yyyy-MM-dd')
      timelineMap.set(dateStr, (timelineMap.get(dateStr) || 0) + 1)
    }
  }
  const timelineData = Array.from(timelineMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30)

  const langCounts = await prisma.mention.groupBy({
    by: ['detectedLanguage'],
    where: { projectId: id },
    _count: true
  })

  // Build novel clusters
  const clusterData = novelMentions.map(m => ({
    id: m.id,
    clusterLabel: m.clusterLabel,
    noveltyScore: m.noveltyScore || 0
  }))
  const clusters = getNovelClusters(clusterData)

  return {
    project,
    adverseCount,
    novelCount,
    sentimentCounts,
    signalCounts,
    adverseMentions,
    novelMentions,
    timelineData,
    langCounts,
    clusters
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

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getProjectData(id)

  if (!data || !data.project) {
    return (
      <div className="p-8">
        <div className="glass rounded-xl p-12 text-center">
          <p className="text-slate-400">Project not found</p>
          <Link href="/projects">
            <Button className="mt-4 bg-sky-500 hover:bg-sky-600 text-white">Back to Projects</Button>
          </Link>
        </div>
      </div>
    )
  }

  const { project, adverseCount, novelCount, sentimentCounts, signalCounts, adverseMentions, novelMentions, timelineData, langCounts, clusters } = data
  const keywords = JSON.parse(project.keywords) as string[]

  const sentimentData = sentimentCounts.map(s => ({
    name: s.sentiment || 'Unknown',
    value: s._count
  }))

  const signalData = signalCounts.map(s => ({
    name: s.signalType?.replace('_', ' ') || 'Unknown',
    count: s._count
  }))

  const chartData = timelineData.map(d => ({
    date: format(new Date(d.date), 'MMM d'),
    mentions: Number(d.count)
  }))

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      <div>
        <Link href="/projects" className="text-sky-400 hover:text-sky-300 text-sm mb-2 inline-flex items-center gap-1 transition-colors">
          <ArrowLeft className="w-3 h-3" /> Back to Projects
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">{project.name}</h1>
            {project.description && (
              <p className="text-slate-400 mt-1 text-sm">{project.description}</p>
            )}
          </div>
          <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${
            project.isActive
              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
              : 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
          }`}>
            {project.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-slate-800/50 border border-slate-700/50 p-1 rounded-lg">
          <TabsTrigger value="overview" className="data-[state=active]:bg-sky-500/20 data-[state=active]:text-sky-300 text-slate-400 text-xs px-3">Overview</TabsTrigger>
          <TabsTrigger value="mentions" className="data-[state=active]:bg-sky-500/20 data-[state=active]:text-sky-300 text-slate-400 text-xs px-3">Mentions</TabsTrigger>
          <TabsTrigger value="signals" className="data-[state=active]:bg-sky-500/20 data-[state=active]:text-sky-300 text-slate-400 text-xs px-3">Adverse Events</TabsTrigger>
          <TabsTrigger value="novel" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 text-slate-400 text-xs px-3">Novel Signals</TabsTrigger>
          <TabsTrigger value="sources" className="data-[state=active]:bg-sky-500/20 data-[state=active]:text-sky-300 text-slate-400 text-xs px-3">Sources</TabsTrigger>
          <TabsTrigger value="timeline" className="data-[state=active]:bg-sky-500/20 data-[state=active]:text-sky-300 text-slate-400 text-xs px-3">Timeline</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-sky-400" />
              </div>
              <p className="text-2xl font-bold text-white">{project.mentions.length}</p>
              <p className="text-xs text-slate-400">Total Mentions</p>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
              <p className="text-2xl font-bold text-red-400">{adverseCount}</p>
              <p className="text-xs text-slate-400">Adverse Events</p>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-purple-400">{novelCount}</p>
              <p className="text-xs text-slate-400">Novel Signals</p>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-white">{project.sources.length}</p>
              <p className="text-xs text-slate-400">Active Sources</p>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-2xl font-bold text-white">{keywords.length}</p>
              <p className="text-xs text-slate-400">Keywords</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Sentiment Distribution</h3>
              <SentimentChart data={sentimentData} />
            </div>

            <div className="glass rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Signal Types</h3>
              <SignalChart data={signalData} />
            </div>
          </div>

          {/* Languages */}
          <div className="glass rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Languages & Keywords</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {langCounts.map(l => (
                <span key={l.detectedLanguage || 'unknown'} className="text-xs bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded">
                  {LANG_LABELS[l.detectedLanguage || ''] || l.detectedLanguage || 'Unknown'}: {l._count}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {keywords.map((kw, i) => (
                <span key={i} className="text-xs bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded">{kw}</span>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Mentions Tab */}
        <TabsContent value="mentions" className="space-y-4">
          <div className="glass rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">All Mentions ({project.mentions.length})</h3>

            {project.mentions.length === 0 ? (
              <p className="text-slate-500 text-center py-8 text-sm">No mentions yet</p>
            ) : (
              <div className="space-y-2">
                {project.mentions.map((mention) => (
                  <div key={mention.id} className="border border-slate-700/50 rounded-lg p-3 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${getSignalBadgeClass(mention.signalType)}`}>
                        {mention.signalType?.replace('_', ' ')}
                      </span>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${getSentimentBadgeClass(mention.sentiment)}`}>
                        {mention.sentiment}
                      </span>
                      {mention.isAdverseEvent && (
                        <span className="badge-adverse inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold">⚠ ADVERSE</span>
                      )}
                      {mention.isNovelSignal && (
                        <span className="badge-novel inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold">✦ NOVEL</span>
                      )}
                      {mention.detectedLanguage && mention.detectedLanguage !== 'en' && (
                        <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                          {LANG_LABELS[mention.detectedLanguage]}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-300 line-clamp-2">{mention.redactedText || mention.rawText}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500">
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
                          <span>{format(mention.postedAt, 'MMM d, yyyy HH:mm')}</span>
                        </>
                      )}
                    </div>
                    {mention.reasoning && (
                      <p className="text-[10px] text-slate-500 italic mt-1">{mention.reasoning}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Adverse Events Tab */}
        <TabsContent value="signals" className="space-y-4">
          <div className="glass rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              Adverse Event Signals ({adverseCount})
            </h3>

            {adverseMentions.length === 0 ? (
              <p className="text-slate-500 text-center py-8 text-sm">No adverse events detected</p>
            ) : (
              <div className="space-y-3">
                {adverseMentions.map((mention) => (
                  <div key={mention.id} className="border-l-4 border-red-500/50 bg-red-500/5 p-4 rounded-r-lg">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="badge-adverse inline-flex items-center px-2 py-0.5 rounded text-xs font-bold">ADVERSE EVENT</span>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${getSentimentBadgeClass(mention.sentiment)}`}>
                        {mention.sentiment}
                      </span>
                      {mention.sentimentConfidence && (
                        <span className="text-[10px] text-slate-500">
                          {(mention.sentimentConfidence * 100).toFixed(0)}% confidence
                        </span>
                      )}
                      {mention.diffusionLabel && (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          mention.diffusionLabel === 'VERIFIED_CLUSTER' ? 'badge-verified' :
                          mention.diffusionLabel === 'MISINFORMATION_FLAG' ? 'badge-misinfo' : 'badge-complaint'
                        }`}>
                          {mention.diffusionLabel.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-300 mb-2">{mention.redactedText || mention.rawText}</p>
                    {mention.entities && JSON.parse(mention.entities).length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {JSON.parse(mention.entities).map((e: any, i: number) => (
                          <span key={i} className="text-[10px] bg-slate-700/50 text-slate-300 px-1.5 py-0.5 rounded">
                            {e.type}: {e.value}
                          </span>
                        ))}
                      </div>
                    )}
                    {mention.reasoning && (
                      <p className="text-[10px] text-slate-500 italic">{mention.reasoning}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Novel Signals Tab */}
        <TabsContent value="novel" className="space-y-4">
          {/* Novel Clusters */}
          {Object.keys(clusters).length > 0 && (
            <div className="glass rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                Emerging Unknown Signal Clusters
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(clusters).map(([label, cluster]) => (
                  <div key={label} className="border border-purple-500/20 bg-purple-500/5 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-purple-300 mb-1">{label}</h4>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span><span className="text-white font-semibold">{cluster.count}</span> mentions</span>
                      <span>Avg novelty: <span className="text-purple-300 font-semibold">{(cluster.avgScore * 100).toFixed(0)}%</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="glass rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">
              Novel Mentions ({novelCount})
            </h3>

            {novelMentions.length === 0 ? (
              <p className="text-slate-500 text-center py-8 text-sm">No novel signals detected — all adverse events match known MedDRA terms</p>
            ) : (
              <div className="space-y-3">
                {novelMentions.map((mention) => (
                  <div key={mention.id} className="border-l-4 border-purple-500/50 bg-purple-500/5 p-4 rounded-r-lg">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="badge-novel inline-flex items-center px-2 py-0.5 rounded text-xs font-bold">✦ NOVEL SIGNAL</span>
                      {mention.clusterLabel && (
                        <span className="text-[10px] text-purple-300 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded">
                          {mention.clusterLabel}
                        </span>
                      )}
                      {mention.noveltyScore && (
                        <span className="text-[10px] text-slate-400">
                          Novelty: {(mention.noveltyScore * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-300 mb-2">{mention.redactedText || mention.rawText}</p>
                    {mention.reasoning && (
                      <p className="text-[10px] text-slate-500 italic">{mention.reasoning}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Sources Tab */}
        <TabsContent value="sources" className="space-y-4">
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-300">Configured Sources</h3>
            </div>

            {project.sources.length === 0 ? (
              <p className="text-slate-500 text-center py-8 text-sm">No sources configured</p>
            ) : (
              <div className="space-y-3">
                {project.sources.map((source) => (
                  <div key={source.id} className="border border-slate-700/50 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-sky-500/10 text-sky-300 border border-sky-500/20 px-2 py-0.5 rounded">
                          {source.sourceType.replace('_', ' ')}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          source.cadence === 'REALTIME' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' :
                          source.cadence === 'DAILY' ? 'bg-sky-500/10 text-sky-300 border border-sky-500/20' :
                          'bg-slate-500/10 text-slate-300 border border-slate-500/20'
                        }`}>
                          {source.cadence}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-2">
                        Last crawled: {source.lastCrawledAt ? format(source.lastCrawledAt, 'PPp') : 'Never'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <div className="glass rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Mention Timeline (Last 30 Days)</h3>

            <TimelineChart data={chartData} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
