'use client'

import { useState } from 'react'
import { checkAvailability, AvailabilityResult } from '@/lib/availability'

export default function Home() {
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [results, setResults] = useState<AvailabilityResult[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Get today's date as minimum for the date picker
  const today = new Date().toISOString().split('T')[0]

  async function handleSearch() {
    if (!checkIn || !checkOut) {
      setError('Selecione as datas de entrada e saída')
      return
    }
    if (checkIn >= checkOut) {
      setError('A data de saída deve ser depois da entrada')
      return
    }

    setLoading(true)
    setError('')

    try {
      const data = await checkAvailability(checkIn, checkOut)
      setResults(data)
    } catch {
      setError('Erro ao verificar disponibilidade. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-green-50">
      {/* Header */}
      <header className="bg-green-800 text-white py-6 px-4 text-center">
        <h1 className="text-3xl font-bold">Camping Caiçara</h1>
        <p className="mt-2 text-green-200">Praia do Sono — Reserve sua estadia</p>
      </header>

      {/* Date Picker */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Verifique a disponibilidade
          </h2>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Entrada
              </label>
              <input
                type="date"
                min={today}
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800"
              />
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Saída
              </label>
              <input
                type="date"
                min={checkIn || today}
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="w-full sm:w-auto bg-green-700 text-white px-6 py-2 rounded-md hover:bg-green-800 disabled:bg-gray-400 transition-colors"
              >
                {loading ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
          </div>

          {error && (
            <p className="mt-3 text-red-600 text-sm">{error}</p>
          )}
        </div>

        {/* Results */}
        {results && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Acomodações disponíveis
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              {results.map((acc) => (
                <div
                  key={acc.id}
                  className={`rounded-lg border p-4 ${
                    acc.available
                      ? 'bg-white border-green-300'
                      : 'bg-gray-100 border-gray-300 opacity-60'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-800">{acc.name}</h3>
                      <p className="text-sm text-gray-500">{acc.description}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Capacidade: até {acc.max_capacity} {acc.max_capacity === 1 ? 'pessoa' : 'pessoas'}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        acc.available
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {acc.available ? 'Disponível' : 'Indisponível'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
