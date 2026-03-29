'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Check if already logged in
  useEffect(() => {
    fetch('/api/admin')
      .then((res) => {
        if (res.ok) router.replace('/admin/reservas')
        else setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [router])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      router.push('/admin/reservas')
    } else {
      setError('Senha incorreta')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">Painel Admin</h1>
        <p className="text-sm text-gray-500 text-center mb-6">Camping Caiçara</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite a senha"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800 placeholder-gray-400"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full bg-green-700 text-white py-2 rounded-md hover:bg-green-800 transition-colors font-medium"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  )
}
