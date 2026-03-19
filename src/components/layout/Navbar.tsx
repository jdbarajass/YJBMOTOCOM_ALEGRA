'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import type { UserSession } from '@/types'

interface NavbarProps {
  session: UserSession
}

const NAV_LINKS = [
  { href: '/cierre', label: 'Cierre de Caja', icon: '🏦', roles: ['admin', 'sales'] },
  { href: '/ventas-mensuales', label: 'Ventas', icon: '📊', roles: ['admin', 'sales'] },
  { href: '/analytics', label: 'Analíticas', icon: '📈', roles: ['admin', 'sales'] },
  { href: '/inventario', label: 'Inventario', icon: '📦', roles: ['admin'] },
  { href: '/productos', label: 'Productos', icon: '🏍️', roles: ['admin'] },
  { href: '/usuarios', label: 'Usuarios', icon: '👥', roles: ['admin'] },
]

export default function Navbar({ session }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } finally {
      setLoggingOut(false)
    }
  }

  const allowedLinks = NAV_LINKS.filter((link) => link.roles.includes(session.role))

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/cierre" className="flex items-center gap-2">
            <span className="text-2xl">🏍️</span>
            <div>
              <span className="font-bold text-gray-900 text-lg">YJBMOTOCOM</span>
              <span className="hidden sm:block text-xs text-gray-500 -mt-1">Accesorios para Motos</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {allowedLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith(link.href)
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className="mr-1">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900">{session.name}</p>
              <p className="text-xs text-gray-500 capitalize">{session.role === 'admin' ? 'Administrador' : 'Vendedor'}</p>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="btn-secondary text-sm px-3 py-1.5"
            >
              {loggingOut ? '...' : 'Salir'}
            </button>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-1">
            {allowedLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith(link.href)
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
