'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FolderKanban, Users, DollarSign, TrendingUp, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    activeProjects: 0,
    totalProjects: 0,
    activeEmployees: 0,
    pendingPayments: 0,
    totalRevenueUSD: 0,
    recentProjects: [] as any[],
  })

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [{ data: projects }, { data: employees }, { data: payments }, { data: revenues }] = await Promise.all([
        supabase.from('projects').select('id, title, status, value, currency, contract_type').order('created_at', { ascending: false }),
        supabase.from('employees').select('id, status'),
        supabase.from('payments').select('amount, currency, status'),
        supabase.from('revenues').select('amount, currency'),
      ])

      const proj = (projects ?? []) as any[]
      const emps = (employees ?? []) as any[]
      const pays = (payments ?? []) as any[]
      const revs = (revenues ?? []) as any[]

      setStats({
        activeProjects: proj.filter(p => p.status === 'active').length,
        totalProjects: proj.length,
        activeEmployees: emps.filter(e => e.status === 'active').length,
        pendingPayments: pays.filter(p => p.status === 'pending').reduce((s: number, p: any) => s + p.amount, 0),
        totalRevenueUSD: revs.filter(r => r.currency === 'USD').reduce((s: number, r: any) => s + r.amount, 0),
        recentProjects: proj.slice(0, 5),
      })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-brand-400" size={24} />
    </div>
  )

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-surface-800">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">Visão geral da Syncro Solutions</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<FolderKanban size={17} />} label="Projetos Ativos" value={String(stats.activeProjects)} sub={`de ${stats.totalProjects} total`} color="blue" />
        <StatCard icon={<Users size={17} />} label="Equipe Ativa" value={String(stats.activeEmployees)} sub="funcionários" color="violet" />
        <StatCard icon={<DollarSign size={17} />} label="Pendente Equipe" value={`$${stats.pendingPayments.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} sub="a pagar" color="amber" />
        <StatCard icon={<TrendingUp size={17} />} label="Receita Total" value={`$${stats.totalRevenueUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} sub="USD registrado" color="emerald" />
      </div>

      <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
          <h2 className="text-sm font-semibold text-surface-800">Projetos Recentes</h2>
          <Link href="/projects" className="text-xs text-brand-500 hover:text-brand-600 font-medium">Ver todos</Link>
        </div>
        {stats.recentProjects.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">Nenhum projeto ainda.</div>
        ) : (
          <div className="divide-y divide-surface-50">
            {stats.recentProjects.map((p: any) => (
              <Link key={p.id} href={`/projects/${p.id}`} className="flex items-center gap-4 px-6 py-3 hover:bg-surface-50 transition">
                <div className="flex-1 text-sm font-medium text-surface-800">{p.title}</div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.status === 'active' ? 'badge-active' : p.status === 'completed' ? 'badge-completed' : p.status === 'paused' ? 'badge-paused' : 'badge-cancelled'}`}>
                  {p.status === 'active' ? 'Ativo' : p.status === 'completed' ? 'Concluído' : p.status === 'paused' ? 'Pausado' : 'Cancelado'}
                </span>
                <div className="text-sm text-gray-400">
                  {p.contract_type === 'hourly' ? 'Por hora' : p.contract_type === 'fixed' ? 'Fixo' : 'Split'}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string; sub: string; color: string
}) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-500', blue: 'bg-blue-50 text-blue-500',
    violet: 'bg-violet-50 text-violet-500', amber: 'bg-amber-50 text-amber-500',
  }
  return (
    <div className="bg-white rounded-2xl border border-surface-200 p-5">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 ${colors[color]}`}>{icon}</div>
      <div className="text-xl font-semibold text-surface-800 mb-0.5">{value}</div>
      <div className="text-xs text-gray-400 font-medium">{label}</div>
      <div className="text-xs text-gray-300 mt-0.5">{sub}</div>
    </div>
  )
}
