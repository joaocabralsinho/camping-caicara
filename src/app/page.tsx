'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { checkAvailability, AvailabilityResult } from '@/lib/availability'
import { getPrices, PriceResult } from '@/lib/pricing'

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function priceLabel(p: PriceResult, numGuests: number): string {
  switch (p.priceType) {
    case 'package':
      return `${formatBRL(p.totalPrice)} (pacote)`
    case 'per_person_per_night':
      return `${formatBRL(p.unitPrice)}/pessoa/noite · ${numGuests} pessoa${numGuests > 1 ? 's' : ''} · ${p.nights} noite${p.nights > 1 ? 's' : ''} = ${formatBRL(p.totalPrice)}`
    case 'per_person_per_day': {
      const days = p.nights + 1
      return `${formatBRL(p.unitPrice)}/pessoa/dia · ${numGuests} pessoa${numGuests > 1 ? 's' : ''} · ${days} dia${days > 1 ? 's' : ''} = ${formatBRL(p.totalPrice)}`
    }
    case 'per_night':
      return `${formatBRL(p.unitPrice)}/noite · ${p.nights} noite${p.nights > 1 ? 's' : ''} = ${formatBRL(p.totalPrice)}`
    default:
      return formatBRL(p.totalPrice)
  }
}

type ResultWithPrice = AvailabilityResult & {
  price: PriceResult | null
  exceedsCapacity: boolean
}

export default function Home() {
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [numGuests, setNumGuests] = useState(2)
  const [results, setResults] = useState<ResultWithPrice[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

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
    if (numGuests < 1) {
      setError('Número de pessoas deve ser pelo menos 1')
      return
    }

    setLoading(true)
    setError('')

    try {
      // 1. Check availability
      const availability = await checkAvailability(checkIn, checkOut)

      // 2. Get prices for all accommodations
      const allIds = availability.map((a) => a.id)
      const prices = await getPrices(allIds, checkIn, checkOut, numGuests)

      // 3. Combine results
      const combined: ResultWithPrice[] = availability.map((acc) => ({
        ...acc,
        price: prices.get(acc.id) || null,
        exceedsCapacity: numGuests > acc.max_capacity,
      }))

      setResults(combined)
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

      {/* Search Form */}
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

            <div className="w-full sm:w-32">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Pessoas
              </label>
              <input
                type="number"
                min={1}
                max={500}
                value={numGuests}
                onChange={(e) => setNumGuests(Number(e.target.value))}
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
              Acomodações
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              {results.map((acc) => {
                const unavailable = !acc.available
                const tooMany = acc.exceedsCapacity && acc.type !== 'camping'
                const dimmed = unavailable || tooMany

                return (
                  <div
                    key={acc.id}
                    className={`rounded-lg border p-4 ${
                      dimmed
                        ? 'bg-gray-100 border-gray-300 opacity-60'
                        : 'bg-white border-green-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-800">{acc.name}</h3>
                        <p className="text-sm text-gray-500">{acc.description}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Capacidade: até {acc.max_capacity}{' '}
                          {acc.max_capacity === 1 ? 'pessoa' : 'pessoas'}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${
                          unavailable
                            ? 'bg-red-100 text-red-800'
                            : tooMany
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {unavailable
                          ? 'Indisponível'
                          : tooMany
                            ? 'Excede capacidade'
                            : 'Disponível'}
                      </span>
                    </div>

                    {/* Pricing */}
                    {!unavailable && !tooMany && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        {acc.price ? (
                          <>
                            <p className="text-lg font-bold text-green-800">
                              {formatBRL(acc.price.totalPrice)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {priceLabel(acc.price, numGuests)}
                            </p>
                            {acc.price.seasonName && (
                              <span className="inline-block mt-1 text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                                {acc.price.seasonName}
                              </span>
                            )}
                            <button
                              onClick={() =>
                                router.push(
                                  `/reservar?id=${acc.id}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${numGuests}`
                                )
                              }
                              className="mt-3 w-full bg-green-700 text-white py-2 rounded-md hover:bg-green-800 transition-colors text-sm font-medium"
                            >
                              Reservar
                            </button>
                          </>
                        ) : (
                          <a
                            href="https://wa.me/5521996628900?text=Olá! Gostaria de saber o preço da Suíte."
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-green-700 underline hover:text-green-900"
                          >
                            Consulte preço via WhatsApp
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
