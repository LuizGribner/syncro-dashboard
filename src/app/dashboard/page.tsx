import { createClient } from '@/lib/supabase/server'
import { DollarSign, FolderKanban, Users, TrendingUp, ArrowUpRight, Clock } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { data: projects },
    { data: employees },
    { data: payments },
    { data: recentProjects },
  ] = await Promise.all([
    supabase.from('projects').select('id, status, value, currency'),
    supabase.from('employees').select('id, status'),
    supabase.from('payments').select('amount, currency, payment_date').order('payment_date', { ascending: false }).limit(50),
    supabase.from('projects')
      .select('id, title, status, value, currency, start_date, clients(name)')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const activeProjects = projects?.filter(p => p.status === 'active').length ?? 0
  const completedProjects = projects?.filter(p => p.status === 'completed').length ?? 0
  const activeEmployees = employees?.filter(e => e.status === 'active').length ?? 0

  const totalRevenue = projects
    ?.filter(p => p.status === 'completed' && p.currency === 'USD')
    .reduce((s, p) => s + (p.value ?? 0), 0) ?? 0

  const totalPaidBRL = payments
    ?.filter(p => p.currency === 'BRL')
    .reduce((s, p) => s + (p.amount ?? 0), 0) ?? 0

  const STATUS_LABEL: Record<string, string> = {
    active: 'Ativo', paused: 'Pausado', completed: 'Concluído', cancelled: 'Cancelado'
  }
  const STATUS_COLOR: Record<string, string> = {
    active: 'badge-active', paused: 'badge-paused', completed: 'badge-completed', cancelled: 'badge-cancelled'
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-surface-800">Visão Geral</h1>
        <p className="text-sm text-gray-400 mt-1">Syncro Solutions LLC</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          icon={<FolderKanban size={18} />}
          label="Projetos Ativos"
          value={String(activeProjects)}
          sub={`${completedProjects} concluídos`}
          color="blue"
        />
        <MetricCard
          icon={<Users size={18} />}
          label="Equipe Ativa"
          value={String(activeEmployees)}
          sub="funcionários"
          color="violet"
        />
        <MetricCard
          icon={<DollarSign size={18} />}
          label="Receita (USD)"
          value={`$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 0 })}`}
          sub="projetos concluídos"
          color="emerald"
        />
        <MetricCard
          icon={<TrendingUp size={18} />}
          label="Pagamentos (BRL)"
          value={`R$${totalPaidBRL.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
          sub="total pago à equipe"
          color="amber"
        />
      </div>

      {/* Recent Projects */}
      <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
          <h2 className="font-semibold text-surface-800 text-sm">Projetos Recentes</h2>
          <Link href="/projects" className="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-1 font-medium">
            Ver todos <ArrowUpRight size={13} />
          </Link>
        </div>

        {!recentProjects?.length ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            Nenhum projeto ainda.{' '}
            <Link href="/projects" className="text-brand-500 hover:underline">Criar primeiro projeto →</Link>
          </div>
        ) : (
          <div className="divide-y divide-surface-50">
            {recentProjects.map((p: any) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-surface-50 transition group"
              >
                <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <FolderKanban size={14} className="text-brand-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-surface-800 truncate">{p.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{p.clients?.name ?? 'Sem cliente'}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-surface-800">
                    {p.currency === 'USD' ? '$' : 'R$'}{Number(p.value).toLocaleString()}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[p.status] ?? ''}`}>
                    {STATUS_LABEL[p.status] ?? p.status}
                  </span>
                  <ArrowUpRight size={14} className="text-gray-300 group-hover:text-brand-400 transition" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MetricCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  color: 'blue' | 'violet' | 'emerald' | 'amber'
}) {
  const colors = {
    blue:    'bg-blue-50 text-blue-500',
    violet:  'bg-violet-50 text-violet-500',
    emerald: 'bg-emerald-50 text-emerald-500',
    amber:   'bg-amber-50 text-amber-500',
  }
  return (
    <div className="bg-white rounded-2xl border border-surface-200 p-5">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 ${colors[color]}`}>
        {icon}
      </div>
      <div className="text-2xl font-semibold text-surface-800 mb-0.5">{value}</div>
      <div className="text-xs text-gray-400 font-medium">{label}</div>
      <div className="text-xs text-gray-300 mt-1">{sub}</div>
    </div>
  )
}
