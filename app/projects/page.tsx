import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/db'
import { formatDistanceToNow } from 'date-fns'
import { Plus, Settings, FolderKanban } from 'lucide-react'

async function getProjects() {
  const projects = await prisma.project.findMany({
    include: {
      sources: true,
      _count: {
        select: { mentions: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return projects
}

export default async function ProjectsPage() {
  const projects = await getProjects()

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text flex items-center gap-3">
            <FolderKanban className="w-8 h-8 text-sky-400" />
            Monitoring Projects
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Manage your social listening projects</p>
        </div>
        <Link href="/projects/new">
          <Button className="bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white border-0 shadow-lg shadow-sky-500/25">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <p className="text-slate-400 mb-4">No monitoring projects yet.</p>
          <Link href="/projects/new">
            <Button className="bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white border-0">
              Create Your First Project
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {projects.map((project) => {
            const keywords = JSON.parse(project.keywords) as string[]

            return (
              <div key={project.id} className="glass rounded-xl p-5 card-hover animate-slide-up">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Link href={`/projects/${project.id}`}>
                        <h3 className="text-lg font-semibold text-sky-400 hover:text-sky-300 transition-colors">
                          {project.name}
                        </h3>
                      </Link>
                      {project.description && (
                        <p className="text-sm text-slate-400 mt-1 line-clamp-2">{project.description}</p>
                      )}
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      project.isActive
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                    }`}>
                      {project.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {keywords.slice(0, 5).map((kw, i) => (
                      <span key={i} className="text-xs bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded">
                        {kw}
                      </span>
                    ))}
                    {keywords.length > 5 && (
                      <span className="text-xs bg-slate-700/50 text-slate-400 px-2 py-0.5 rounded">
                        +{keywords.length - 5} more
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-6 text-sm text-slate-400">
                    <div>
                      <span className="font-semibold text-white">{project.sources.length}</span> source{project.sources.length !== 1 ? 's' : ''}
                    </div>
                    <div>
                      <span className="font-semibold text-white">{project._count.mentions}</span> mentions
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Link href={`/projects/${project.id}`} className="flex-1">
                      <Button variant="outline" className="w-full text-sm border-slate-600 text-slate-300 hover:bg-white/5 hover:text-white">
                        <Settings className="w-4 h-4 mr-2" />
                        Configure
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
