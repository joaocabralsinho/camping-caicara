'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

const navItems = [
  { href: '/admin/reservas', label: 'Reservas' },
  { href: '/admin/precos', label: 'Preços' },
  { href: '/admin/temporadas', label: 'Temporadas' },
  { href: '/admin/bloqueios', label: 'Bloqueios' },
]

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    fetch('/api/admin')
      .then((res) => {
        if (res.ok) {
          setAuthenticated(true)
        } else {
          router.replace('/admin')
        }
      })
      .catch(() => router.replace('/admin'))
      .finally(() => setLoading(false))
  }, [router])

  async function handleLogout() {
    await fetch('/api/admin', { method: 'DELETE' })
    router.replace('/admin')
  }

  if (loading || !authenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top nav */}
      <header className="bg-green-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold">Camping Caiçara — Admin</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-green-200 hover:text-white transition-colors"
          >
            Sair
          </button>
        </div>

        <nav className="max-w-6xl mx-auto px-4 flex gap-1 pb-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-2 rounded-t-md text-sm font-medium transition-colors ${
                pathname === item.href
                  ? 'bg-gray-100 text-gray-800'
                  : 'text-green-200 hover:bg-green-700'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
