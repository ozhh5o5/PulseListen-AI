'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Zap } from 'lucide-react'

const SOURCE_TYPES = [
  { value: 'X_TWITTER', label: 'X / Twitter', icon: '𝕏' },
  { value: 'REDDIT', label: 'Reddit', icon: '🔴' },
  { value: 'FORUM', label: 'Forum', icon: '💬' },
  { value: 'QUORA', label: 'Quora', icon: '🅠' }
]

const CADENCES = [
  { value: 'REALTIME', label: 'Real-time' },
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' }
]

export default function CreateProjectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    keywords: ''
  })
  const [selectedSources, setSelectedSources] = useState<{ [key: string]: string }>({})

  const toggleSource = (sourceType: string, defaultCadence: string = 'DAILY') => {
    setSelectedSources(prev => {
      const newSources = { ...prev }
      if (newSources[sourceType]) {
        delete newSources[sourceType]
      } else {
        newSources[sourceType] = defaultCadence
      }
      return newSources
    })
  }

  const setCadence = (sourceType: string, cadence: string) => {
    setSelectedSources(prev => ({
      ...prev,
      [sourceType]: cadence
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const keywords = formData.keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0)

      if (keywords.length === 0) {
        alert('Please enter at least one keyword')
        setLoading(false)
        return
      }

      const projectRes = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          keywords
        })
      })

      if (!projectRes.ok) throw new Error('Failed to create project')

      const project = await projectRes.json()

      for (const [sourceType, cadence] of Object.entries(selectedSources)) {
        await fetch(`/api/projects/${project.id}/sources`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceType,
            cadence,
            config: {}
          })
        })
      }

      router.push(`/projects/${project.id}`)
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Failed to create project')
      setLoading(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      <div>
        <Link href="/projects" className="text-sky-400 hover:text-sky-300 text-sm mb-2 inline-block transition-colors">
          ← Back to Projects
        </Link>
        <h1 className="text-3xl font-bold gradient-text">Create Monitoring Project</h1>
        <p className="text-slate-400 mt-1 text-sm">Set up a new social listening project with configurable sources</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="glass rounded-xl p-6 space-y-6">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-slate-300">Project Name *</label>
            <input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="MetaStatin Safety Monitoring"
              required
              className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium text-slate-300">Description</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Monitor social media for adverse events and safety signals related to MetaStatin"
              rows={3}
              className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors resize-none"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="keywords" className="block text-sm font-medium text-slate-300">Keywords * (comma-separated)</label>
            <input
              id="keywords"
              value={formData.keywords}
              onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
              placeholder="metastatin, side effect, adverse, headache"
              required
              className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors"
            />
            <p className="text-xs text-slate-500">
              Enter keywords to monitor. Mentions containing any of these will be captured.
            </p>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-300">Data Sources</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SOURCE_TYPES.map((source) => (
                <div
                  key={source.value}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedSources[source.value]
                      ? 'border-sky-500 bg-sky-500/10'
                      : 'border-slate-600 hover:border-slate-500'
                  }`}
                  onClick={() => toggleSource(source.value)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{source.icon}</span>
                    <span className="font-medium text-white text-sm">{source.label}</span>
                  </div>
                  {selectedSources[source.value] && (
                    <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
                      <label className="text-xs text-slate-400">Cadence</label>
                      <div className="flex gap-1">
                        {CADENCES.map((cadence) => (
                          <button
                            key={cadence.value}
                            type="button"
                            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                              selectedSources[source.value] === cadence.value
                                ? 'bg-sky-500 text-white'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                            onClick={() => setCadence(source.value, cadence.value)}
                          >
                            {cadence.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {Object.keys(selectedSources).length === 0 && (
              <p className="text-xs text-slate-500">Select at least one data source to monitor</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading || !formData.name || !formData.keywords || Object.keys(selectedSources).length === 0}
              className="bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white border-0 disabled:opacity-50"
            >
              <Zap className="w-4 h-4 mr-2" />
              {loading ? 'Creating...' : 'Create Project'}
            </Button>
            <Link href="/projects">
              <Button type="button" variant="outline" className="border-slate-600 text-slate-300 hover:bg-white/5 hover:text-white">
                Cancel
              </Button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}
