'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Plus, Search, FolderKanban, ArrowUpRight, Users, ExternalLink } from 'lucide-react'
import type { ProjectWithClient } from '@/types/database'
import ProjectFormModal from './ProjectFormModal'

const STATUS_LABEL: Record<string, string> = {
  active: 'Ativo', paused: 'Pausado', completed: 'Concluído', cancelled: 'Cancelado'
}
const STATUS_BADGE: Record<string, string> = {
  active: 'badge-active', paused: 'badge-paused', completed: 'badge-completed', cancelled: 'badge-cancelled'
}
const ALL_STATUSES = ['active', 'paused', 'completed', 'cancelled']

export default function ProjectsPage() {
  const supabase = createClient()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('projects')
      .select(`
        *,
        clients(id, name, company),
        project_employees(
          id,
          employees(id, name)
        )
      `)
      .order('created_at', { ascending: false })
    setProjects(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = projects.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.clients?.name?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    return matchSearch && matchStatus
  })

  const counts = ALL_STATUSES.reduce((acc, s) => ({
    ...acc, [s]: projects.filter(p => p.status === s).length
  }), {} as Record<string, number>)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-surface-800">Projetos</h1>
          <p className="text-sm text-gray-400 mt-1">{projects.length} projetos no total</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition shadow-lg shadow-brand-500/20"
        >
          <Plus size={15} /> Novo Projeto
        </button>
      </div>

      {/* Status tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex gap-1 bg-white border border-surface-200 rounded-xl p-1">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${statusFilter === 'all' ? 'bg-surface-800 text-white' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Todos ({projects.length})
          </button>
          {ALL_STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${statusFilter === s ? 'bg-surface-800 text-white' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {STATUS_LABEL[s]} ({counts[s] ?? 0})
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs ml-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar projeto ou cliente..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-surface-200 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-surface-200 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-200 px-6 py-16 text-center">
          <FolderKanban size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Nenhum projeto encontrado.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(project => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="bg-white rounded-2xl border border-surface-200 hover:border-brand-200 hover:shadow-md hover:shadow-brand-500/5 transition-all p-5 flex items-center gap-5 group"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                <FolderKanban size={17} className="text-brand-500" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-surface-800 text-sm truncate">{project.title}</span>
                  {project.upwork_url && (
                    <ExternalLink size={12} className="text-gray-300 flex-shrink-0" />
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-3">
                  <span>{project.clients?.name ?? 'Sem cliente'}</span>
                  {project.project_employees?.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Users size={11} />
                      {project.project_employees.length} pessoa{project.project_employees.length !== 1 ? 's' : ''}
                    </span>
                  )}
                  {project.platform && <span className="capitalize">{project.platform}</span>}
                </div>
              </div>

              <div className="flex items-center gap-4 flex-shrink-0">
                {project.end_date && (
                  <div className="text-right hidden sm:block">
                    <div className="text-xs text-gray-400">Prazo</div>
                    <div className="text-xs font-medium text-surface-800">
                      {new Date(project.end_date).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                )}
                <div className="text-right">
                  <div className="text-sm font-semibold text-surface-800">
                    {project.currency === 'USD' ? '$' : 'R$'}{Number(project.value).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400">{project.currency}</div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_BADGE[project.status] ?? ''}`}>
                  {STATUS_LABEL[project.status] ?? project.status}
                </span>
                <ArrowUpRight size={15} className="text-gray-200 group-hover:text-brand-400 transition" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && <ProjectFormModal onClose={() => { setShowModal(false); load() }} />}
    </div>
  )
}
