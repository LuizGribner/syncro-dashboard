'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Loader2 } from 'lucide-react'

interface Props { project?: any; onClose: () => void }

export default function ProjectFormModal({ project, onClose }: Props) {
  const supabase = createClient()
  const isEdit = !!project
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: project?.title ?? '',
    description: project?.description ?? '',
    client_id: project?.client_id ?? '',
    status: project?.status ?? 'active',
    contract_type: project?.contract_type ?? 'fixed',
    value: project?.value ?? '',
    hourly_rate: project?.hourly_rate ?? '',
    total_hours: project?.total_hours ?? '',
    currency: project?.currency ?? 'USD',
    start_date: project?.start_date ?? '',
    end_date: project?.end_date ?? '',
    platform: project?.platform ?? '',
    upwork_url: project?.upwork_url ?? '',
    notes: project?.notes ?? '',
  })
  const [newClientName, setNewClientName] = useState('')
  const [showNewClient, setShowNewClient] = useState(false)

  useEffect(() => {
    supabase.from('clients').select('id, name, company').order('name').then(({ data }) => setClients(data ?? []))
  }, [])

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    let clientId = form.client_id
    if (showNewClient && newClientName.trim()) {
      const { data: newClient } = await supabase.from('clients').insert({ name: newClientName.trim() }).select('id').single()
      clientId = newClient?.id ?? ''
    }
    const payload = {
      ...form,
      client_id: clientId || null,
      value: Number(form.value) || 0,
      hourly_rate: form.contract_type === 'hourly' ? Number(form.hourly_rate) || null : null,
      total_hours: form.contract_type === 'hourly' ? Number(form.total_hours) || null : null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    }
    try {
      if (isEdit) {
        await supabase.from('projects').update(payload as any).eq('id', project.id)
      } else {
        await supabase.from('projects').insert(payload as any)
      }
    } catch (err) { console.error(err) }
    setLoading(false)
    onClose()
  }

  const inp = 'w-full border border-surface-200 rounded-xl px-3 py-2 text-sm text-surface-800 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 bg-surface-50'

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-surface-100">
          <h2 className="font-semibold text-surface-800">{isEdit ? 'Editar Projeto' : 'Novo Projeto'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Título do Projeto *</label>
            <input required value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ex: n8n Automation Pipeline" className={inp} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Cliente</label>
            {!showNewClient ? (
              <div className="flex gap-2">
                <select value={form.client_id} onChange={e => set('client_id', e.target.value)} className={inp + ' flex-1'}>
                  <option value="">Selecionar cliente</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>)}
                </select>
                <button type="button" onClick={() => setShowNewClient(true)}
                  className="px-3 py-2 text-xs text-brand-500 border border-brand-200 rounded-xl hover:bg-brand-50 transition">+ Novo</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input value={newClientName} onChange={e => setNewClientName(e.target.value)} placeholder="Nome do cliente" className={inp + ' flex-1'} />
                <button type="button" onClick={() => setShowNewClient(false)}
                  className="px-3 py-2 text-xs text-gray-400 border border-surface-200 rounded-xl hover:bg-surface-50 transition">Cancelar</button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Tipo de contrato</label>
            <div className="flex gap-1">
              {[['fixed','Preço fixo'],['hourly','Por hora'],['split','Split %']].map(([val, label]) => (
                <button key={val} type="button" onClick={() => set('contract_type', val)}
                  className={`flex-1 py-2 text-xs rounded-xl border font-medium transition ${form.contract_type === val ? 'bg-brand-500 text-white border-brand-500' : 'border-surface-200 text-gray-400 hover:border-brand-300'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {form.contract_type === 'hourly' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Taxa por hora (USD)</label>
                <input type="number" min="0" step="0.01" value={form.hourly_rate} onChange={e => set('hourly_rate', e.target.value)} placeholder="Ex: 35.00" className={inp} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Total de horas contratadas</label>
                <input type="number" min="0" step="0.5" value={form.total_hours} onChange={e => set('total_hours', e.target.value)} placeholder="Ex: 80" className={inp} />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Valor total</label>
                <input type="number" min="0" step="0.01" value={form.value} onChange={e => set('value', e.target.value)} placeholder="0.00" className={inp} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Moeda</label>
                <select value={form.currency} onChange={e => set('currency', e.target.value)} className={inp}>
                  <option value="USD">USD $</option>
                  <option value="BRL">BRL R$</option>
                  <option value="EUR">EUR €</option>
                </select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} className={inp}>
                <option value="active">Ativo</option>
                <option value="paused">Pausado</option>
                <option value="completed">Concluído</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Plataforma</label>
              <select value={form.platform} onChange={e => set('platform', e.target.value)} className={inp}>
                <option value="">Selecionar</option>
                <option value="upwork">Upwork</option>
                <option value="direct">Direto</option>
                <option value="referral">Indicação</option>
                <option value="other">Outro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Data de início</label>
              <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} className={inp} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Prazo final</label>
              <input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} className={inp} />
            </div>
          </div>

          {form.platform === 'upwork' && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Link Upwork</label>
              <input value={form.upwork_url} onChange={e => set('upwork_url', e.target.value)} placeholder="https://www.upwork.com/contracts/..." className={inp} />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Descrição</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} placeholder="Descrição do projeto" className={inp} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Notas internas</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Notas, observações..." className={inp} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 border border-surface-200 rounded-xl transition">Cancelar</button>
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 px-5 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition">
              {loading && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? 'Salvar' : 'Criar Projeto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
