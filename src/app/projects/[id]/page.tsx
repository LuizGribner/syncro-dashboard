'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Edit2, Trash2, Users, Plus, X,
  ExternalLink, Calendar, DollarSign, Upload, FileText,
  Loader2, CheckCircle2, Circle, Clock, Flag
} from 'lucide-react'
import ProjectFormModal from '../ProjectFormModal'

const STATUS_LABEL: Record<string, string> = {
  active: 'Ativo', paused: 'Pausado', completed: 'Concluído', cancelled: 'Cancelado'
}
const STATUS_BADGE: Record<string, string> = {
  active: 'badge-active', paused: 'badge-paused', completed: 'badge-completed', cancelled: 'badge-cancelled'
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [project, setProject] = useState<any>(null)
  const [employees, setEmployees] = useState<any[]>([])
  const [allEmployees, setAllEmployees] = useState<any[]>([])
  const [files, setFiles] = useState<any[]>([])
  const [milestones, setMilestones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Team state
  const [addingEmployee, setAddingEmployee] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [roleInProject, setRoleInProject] = useState('')
  const [paymentType, setPaymentType] = useState('fixed')
  const [hourlyRate, setHourlyRate] = useState('')
  const [splitPercent, setSplitPercent] = useState('')
  const [fixedAmount, setFixedAmount] = useState('')
  const [fixedCurrency, setFixedCurrency] = useState('BRL')

  // Milestone state
  const [addingMilestone, setAddingMilestone] = useState(false)
  const [msForm, setMsForm] = useState({ title: '', value: '', currency: 'USD', hours: '', due_date: '', notes: '' })

  async function load() {
    setLoading(true)
    const [{ data: proj }, { data: emps }, { data: allEmps }, { data: fls }, { data: ms }] = await Promise.all([
      supabase.from('projects').select('*, clients(*)').eq('id', id).single(),
      supabase.from('project_employees').select('*, employees(*)').eq('project_id', id),
      supabase.from('employees').select('*').eq('status', 'active'),
      supabase.from('project_files').select('*').eq('project_id', id).order('created_at', { ascending: false }),
      supabase.from('project_milestones').select('*').eq('project_id', id).order('sort_order').order('created_at'),
    ])
    setProject(proj)
    setEmployees(emps ?? [])
    setAllEmployees(allEmps ?? [])
    setFiles(fls ?? [])
    setMilestones(ms ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  // Milestones
  async function addMilestone() {
    if (!msForm.title.trim()) return
    await supabase.from('project_milestones').insert({
      project_id: id,
      title: msForm.title,
      value: Number(msForm.value) || 0,
      currency: msForm.currency,
      hours: project?.contract_type === 'hourly' ? Number(msForm.hours) || null : null,
      due_date: msForm.due_date || null,
      notes: msForm.notes || null,
      sort_order: milestones.length,
    } as any)
    setMsForm({ title: '', value: '', currency: 'USD', hours: '', due_date: '', notes: '' })
    setAddingMilestone(false)
    load()
  }

  async function toggleMilestone(ms: any) {
    const isDone = ms.status === 'completed'
    await supabase.from('project_milestones').update({
      status: isDone ? 'pending' : 'completed',
      completed_at: isDone ? null : new Date().toISOString(),
    }).eq('id', ms.id)

    if (!isDone && ms.hours && project?.contract_type === 'hourly' && project?.hourly_rate) {
      const dev = employees[0]
      if (dev?.employee_id) {
        const total = Number(ms.hours) * Number(project.hourly_rate)
        const isOwner = dev.employees?.name === 'Luiz Gribner'

        if (isOwner) {
          // Receita para mim
          await supabase.from('revenues').insert({
            project_id: id,
            amount: total,
            currency: 'USD',
            revenue_date: new Date().toISOString().split('T')[0],
            description: `${ms.title} — ${ms.hours}h × $${project.hourly_rate}/hora`,
          })
        } else {
          // Pagamento pendente para o dev
          await supabase.from('payments').insert({
            employee_id: dev.employee_id,
            project_id: id,
            amount: total,
            currency: 'USD',
            payment_date: new Date().toISOString().split('T')[0],
            method: 'wise',
            description: `${ms.title} — ${ms.hours}h × $${project.hourly_rate}/hora`,
            status: 'pending',
          })
        }
      }
    }

    load()
  }

  async function deleteMilestone(msId: string) {
    await supabase.from('project_milestones').delete().eq('id', msId)
    load()
  }

  // Team
  async function addEmployee() {
    if (!selectedEmployee) return
    await supabase.from('project_employees').insert({
      project_id: id,
      employee_id: selectedEmployee,
      role_in_project: roleInProject || null,
      payment_type: paymentType,
      hourly_rate: paymentType === 'hourly' ? Number(hourlyRate) || null : null,
      split_percent: paymentType === 'project_split' ? Number(splitPercent) || null : null,
      fixed_amount: paymentType === 'fixed' ? Number(fixedAmount) || null : null,
      fixed_currency: fixedCurrency,
    } as any)
    setAddingEmployee(false)
    setSelectedEmployee('')
    setRoleInProject('')
    setPaymentType('fixed')
    setHourlyRate('')
    setSplitPercent('')
    setFixedAmount('')
    load()
  }

  async function removeEmployee(peId: string) {
    await supabase.from('project_employees').delete().eq('id', peId)
    load()
  }

  async function handleDelete() {
    if (!confirm('Tem certeza que deseja excluir este projeto?')) return
    await supabase.from('projects').delete().eq('id', id)
    router.push('/projects')
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const path = `${id}/${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('project-files').upload(path, file)
    if (!error) {
      await supabase.from('project_files').insert({
        project_id: id, name: file.name, storage_path: path, size_bytes: file.size, mime_type: file.type,
      })
      load()
    }
    setUploading(false)
  }

  async function handleFileDelete(file: any) {
    await supabase.storage.from('project-files').remove([file.storage_path])
    await supabase.from('project_files').delete().eq('id', file.id)
    load()
  }

  async function handleFileDownload(file: any) {
    const { data } = await supabase.storage.from('project-files').createSignedUrl(file.storage_path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  const teamIds = employees.map(e => e.employee_id)
  const availableEmployees = allEmployees.filter(e => !teamIds.includes(e.id))
  const completedMs = milestones.filter(m => m.status === 'completed')
  const totalMsValue = milestones.reduce((s, m) => s + (Number(m.value) || 0), 0)
  const completedMsValue = completedMs.reduce((s, m) => s + (Number(m.value) || 0), 0)
  const totalMsHours = milestones.reduce((s, m) => s + (Number(m.hours) || 0), 0)
  const completedMsHours = completedMs.reduce((s, m) => s + (Number(m.hours) || 0), 0)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-brand-400" size={24} />
    </div>
  )

  if (!project) return <div className="text-gray-400 text-sm">Projeto não encontrado.</div>

  const isHourly = project.contract_type === 'hourly'

  return (
    <div>
      <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6 transition">
        <ArrowLeft size={14} /> Projetos
      </Link>

      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-semibold text-surface-800">{project.title}</h1>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_BADGE[project.status] ?? ''}`}>
              {STATUS_LABEL[project.status]}
            </span>
            {project.contract_type && (
              <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-surface-100 text-gray-500 capitalize">
                {project.contract_type === 'fixed' ? 'Preço fixo' : project.contract_type === 'hourly' ? 'Por hora' : 'Split %'}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400">
            {project.clients?.name ?? 'Sem cliente'}
            {project.clients?.company ? ` · ${project.clients.company}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {project.upwork_url && (
            <a href={project.upwork_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-500 border border-surface-200 rounded-xl hover:bg-surface-50 transition">
              <ExternalLink size={13} /> Upwork
            </a>
          )}
          <button onClick={() => setShowEdit(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-500 border border-surface-200 rounded-xl hover:bg-surface-50 transition">
            <Edit2 size={13} /> Editar
          </button>
          <button onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-red-400 border border-red-100 rounded-xl hover:bg-red-50 transition">
            <Trash2 size={13} /> Excluir
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          {/* Detalhes */}
          <div className="bg-white rounded-2xl border border-surface-200 p-6">
            <h2 className="text-sm font-semibold text-surface-800 mb-4">Detalhes</h2>
            <div className="grid grid-cols-2 gap-4">
              {isHourly ? (
                <>
                  <Detail icon={<Clock size={14} />} label="Taxa por hora">
                    <span className="font-semibold text-surface-800">${Number(project.hourly_rate).toFixed(2)} USD/hora</span>
                  </Detail>
                  <Detail icon={<Clock size={14} />} label="Total contratado">
                    <span className="font-semibold text-surface-800">{project.total_hours ?? '—'} horas</span>
                  </Detail>
                </>
              ) : (
                <Detail icon={<DollarSign size={14} />} label="Valor">
                  <span className="font-semibold text-surface-800">
                    {project.currency === 'USD' ? '$' : 'R$'}{Number(project.value).toLocaleString()} {project.currency}
                  </span>
                </Detail>
              )}
              <Detail icon={<Calendar size={14} />} label="Plataforma">
                <span className="capitalize">{project.platform ?? '—'}</span>
              </Detail>
              <Detail icon={<Calendar size={14} />} label="Início">
                {project.start_date ? new Date(project.start_date).toLocaleDateString('pt-BR') : '—'}
              </Detail>
              <Detail icon={<Calendar size={14} />} label="Prazo">
                {project.end_date ? new Date(project.end_date).toLocaleDateString('pt-BR') : '—'}
              </Detail>
            </div>
            {project.description && (
              <p className="text-sm text-gray-500 mt-4 pt-4 border-t border-surface-100">{project.description}</p>
            )}
            {project.notes && (
              <div className="mt-4 pt-4 border-t border-surface-100">
                <p className="text-xs font-medium text-gray-400 mb-1">Notas internas</p>
                <p className="text-sm text-gray-500">{project.notes}</p>
              </div>
            )}
          </div>

          {/* Milestones / Blocos de horas */}
          <div className="bg-white rounded-2xl border border-surface-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-surface-800 flex items-center gap-2">
                  <Flag size={15} />
                  {isHourly ? 'Blocos de horas' : 'Milestones'}
                </h2>
                {milestones.length > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {completedMs.length}/{milestones.length} concluídos
                    {isHourly
                      ? ` · ${completedMsHours}h / ${totalMsHours}h`
                      : ` · $${completedMsValue.toLocaleString()} / $${totalMsValue.toLocaleString()}`
                    }
                  </p>
                )}
              </div>
              <button onClick={() => setAddingMilestone(!addingMilestone)}
                className="text-xs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1">
                <Plus size={13} /> Adicionar
              </button>
            </div>

            {/* Progress bar */}
            {milestones.length > 0 && (
              <div className="mb-4">
                <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full transition-all"
                    style={{ width: `${milestones.length > 0 ? (completedMs.length / milestones.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}

            {/* Add form */}
            {addingMilestone && (
              <div className="mb-4 p-4 bg-surface-50 rounded-xl space-y-2 border border-surface-200">
                <input value={msForm.title} onChange={e => setMsForm(p => ({ ...p, title: e.target.value }))}
                  placeholder={isHourly ? 'Ex: Semana 1 (30h)' : 'Ex: Milestone 1 — Setup inicial'}
                  className="w-full text-sm border border-surface-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-brand-500" />
                <div className="grid grid-cols-2 gap-2">
                  {isHourly ? (
                    <input type="number" value={msForm.hours} onChange={e => setMsForm(p => ({ ...p, hours: e.target.value }))}
                      placeholder="Horas (ex: 30)"
                      className="text-sm border border-surface-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-brand-500" />
                  ) : (
                    <input type="number" value={msForm.value} onChange={e => setMsForm(p => ({ ...p, value: e.target.value }))}
                      placeholder="Valor (USD)"
                      className="text-sm border border-surface-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-brand-500" />
                  )}
                  <input type="date" value={msForm.due_date} onChange={e => setMsForm(p => ({ ...p, due_date: e.target.value }))}
                    className="text-sm border border-surface-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-brand-500" />
                </div>
                <input value={msForm.notes} onChange={e => setMsForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Notas (opcional)"
                  className="w-full text-sm border border-surface-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-brand-500" />
                <div className="flex gap-2">
                  <button onClick={addMilestone}
                    className="flex-1 py-2 bg-brand-500 text-white text-xs rounded-xl hover:bg-brand-600 transition font-medium">
                    Adicionar
                  </button>
                  <button onClick={() => setAddingMilestone(false)}
                    className="flex-1 py-2 border border-surface-200 text-gray-400 text-xs rounded-xl hover:bg-surface-50 transition">
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {milestones.length === 0 && !addingMilestone ? (
              <p className="text-xs text-gray-400 py-4 text-center">
                Nenhum {isHourly ? 'bloco de horas' : 'milestone'} cadastrado.
              </p>
            ) : (
              <div className="space-y-2">
                {milestones.map(ms => (
                  <div key={ms.id} className={`flex items-start gap-3 p-3 rounded-xl border transition group ${ms.status === 'completed' ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-surface-200 hover:border-surface-300'}`}>
                    <button onClick={() => toggleMilestone(ms)} className="mt-0.5 flex-shrink-0">
                      {ms.status === 'completed'
                        ? <CheckCircle2 size={18} className="text-emerald-500" />
                        : <Circle size={18} className="text-gray-300 hover:text-brand-400 transition" />
                      }
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${ms.status === 'completed' ? 'text-emerald-700 line-through' : 'text-surface-800'}`}>
                        {ms.title}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        {isHourly && ms.hours && (
                          <span className="text-xs text-blue-500 font-medium">{ms.hours}h</span>
                        )}
                        {!isHourly && ms.value > 0 && (
                          <span className="text-xs text-emerald-600 font-medium">${Number(ms.value).toLocaleString()}</span>
                        )}
                        {ms.due_date && (
                          <span className="text-xs text-gray-400">
                            {new Date(ms.due_date).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                        {ms.completed_at && (
                          <span className="text-xs text-emerald-500">
                            ✓ {new Date(ms.completed_at).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                      {ms.notes && <div className="text-xs text-gray-400 mt-1 italic">{ms.notes}</div>}
                    </div>
                    <button onClick={() => deleteMilestone(ms.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition mt-0.5">
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Arquivos */}
          <div className="bg-white rounded-2xl border border-surface-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-surface-800">Arquivos</h2>
              <label className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-xl cursor-pointer transition ${uploading ? 'opacity-50' : 'text-brand-500 border-brand-200 hover:bg-brand-50'}`}>
                {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                {uploading ? 'Enviando...' : 'Upload'}
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
              </label>
            </div>
            {files.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">Nenhum arquivo anexado.</p>
            ) : (
              <div className="space-y-2">
                {files.map(f => (
                  <div key={f.id} className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl">
                    <FileText size={14} className="text-gray-400 flex-shrink-0" />
                    <button onClick={() => handleFileDownload(f)} className="text-sm text-brand-500 hover:underline flex-1 text-left truncate">{f.name}</button>
                    <span className="text-xs text-gray-400">{f.size_bytes ? `${(f.size_bytes / 1024).toFixed(0)} KB` : ''}</span>
                    <button onClick={() => handleFileDelete(f)} className="text-gray-300 hover:text-red-400 transition"><X size={13} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div className="bg-white rounded-2xl border border-surface-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-surface-800 flex items-center gap-2">
                <Users size={15} /> Equipe ({employees.length})
              </h2>
              {availableEmployees.length > 0 && (
                <button onClick={() => setAddingEmployee(!addingEmployee)}
                  className="text-xs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1">
                  <Plus size={13} /> Adicionar
                </button>
              )}
            </div>

            {addingEmployee && (
              <div className="mb-4 p-3 bg-surface-50 rounded-xl space-y-2">
                <select value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)}
                  className="w-full text-xs border border-surface-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-brand-500">
                  <option value="">Selecionar funcionário</option>
                  {availableEmployees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} — {e.role}</option>
                  ))}
                </select>
                <input value={roleInProject} onChange={e => setRoleInProject(e.target.value)}
                  placeholder="Papel no projeto (opcional)"
                  className="w-full text-xs border border-surface-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-brand-500" />
                <div>
                  <p className="text-xs text-gray-400 mb-1 font-medium">Tipo de pagamento</p>
                  <div className="flex gap-1">
                    {[['fixed','Fixo'],['hourly','Por hora'],['project_split','% Projeto']].map(([val, label]) => (
                      <button key={val} type="button" onClick={() => setPaymentType(val)}
                        className={`flex-1 py-1 text-xs rounded-lg border transition ${paymentType === val ? 'bg-brand-500 text-white border-brand-500' : 'border-surface-200 text-gray-400 hover:border-brand-300'}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                {paymentType === 'hourly' && (
                  <div className="flex gap-2 items-center">
                    <input type="number" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} placeholder="Valor/hora"
                      className="flex-1 text-xs border border-surface-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-brand-500" />
                    <span className="text-xs text-gray-400 flex-shrink-0">USD/hora</span>
                  </div>
                )}
                {paymentType === 'project_split' && (
                  <div className="flex gap-2 items-center">
                    <input type="number" min="0" max="100" value={splitPercent} onChange={e => setSplitPercent(e.target.value)} placeholder="Ex: 40"
                      className="flex-1 text-xs border border-surface-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-brand-500" />
                    <span className="text-xs text-gray-400 flex-shrink-0">% do projeto</span>
                  </div>
                )}
                {paymentType === 'fixed' && (
                  <div className="flex gap-2">
                    <input type="number" value={fixedAmount} onChange={e => setFixedAmount(e.target.value)} placeholder="Valor fixo"
                      className="flex-1 text-xs border border-surface-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-brand-500" />
                    <select value={fixedCurrency} onChange={e => setFixedCurrency(e.target.value)}
                      className="text-xs border border-surface-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-brand-500">
                      <option value="BRL">BRL</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={addEmployee}
                    className="flex-1 py-1.5 bg-brand-500 text-white text-xs rounded-lg hover:bg-brand-600 transition">Adicionar</button>
                  <button onClick={() => setAddingEmployee(false)}
                    className="flex-1 py-1.5 border border-surface-200 text-gray-400 text-xs rounded-lg hover:bg-surface-50 transition">Cancelar</button>
                </div>
              </div>
            )}

            {employees.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">Nenhum funcionário alocado.</p>
            ) : (
              <div className="space-y-2">
                {employees.map(pe => (
                  <div key={pe.id} className="flex items-start gap-3 p-2 rounded-xl hover:bg-surface-50 group">
                    <div className="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-brand-600 mt-0.5">
                      {pe.employees?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-surface-800 truncate">{pe.employees?.name}</div>
                      <div className="text-xs text-gray-400">{pe.role_in_project || pe.employees?.role}</div>
                      <div className="text-xs mt-0.5">
                        {pe.payment_type === 'hourly' && <span className="text-blue-500 font-medium">${pe.hourly_rate}/hora</span>}
                        {pe.payment_type === 'project_split' && <span className="text-violet-500 font-medium">{pe.split_percent}% do projeto</span>}
                        {pe.payment_type === 'fixed' && pe.fixed_amount && (
                          <span className="text-emerald-500 font-medium">
                            {pe.fixed_currency === 'USD' ? '$' : 'R$'}{Number(pe.fixed_amount).toLocaleString()}/mês
                          </span>
                        )}
                      </div>
                    </div>
                    <button onClick={() => removeEmployee(pe.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition mt-1">
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showEdit && <ProjectFormModal project={project} onClose={() => { setShowEdit(false); load() }} />}
    </div>
  )
}

function Detail({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-gray-300 mt-0.5">{icon}</span>
      <div>
        <div className="text-xs text-gray-400">{label}</div>
        <div className="text-sm text-gray-600 mt-0.5">{children}</div>
      </div>
    </div>
  )
}
