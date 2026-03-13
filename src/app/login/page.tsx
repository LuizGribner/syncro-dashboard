'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email ou senha incorretos.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center px-4">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'linear-gradient(#3b5bdb 1px, transparent 1px), linear-gradient(90deg, #3b5bdb 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />

      <div className="relative w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-500 mb-4 shadow-lg shadow-brand-500/30">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M4 14 L10 8 L16 14 L22 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 20 L10 14 L16 20 L22 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Syncro Solutions</h1>
          <p className="text-sm text-gray-400 mt-1">Dashboard interno</p>
        </div>

        {/* Card */}
        <div className="bg-surface-800 border border-white/10 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-all duration-200 text-sm shadow-lg shadow-brand-500/20"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Syncro Solutions LLC · Wyoming, USA
        </p>
      </div>
    </div>
  )
}
