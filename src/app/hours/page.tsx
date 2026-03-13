'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Clock, Loader2, Trash2, Calculator } from 'lucide-react'

export default function HoursPage() {
  const supabase = createClient()
  const [entries, setEntries] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  // Filters
  const [filterEmployee, setFilterEmployee] = useState('')
  const [filterProject, setFilterProject] = useState('')

  // Form
  const [form, setForm] = useState({
    employee_id: '',
    project_id: '',
    hours: '',
    entry_date: new Date().toISOString().split('T')[0],
    description: '',
  })
  const [ratePreview, setRatePreview] = useState<number | null>(null)

  async function load() {
    setLoading(true)
    const [{ data: ents }, { data: emps }, { data: projs }] = await Promise.all([
      supabase
        .from('time_entries')
        .select('*, employees(name), projects(title)')
        .order('entry_date', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase.from('employees').select('id, name').eq('status', 'active').order('name'),
      supabase.from('projects').select('id, title').in('status', ['active', 'paused']).order('title'),
    ])
    setEntries(ents ?? [])
    setEmployees(emps ?? [])
    setProjects(projs ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Lookup hourly rate when employee + project selected
  useEffect(() => {
    if (!form.employee_id || !form.project_id) { setRatePreview(null); return }
    supabase
      .from('project_employees')
      .select('payment_type, hourly_rate')
      .eq('employee_id', form.employee_id)
      .eq('project_id', form.project_id)
      .single()
      .then(({ data }) => {
        if (data?.payment_type === 'hourly' && data.hourly_rate) {
          setRatePreview(data.hourly_rate)
        } else {
          setRatePreview(null)
        }
      })
  }, [form.employee_id, form.project_id])

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const totalUsd = ratePreview && form.hours ? Number(form.hours) * ratePreview : null
    await supabase.from('time_entries').insert({
      employee_id: form.employee_id,
      project_id: form.project_id,
      hours: Number(form.hours),
      entry_date: form.entry_date,
      description: form.description || null,
      rate_used: ratePreview,
      total_usd: totalUsd,
    })
    setShowForm(false)
    setForm({ employee_id: '', project_id: '', hours: '', entry_date: new Date().toISOString().split('T')[0], description: '' })
    setRatePreview(null)
    setSaving(false)
    load()
  }

  async function deleteEntry(id: string) {
    if (!confirm('Excluir este lançamento?')) return
    await supabase.from('time_entries').delete().eq('id', id)
    load()
  }

  const filtered = entries.filter(e => {
    const matchEmp = !filterEmployee || e.employee_id === filterEmployee
    const matchProj = !filterProject || e.project_id === filterProject
    return matchEmp && matchProj
  })

  const totalHours = filtered.reduce((s, e) => s + Number(e.hours), 0)
  const totalUSD = filtered.filter(e => e.total_usd).reduce((s, e) => s + Number(e.total_usd), 0)

  const inp = 'w-full border border-surface-200 rounded-xl px-3 py-2 text-sm text-surface-800 focus:outline-none focus:border-brand-500 bg-surface-50'

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-surface-800">Horas Trabalhadas</h1>
          <p className="text-sm text-gray-400 mt-1">Lançamento e histórico de horas por projeto</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition shadow-lg shadow-brand-500/20">
          <Plus size={15} /> Lançar Horas
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-surface-200 p-5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center mb-3">
            <Clock size={17} />
          </div>
          <div className="text-2xl font-semibold text-surface-800">{totalHours.toFixed(1)}h</div>
          <div className="text-xs text-gray-400 mt-0.5">Total de horas</div>
        </div>
        <div className="bg-white rounded-2xl border border-surface-200 p-5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-3">
            <Calculator size={17} />
          </div>
          <div className="text-2xl font-semibold text-surface-800">${totalUSD.toFixed(2)}</div>
          <div className="text-xs text-gray-400 mt-0.5">Total calculado (USD)</div>
        </div>
        <div className="bg-white rounded-2xl border border-surface-200 p-5">
          <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-500 flex items-center justify-center mb-3">
            <Clock size={17} />
          </div>
          <div className="text-2xl font-semibold text-surface-800">{filtered.length}</div>
          <div className="text-xs text-gray-400 mt-0.5">Lançamentos</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <select value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)}
          className="text-sm border border-surface-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-brand-500 text-gray-600">
          <option value="">Todos os funcionários</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
          className="text-sm border border-surface-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-brand-500 text-gray-600">
          <option value="">Todos os projetos</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        {(filterEmployee || filterProject) && (
          <button onClick={() => { setFilterEmployee(''); setFilterProject('') }}
            className="text-xs text-gray-400 hover:text-gray-600 px-3 py-2 border border-surface-200 rounded-xl hover:bg-surface-50 transition">
            Limpar filtros
          </button>
        )}
      </div>

      {/* Entries table */}
      <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="animate-spin text-brand-400" size={20} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            Nenhum lançamento encontrado.
          </div>
        ) : (
          <div className="divide-y divide-surface-50">
            {filtered.map(entry => (
              <div key={entry.id} className="flex items-center gap-4 px-6 py-4 hover:bg-surface-50 group">
                <div className="text-xs text-gray-400 w-24 flex-shrink-0">
                  {new Date(entry.entry_date).toLocaleDateString('pt-BR')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-surface-800">{entry.employees?.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {entry.projects?.title}
                    {entry.description && <span> · {entry.description}</span>}
                  </div>
                </div>
                <div className="text-sm font-semibold text-surface-800 flex-shrink-0">
                  {Number(entry.hours).toFixed(1)}h
                </div>
                {entry.total_usd ? (
                  <div className="text-sm font-semibold text-emerald-600 w-20 text-right flex-shrink-0">
                    ${Number(entry.total_usd).toFixed(2)}
                  </div>
                ) : (
                  <div className="w-20 flex-shrink-0" />
                )}
                {entry.rate_used && (
                  <div className="text-xs text-gray-400 hidden sm:block w-20 text-right flex-shrink-0">
                    ${entry.rate_used}/h
                  </div>
                )}
                <button onClick={() => deleteEntry(entry.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition flex-shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-5 border-b border-surface-100">
              <h2 className="font-semibold text-surface-800">Lançar Horas</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 transition">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Funcionário *</label>
                <select required value={form.employee_id} onChange={e => set('employee_id', e.target.value)} className={inp}>
                  <option value="">Selecionar</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Projeto *</label>
                <select required value={form.project_id} onChange={e => set('project_id', e.target.value)} className={inp}>
                  <option value="">Selecionar</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Horas *</label>
                  <input required type="number" min="0.1" step="0.25" value={form.hours}
                    onChange={e => set('hours', e.target.value)} placeholder="Ex: 4.5" className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Data</label>
                  <input type="date" value={form.entry_date} onChange={e => set('entry_date', e.target.value)} className={inp} />
                </div>
              </div>

              {/* Rate preview */}
              {ratePreview && form.hours && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-center justify-between">
                  <span className="text-xs text-emerald-600">Total calculado:</span>
                  <span className="text-sm font-semibold text-emerald-700">
                    ${(Number(form.hours) * ratePreview).toFixed(2)} USD
                  </span>
                </div>
              )}
              {ratePreview === null && form.employee_id && form.project_id && (
                <p className="text-xs text-gray-400 italic">Este funcionário não tem taxa horária configurada neste projeto.</p>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Descrição</label>
                <input value={form.description} onChange={e => set('description', e.target.value)}
                  placeholder="Ex: Desenvolvimento do webhook n8n" className={inp} />
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-gray-500 border border-surface-200 rounded-xl hover:bg-surface-50 transition">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition">
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
