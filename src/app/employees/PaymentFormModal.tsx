'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Loader2 } from 'lucide-react'

interface Props { employee: any; onClose: () => void }

export default function PaymentFormModal({ employee, onClose }: Props) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    amount: '',
    currency: 'BRL',
    payment_date: new Date().toISOString().split('T')[0],
    method: 'pix',
    project_id: '',
    description: '',
    status: 'paid',
  })

  useEffect(() => {
    supabase
      .from('project_employees')
      .select('projects(id, title)')
      .eq('employee_id', employee.id)
      .then(({ data }) => setProjects(data?.map((d: any) => d.projects).filter(Boolean) ?? []))
  }, [employee.id])

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const payload = {
      employee_id: employee.id,
      amount: Number(form.amount),
      currency: form.currency,
      payment_date: form.payment_date,
      method: form.method,
      project_id: form.project_id || null,
      description: form.description || null,
      status: form.status,
    }
    console.log('Inserting payment:', payload)
    const { data, error: err } = await supabase.from('payments').insert(payload as any).select()
    console.log('Result:', data, err)
    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }
    setLoading(false)
    onClose()
  }

  const inp = 'w-full border border-surface-200 rounded-xl px-3 py-2 text-sm text-surface-800 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 bg-surface-50'

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-5 border-b border-surface-100">
          <div>
            <h2 className="font-semibold text-surface-800">Registrar Pagamento</h2>
            <p className="text-xs text-gray-400 mt-0.5">Para: {employee.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">{error}</div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Valor *</label>
              <input required type="number" min="0" step="0.01" value={form.amount}
                onChange={e => set('amount', e.target.value)} placeholder="0.00" className={inp} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Moeda</label>
              <select value={form.currency} onChange={e => set('currency', e.target.value)} className={inp}>
                <option value="BRL">BRL R$</option>
                <option value="USD">USD $</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Data</label>
              <input type="date" value={form.payment_date} onChange={e => set('payment_date', e.target.value)} className={inp} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Método</label>
              <select value={form.method} onChange={e => set('method', e.target.value)} className={inp}>
                <option value="pix">PIX</option>
                <option value="transferencia">Transferência</option>
                <option value="paypal">PayPal</option>
                <option value="wise">Wise</option>
                <option value="outro">Outro</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)} className={inp}>
              <option value="paid">Pago</option>
              <option value="pending">Pendente</option>
            </select>
          </div>
          {projects.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Projeto (opcional)</label>
              <select value={form.project_id} onChange={e => set('project_id', e.target.value)} className={inp}>
                <option value="">Nenhum</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Descrição</label>
            <input value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Ex: Pagamento referente a julho" className={inp} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-500 border border-surface-200 rounded-xl hover:bg-surface-50 transition">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition">
              {loading && <Loader2 size={14} className="animate-spin" />}
              Registrar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
