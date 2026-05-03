import { prisma } from '@/lib/db'
import Link from 'next/link'
import { FileText, Download, AlertTriangle, Shield, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'

async function getICSRData() {
  const reports = await prisma.iCSRReport.findMany({
    orderBy: { generatedAt: 'desc' },
    take: 100
  })

  // Get related mentions
  const mentionIds = reports.map(r => r.mentionId)
  const mentions = await prisma.mention.findMany({
    where: { id: { in: mentionIds } },
    include: { project: true }
  })

  const mentionMap = Object.fromEntries(mentions.map(m => [m.id, m]))

  return reports.map(r => ({
    ...r,
    mention: mentionMap[r.mentionId] || null,
    parsed: JSON.parse(r.reportJson)
  }))
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'LIFE_THREATENING': return 'bg-red-500/20 text-red-300 border-red-500/30'
    case 'SEVERE': return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
    case 'MODERATE': return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    case 'MILD': return 'bg-sky-500/20 text-sky-300 border-sky-500/30'
    default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30'
  }
}

export default async function ICSRPage() {
  const reports = await getICSRData()

  const severityCounts = {
    MILD: reports.filter(r => r.severity === 'MILD').length,
    MODERATE: reports.filter(r => r.severity === 'MODERATE').length,
    SEVERE: reports.filter(r => r.severity === 'SEVERE').length,
    LIFE_THREATENING: reports.filter(r => r.severity === 'LIFE_THREATENING').length,
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold gradient-text flex items-center gap-3">
          <FileText className="w-8 h-8 text-sky-400" />
          ICSR Reports
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Individual Case Safety Reports — auto-generated for CDSCO / WHO VigiBase submission
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(severityCounts).map(([severity, count]) => (
          <div key={severity} className="glass rounded-xl p-4">
            <p className="text-xs text-slate-400 mb-1">{severity.replace('_', ' ')}</p>
            <p className="text-2xl font-bold text-white">{count}</p>
            <div className={`mt-2 h-1 rounded-full ${
              severity === 'LIFE_THREATENING' ? 'bg-red-500' :
              severity === 'SEVERE' ? 'bg-orange-500' :
              severity === 'MODERATE' ? 'bg-amber-500' : 'bg-sky-500'
            }`} style={{ width: `${Math.max((count / Math.max(reports.length, 1)) * 100, 5)}%` }} />
          </div>
        ))}
      </div>

      {/* Reports List */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            Generated Reports ({reports.length})
          </h3>
        </div>

        {reports.length === 0 ? (
          <p className="text-slate-500 text-center py-12">No ICSR reports generated yet. Adverse events will auto-generate reports.</p>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <details
                key={report.id}
                className="border border-slate-700/50 rounded-lg overflow-hidden group"
              >
                <summary className="px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-mono font-semibold text-sky-400">{report.parsed.reportId}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getSeverityColor(report.severity)}`}>
                      {report.severity}
                    </span>
                    {report.parsed.reaction.isNovel && (
                      <span className="badge-novel text-xs px-1.5 py-0.5 rounded font-medium">
                        ✦ NOVEL SIGNAL
                      </span>
                    )}
                    <span className="text-xs text-slate-500">
                      {report.mention?.project?.name || 'Unknown Project'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(report.generatedAt, 'MMM d, HH:mm')}
                    </span>
                  </div>
                </summary>

                <div className="px-4 pb-4 pt-2 border-t border-slate-700/50 space-y-4 animate-fade-in">
                  {/* Patient Narrative */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Redacted Patient Narrative</h4>
                    <p className="text-sm text-slate-300 bg-slate-800/50 p-3 rounded-lg">{report.parsed.source.redactedNarrative}</p>
                  </div>

                  {/* Drug Info */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Suspect Drug(s)</h4>
                    <div className="flex flex-wrap gap-2">
                      {report.parsed.drugs.map((drug: any, i: number) => (
                        <span key={i} className="text-xs bg-red-500/10 text-red-300 border border-red-500/20 px-2 py-1 rounded">
                          {drug.name} — {drug.role}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Reaction MedDRA terms */}
                  {report.parsed.reaction.meddraTerms.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">MedDRA Terms</h4>
                      <div className="flex flex-wrap gap-1">
                        {report.parsed.reaction.meddraTerms.map((term: string, i: number) => (
                          <span key={i} className="text-xs bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded">
                            {term}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Compliance Notes */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Compliance Notes</h4>
                    <ul className="space-y-1">
                      {report.parsed.regulatory.complianceNotes.map((note: string, i: number) => (
                        <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                          <span className="text-emerald-400 mt-0.5">✓</span>
                          {note}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-700/50">
                    <span>Platform: {report.parsed.source.platform}</span>
                    <span>Language: {report.parsed.source.originalLanguage}</span>
                    <span>Target: {report.parsed.regulatory.targetAuthority}</span>
                    <span>Format: {report.parsed.regulatory.submissionFormat}</span>
                  </div>
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
