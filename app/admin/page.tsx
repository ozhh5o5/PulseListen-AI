'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Shield, Server, Wand2, Clock } from 'lucide-react'
import { format } from 'date-fns'

interface SourceType {
  type: string
  name: string
  status: string
}

interface AdminAction {
  id: string
  projectId: string | null
  action: string
  details: string | null
  createdAt: string
}

interface SuggestedSource {
  sourceType: string
  config: any
  cadence: string
  reasoning: string
}

export default function AdminPage() {
  const [sourceTypes, setSourceTypes] = useState<SourceType[]>([])
  const [actions, setActions] = useState<AdminAction[]>([])
  const [suggestUrl, setSuggestUrl] = useState('')
  const [suggestion, setSuggestion] = useState<SuggestedSource | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchSourceTypes()
    fetchActions()
  }, [])

  const fetchSourceTypes = async () => {
    try {
      const res = await fetch('/api/admin/source-types')
      const data = await res.json()
      setSourceTypes(data.sourceTypes || [])
    } catch (error) {
      console.error('Error fetching source types:', error)
    }
  }

  const fetchActions = async () => {
    try {
      const res = await fetch('/api/admin/actions')
      const data = await res.json()
      setActions(data.actions || [])
    } catch (error) {
      console.error('Error fetching actions:', error)
    }
  }

  const handleSuggest = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuggestion(null)

    try {
      const res = await fetch('/api/admin/source-types/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: suggestUrl })
      })

      if (!res.ok) throw new Error('Failed to suggest source')

      const data = await res.json()
      setSuggestion(data.suggestion)
    } catch (error) {
      console.error('Error suggesting source:', error)
      alert('Failed to suggest source')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold gradient-text flex items-center gap-3">
          <Shield className="w-8 h-8 text-sky-400" />
          Admin Dashboard
        </h1>
        <p className="text-slate-400 mt-1 text-sm">Manage source types and view system activity</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source Types */}
        <div className="glass rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Server className="w-4 h-4 text-sky-400" />
            Registered Crawler Engines
          </h2>

          {sourceTypes.length === 0 ? (
            <p className="text-slate-500 text-center py-8 text-sm">No source types registered</p>
          ) : (
            <div className="space-y-2">
              {sourceTypes.map((source) => (
                <div key={source.type} className="flex items-center justify-between p-3 border border-slate-700/50 rounded-lg hover:bg-white/[0.02] transition-colors">
                  <div>
                    <p className="font-medium text-sm text-white">{source.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{source.type}</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                    source.status === 'active'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                  }`}>
                    {source.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Source Suggester */}
        <div className="glass rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-indigo-400" />
            Agentic Source Suggester
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Enter a URL and the AI will suggest a crawler configuration.
          </p>

          <form onSubmit={handleSuggest} className="space-y-3">
            <input
              type="url"
              value={suggestUrl}
              onChange={(e) => setSuggestUrl(e.target.value)}
              placeholder="https://reddit.com/r/medicine"
              required
              className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors"
            />
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-0"
            >
              {loading ? 'Analyzing...' : 'Suggest Configuration'}
            </Button>
          </form>

          {suggestion && (
            <div className="mt-4 p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-lg space-y-2 animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="text-xs bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded">
                  {suggestion.sourceType.replace('_', ' ')}
                </span>
                <span className="text-xs bg-sky-500/15 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded">
                  {suggestion.cadence}
                </span>
              </div>
              <p className="text-sm text-slate-300">{suggestion.reasoning}</p>
              {Object.keys(suggestion.config).length > 0 && (
                <div className="text-xs bg-slate-800/50 p-2 rounded font-mono text-slate-400">
                  {JSON.stringify(suggestion.config, null, 2)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Audit Log */}
      <div className="glass rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          Audit Log
        </h2>

        {actions.length === 0 ? (
          <p className="text-slate-500 text-center py-8 text-sm">No actions logged yet</p>
        ) : (
          <div className="space-y-2">
            {actions.map((action) => (
              <div key={action.id} className="flex items-center gap-4 p-3 border border-slate-700/50 rounded-lg hover:bg-white/[0.02] transition-colors">
                <span className="text-xs text-slate-500 font-mono whitespace-nowrap">
                  {format(new Date(action.createdAt), 'MMM d, HH:mm:ss')}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-sky-500/10 text-sky-300 border border-sky-500/20">
                  {action.action.replace(/_/g, ' ').toUpperCase()}
                </span>
                <span className="text-xs text-slate-400 truncate flex-1">
                  {action.details ? (
                    <code className="text-[10px] bg-slate-800/50 px-2 py-0.5 rounded">
                      {action.details}
                    </code>
                  ) : 'N/A'}
                </span>
                {action.projectId && (
                  <Link href={`/projects/${action.projectId}`} className="text-[10px] text-sky-400 hover:underline whitespace-nowrap">
                    {action.projectId.slice(0, 8)}...
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
