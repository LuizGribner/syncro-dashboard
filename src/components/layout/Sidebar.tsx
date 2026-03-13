'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, FolderKanban, Users, Wallet, Clock,
  LogOut, ChevronRight
} from 'lucide-react'
import clsx from 'clsx'

const NAV = [
  { href: '/dashboard',  label: 'Visão Geral',  icon: LayoutDashboard },
  { href: '/projects',   label: 'Projetos',     icon: FolderKanban },
  { href: '/employees',  label: 'Equipe',       icon: Users },
  { href: '/hours',      label: 'Horas',        icon: Clock },
  { href: '/finance',    label: 'Financeiro',   icon: Wallet },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-surface-900 border-r border-white/5 flex flex-col z-30">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 28 28" fill="none">
              <path d="M4 14 L10 8 L16 14 L22 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 20 L10 14 L16 20 L22 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-white leading-tight">Syncro</div>
            <div className="text-xs text-gray-500 leading-tight">Solutions LLC</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                active
                  ? 'bg-brand-500/15 text-brand-400'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon size={17} className={clsx(active ? 'text-brand-400' : 'text-gray-500 group-hover:text-gray-300')} />
              {label}
              {active && <ChevronRight size={13} className="ml-auto opacity-50" />}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-all"
        >
          <LogOut size={17} />
          Sair
        </button>
      </div>
    </aside>
  )
}
