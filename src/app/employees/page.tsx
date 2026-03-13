'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Users, FolderKanban, X, Loader2, Edit2 } from 'lucide-react'
import EmployeeFormModal from './EmployeeFormModal'
import PaymentFormModal from './PaymentFormModal'

export default function EmployeesPage() {
  const supabase = createClient()
  const [employees, setEmployees] = useState<any[]>([])
  const [projects, setProjects] = useState<Record<string, any[]>>({})
  const [payments, setPayments] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editEmployee, setEditEmployee] = useState<any>(null)
  const [payEmployee, setPayEmployee] = useState<any>(null)

  async function load() {
    setLoading(true)
    const [{ data: emps }, { data: pe }, { data: pays }] = await Promise.all([
      supabase.from('employees').select('*').order('name'),
      supabase.from('project_employees').select('employee_id, projects(id, title, status)'),
      supabase.from('payments').select('employee_id, amount').eq('status', 'paid'),
    ])

    setEmployees(emps ?? [])

    // Group projects by employee
    const projMap: Record<string, any[]> = {}
    pe?.forEach(row => {
      if (!projMap[row.employee_id]) projMap[row.employee_id] = []
      projMap[row.employee_id].push(row.projects)
    })
    setProjects(projMap)

    // Sum payments per employee
    const payMap: Record<string, number> = {}
    pays?.forEach(row => {
      payMap[row.employee_id] = (payMap[row.employee_id] ?? 0) + row.amount
    })
    setPayments(payMap)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function toggleStatus(emp: any) {
    const next = emp.status === 'active' ? 'inactive' : 'active'
    await supabase.from('employees').update({ status: next }).eq('id', emp.id)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-surface-800">Equipe</h1>
          <p className="text-sm text-gray-400 mt-1">{employees.filter(e => e.status === 'active').length} ativos</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition shadow-lg shadow-brand-500/20"
        >
          <Plus size={15} /> Novo Funcionário
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="animate-spin text-brand-400" size={24} />
        </div>
      ) : employees.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-200 py-16 text-center">
          <Users size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Nenhum funcionário cadastrado.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {employees.map(emp => {
            const empProjects = projects[emp.id] ?? []
            const totalPaid = payments[emp.id] ?? 0
            const activeProjects = empProjects.filter((p: any) => p?.status === 'active')
            return (
              <div key={emp.id} className="bg-white rounded-2xl border border-surface-200 p-6">
                <div className="flex items-start justify-between gap-4">
                  {/* Avatar + Info */}
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-brand-50 flex items-center justify-center flex-shrink-0 text-brand-600 font-semibold text-lg">
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-surface-800">{emp.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${emp.status === 'active' ? 'badge-active' : 'badge-inactive'}`}>
                          {emp.status === 'active' ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400 mt-0.5">{emp.role}</div>
                      {emp.email && <div className="text-xs text-gray-300 mt-0.5">{emp.email}</div>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => setPayEmployee(emp)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-emerald-600 border border-emerald-200 rounded-xl hover:bg-emerald-50 transition">
                      <Plus size={12} /> Pagamento
                    </button>
                    <button onClick={() => setEditEmployee(emp)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 border border-surface-200 rounded-xl hover:bg-surface-50 transition">
                      <Edit2 size={12} /> Editar
                    </button>
                    <button onClick={() => toggleStatus(emp)}
                      className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 border border-surface-200 rounded-xl hover:bg-surface-50 transition">
                      {emp.status === 'active' ? 'Desativar' : 'Ativar'}
                    </button>
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-6 mt-5 pt-4 border-t border-surface-100">
                  <div>
                    <div className="text-xs text-gray-400">Salário</div>
                    <div className="text-sm font-semibold text-surface-800 mt-0.5">
                      {emp.currency === 'USD' ? '$' : 'R$'}{Number(emp.salary).toLocaleString()} <span className="text-xs font-normal text-gray-400">/{emp.currency}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Total pago</div>
                    <div className="text-sm font-semibold text-emerald-600 mt-0.5">
                      R${totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Projetos ({empProjects.length})</div>
                    <div className="flex flex-wrap gap-1.5">
                      {empProjects.length === 0 ? (
                        <span className="text-xs text-gray-300">Sem projetos</span>
                      ) : empProjects.slice(0, 5).map((p: any, i: number) => p && (
                        <span key={i} className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'active' ? 'bg-brand-50 text-brand-600' : 'bg-surface-100 text-gray-500'}`}>
                          {p.title}
                        </span>
                      ))}
                      {empProjects.length > 5 && (
                        <span className="text-xs text-gray-400">+{empProjects.length - 5}</span>
                      )}
                    </div>
                  </div>
                </div>

                {emp.notes && (
                  <div className="mt-3 text-xs text-gray-400 italic">{emp.notes}</div>
                )}

                {/* Payment methods */}
                {emp.payment_methods?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-surface-100 flex flex-wrap gap-2">
                    {emp.payment_methods.map((m: any, i: number) => (
                      <span key={i} className="inline-flex items-center gap-1.5 text-xs bg-surface-50 border border-surface-200 px-2.5 py-1 rounded-lg text-gray-600">
                        <span className="capitalize font-medium text-gray-500">{m.type}</span>
                        <span className="text-gray-400">·</span>
                        <span>{m.identifier}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showModal && <EmployeeFormModal onClose={() => { setShowModal(false); load() }} />}
      {editEmployee && <EmployeeFormModal employee={editEmployee} onClose={() => { setEditEmployee(null); load() }} />}
      {payEmployee && <PaymentFormModal employee={payEmployee} onClose={() => { setPayEmployee(null); load() }} />}
    </div>
  )
}
