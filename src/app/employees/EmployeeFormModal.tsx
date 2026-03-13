'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Loader2, Plus, Trash2 } from 'lucide-react'

interface Props { employee?: any; onClose: () => void }

const PAYMENT_METHOD_TYPES = ['wise', 'pix', 'paypal', 'transferencia', 'revolut', 'crypto', 'outro']

export default function EmployeeFormModal({ employee, onClose }: Props) {
  const supabase = createClient()
  const isEdit = !!employee
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: employee?.name ?? '',
    role: employee?.role ?? '',
    email: employee?.email ?? '',
    salary: employee?.salary ?? '',
    currency: employee?.currency ?? 'BRL',
    start_date: employee?.start_date ?? '',
    notes: employee?.notes ?? '',
  })
  const [paymentMethods, setPaymentMethods] = useState<{type: string; identifier: string}[]>(
    employee?.payment_methods ?? []
  )

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function addPaymentMethod() {
    setPaymentMethods(prev => [...prev, { type: 'wise', identifier: '' }])
  }

  function updatePaymentMethod(i: number, field: 'type' | 'identifier', value: string) {
    setPaymentMethods(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m))
  }

  function removePaymentMethod(i: number) {
    setPaymentMethods(prev => prev.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const payload = {
      ...form,
      salary: Number(form.salary) || 0,
      start_date: form.start_date || null,
      payment_methods: paymentMethods.filter(m => m.identifier.trim()),
    }
    try {
      if (isEdit) {
        await supabase.from('employees').update(payload as never).eq('id', employee.id)
      } else {
        await supabase.from('employees').insert(payload as never)
      }
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
    onClose()
  }

  const inp = 'w-full border border-surface-200 rounded-xl px-3 py-2 text-sm text-surface-800 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 bg-surface-50'

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-surface-100">
          <h2 className="font-semibold text-surface-800">{isEdit ? 'Editar Funcionário' : 'Novo Funcionário'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Nome *</label>
            <input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Bruno Silva" className={inp} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Função / Cargo *</label>
            <input required value={form.role} onChange={e => set('role', e.target.value)} placeholder="Developer, Designer, etc." className={inp} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@exemplo.com" className={inp} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Salário base</label>
              <input type="number" min="0" step="0.01" value={form.salary} onChange={e => set('salary', e.target.value)} placeholder="0.00" className={inp} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Moeda</label>
              <select value={form.currency} onChange={e => set('currency', e.target.value)} className={inp}>
                <option value="BRL">BRL R$</option>
                <option value="USD">USD $</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Data de entrada</label>
            <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} className={inp} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-500">Formas de recebimento</label>
              <button type="button" onClick={addPaymentMethod}
                className="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-1 font-medium">
                <Plus size={12} /> Adicionar
              </button>
            </div>
            {paymentMethods.length === 0 ? (
              <p className="text-xs text-gray-300 italic">Nenhuma forma cadastrada.</p>
            ) : (
              <div className="space-y-2">
                {paymentMethods.map((m, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <select value={m.type} onChange={e => updatePaymentMethod(i, 'type', e.target.value)}
                      className="text-xs border border-surface-200 rounded-xl px-2 py-2 bg-surface-50 focus:outline-none focus:border-brand-500 w-28 capitalize">
                      {PAYMENT_METHOD_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                    </select>
                    <input value={m.identifier} onChange={e => updatePaymentMethod(i, 'identifier', e.target.value)}
                      placeholder="Email, chave, usuário..." className="flex-1 text-xs border border-surface-200 rounded-xl px-3 py-2 bg-surface-50 focus:outline-none focus:border-brand-500" />
                    <button type="button" onClick={() => removePaymentMethod(i)}
                      className="text-gray-300 hover:text-red-400 transition flex-shrink-0">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Notas</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Observações..." className={inp} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 border border-surface-200 rounded-xl transition">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 px-5 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition">
              {loading && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
