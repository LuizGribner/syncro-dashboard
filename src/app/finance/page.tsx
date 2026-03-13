'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp, TrendingDown, DollarSign, Loader2, Trash2 } from 'lucide-react'

type Payment = {
  id: string; amount: number; currency: string; payment_date: string
  method: string | null; description: string | null; status: string
  employees: { name: string } | null; projects: { title: string } | null
}

const STATUS_BADGE: Record<string, string> = {
  paid: 'badge-paid', pending: 'badge-pending', cancelled: 'badge-cancelled'
}
const STATUS_LABEL: Record<string, string> = {
  paid: 'Pago', pending: 'Pendente', cancelled: 'Cancelado'
}

export default function FinancePage() {
  const supabase = createClient()
  const [payments, setPayments] = useState<Payment[]>([])
  const [revenues, setRevenues] = useState<any[]>([])
  const [projectRevenue, setProjectRevenue] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [tab, setTab] = useState<'payments' | 'revenues'>('payments')

  async function load() {
    setLoading(true)
    const [{ data: pays }, { data: revs }, { data: projs }] = await Promise.all([
      supabase.from('payments').select('*, employees(name), projects(title)').order('payment_date', { ascending: false }),
      supabase.from('revenues').select('*, projects(title, status)').order('revenue_date', { ascending: false }),
      supabase.from('projects').select('id, title, value, currency, status, contract_type, hourly_rate').order('created_at', { ascending: false }),
    ])
    setPayments(pays ?? [])
    setRevenues(revs ?? [])
    setProjectRevenue(projs ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function deletePayment(id: string) {
    if (!confirm('Excluir este pagamento?')) return
    await supabase.from('payments').delete().eq('id', id)
    load()
  }

  async function markPaid(id: string) {
    await supabase.from('payments').update({ status: 'paid' }).eq('id', id)
    load()
  }

  async function deleteRevenue(id: string) {
    if (!confirm('Excluir esta receita?')) return
    await supabase.from('revenues').delete().eq('id', id)
    load()
  }

  // Metrics
  const totalPaidBRL = payments.filter(p => p.status === 'paid' && p.currency === 'BRL').reduce((s, p) => s + p.amount, 0)
  const totalPendingBRL = payments.filter(p => p.status === 'pending' && p.currency === 'BRL').reduce((s, p) => s + p.amount, 0)
  const totalPaidUSD = payments.filter(p => p.status === 'paid' && p.currency === 'USD').reduce((s, p) => s + p.amount, 0)
  const totalPendingUSD = payments.filter(p => p.status === 'pending' && p.currency === 'USD').reduce((s, p) => s + p.amount, 0)
  const totalRevenueUSD = revenues.filter(r => r.currency === 'USD').reduce((s, r) => s + r.amount, 0)
  const totalRevenueBRL = revenues.filter(r => r.currency === 'BRL').reduce((s, r) => s + r.amount, 0)

  // Revenue per project from revenues table
  const revenueByProject: Record<string, number> = {}
  revenues.forEach(r => {
    if (r.project_id) revenueByProject[r.project_id] = (revenueByProject[r.project_id] ?? 0) + r.amount
  })

  const filtered = filterStatus === 'all' ? payments : payments.filter(p => p.status === filterStatus)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-surface-800">Financeiro</h1>
        <p className="text-sm text-gray-400 mt-1">Pagamentos e receita da Syncro Solutions</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SummaryCard icon={<TrendingUp size={17} />} label="Receita (USD)" value={`$${totalRevenueUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} sub="registrada" color="emerald" />
        <SummaryCard icon={<TrendingUp size={17} />} label="Receita (BRL)" value={`R$${totalRevenueBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} sub="registrada" color="blue" />
        <SummaryCard icon={<TrendingDown size={17} />} label="Pago à equipe" value={`$${totalPaidUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} sub={`+ R$${totalPaidBRL.toLocaleString('pt-BR')}`} color="violet" />
        <SummaryCard icon={<DollarSign size={17} />} label="Pendente equipe" value={`$${totalPendingUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} sub={`+ R$${totalPendingBRL.toLocaleString('pt-BR')}`} color="amber" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-50 border border-surface-200 rounded-xl p-1 mb-6 w-fit">
        {[['payments', 'Pagamentos à equipe'], ['revenues', 'Minhas receitas']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key as any)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition ${tab === key ? 'bg-white text-surface-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'payments' && (
        <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
            <h2 className="text-sm font-semibold text-surface-800">Pagamentos à Equipe</h2>
            <div className="flex gap-1 bg-surface-50 border border-surface-200 rounded-xl p-1">
              {['all', 'paid', 'pending', 'cancelled'].map(s => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${filterStatus === s ? 'bg-white text-surface-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                  {s === 'all' ? 'Todos' : STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin text-brand-400" size={20} /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">Nenhum pagamento registrado.</div>
          ) : (
            <div className="divide-y divide-surface-50">
              {filtered.map(pay => (
                <div key={pay.id} className="flex items-center gap-4 px-6 py-4 hover:bg-surface-50 group">
                  <div className="text-xs text-gray-400 w-24 flex-shrink-0">
                    {new Date(pay.payment_date).toLocaleDateString('pt-BR')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-surface-800">{pay.employees?.name ?? '—'}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {pay.description ?? ''}
                      {pay.projects?.title && <span> · {pay.projects.title}</span>}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 capitalize hidden sm:block w-20 flex-shrink-0">{pay.method ?? '—'}</div>
                  <div className="text-sm font-semibold text-surface-800 flex-shrink-0">
                    {pay.currency === 'USD' ? '$' : 'R$'}{Number(pay.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${STATUS_BADGE[pay.status] ?? ''}`}>
                    {STATUS_LABEL[pay.status] ?? pay.status}
                  </span>
                  {pay.status === 'pending' && (
                    <button onClick={() => markPaid(pay.id)}
                      className="opacity-0 group-hover:opacity-100 text-xs text-emerald-500 border border-emerald-200 rounded-lg px-2 py-1 hover:bg-emerald-50 transition flex-shrink-0">
                      Marcar pago
                    </button>
                  )}
                  <button onClick={() => deletePayment(pay.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition flex-shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'revenues' && (
        <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-100">
            <h2 className="text-sm font-semibold text-surface-800">Minhas Receitas</h2>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin text-brand-400" size={20} /></div>
          ) : revenues.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">Nenhuma receita registrada.</div>
          ) : (
            <div className="divide-y divide-surface-50">
              {revenues.map(rev => (
                <div key={rev.id} className="flex items-center gap-4 px-6 py-4 hover:bg-surface-50 group">
                  <div className="text-xs text-gray-400 w-24 flex-shrink-0">
                    {new Date(rev.revenue_date).toLocaleDateString('pt-BR')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-surface-800">{rev.description ?? '—'}</div>
                    {rev.projects?.title && <div className="text-xs text-gray-400 mt-0.5">{rev.projects.title}</div>}
                  </div>
                  <div className="text-sm font-semibold text-emerald-600 flex-shrink-0">
                    {rev.currency === 'USD' ? '$' : 'R$'}{Number(rev.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <button onClick={() => deleteRevenue(rev.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition flex-shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Receita por projeto */}
      <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden mt-6">
        <div className="px-6 py-4 border-b border-surface-100">
          <h2 className="text-sm font-semibold text-surface-800">Receita por Projeto</h2>
        </div>
        {projectRevenue.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">Nenhum projeto.</div>
        ) : (
          <div className="divide-y divide-surface-50">
            {projectRevenue.map(p => {
              const earned = revenueByProject[p.id] ?? 0
              return (
                <div key={p.id} className="flex items-center gap-4 px-6 py-3">
                  <div className="flex-1 text-sm text-surface-800 font-medium">{p.title}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.status === 'active' ? 'badge-active' : p.status === 'completed' ? 'badge-completed' : p.status === 'paused' ? 'badge-paused' : 'badge-cancelled'}`}>
                    {p.status === 'active' ? 'Ativo' : p.status === 'completed' ? 'Concluído' : p.status === 'paused' ? 'Pausado' : 'Cancelado'}
                  </span>
                  <div className="text-xs text-gray-400 capitalize">{p.contract_type === 'hourly' ? 'Por hora' : p.contract_type === 'fixed' ? 'Fixo' : 'Split'}</div>
                  <div className="text-sm font-semibold text-surface-800 w-32 text-right">
                    {earned > 0
                      ? <span className="text-emerald-600">${earned.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      : <span className="text-gray-300">{p.currency === 'USD' ? '$' : 'R$'}{Number(p.value).toLocaleString()} <span className="text-xs font-normal">{p.currency}</span></span>
                    }
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function SummaryCard({ icon, label, value, sub, color }: {
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
