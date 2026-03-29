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

function accIcon(type: string) {
  switch (type) {
    case 'chale':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      )
    case 'cabana':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
        </svg>
      )
    case 'suite':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      )
    default: // camping
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
        </svg>
      )
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
      const availability = await checkAvailability(checkIn, checkOut)
      const allIds = availability.map((a) => a.id)
      const prices = await getPrices(allIds, checkIn, checkOut, numGuests)

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
    <div className="min-h-screen flex flex-col bg-stone-50">
      {/* Hero */}
      <header className="relative bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 text-white overflow-hidden">
        {/* Decorative background shapes */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white" />
          <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-white" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 py-16 sm:py-24 text-center">
          <p className="text-green-300 text-sm font-medium tracking-widest uppercase mb-3">
            Praia do Sono — Paraty, RJ
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Camping Caiçara
          </h1>
          <p className="mt-4 text-lg text-green-200 max-w-xl mx-auto">
            Sua estadia em uma das praias mais bonitas do Rio de Janeiro.
            Chalés, cabanas e área de camping à beira-mar.
          </p>
        </div>
      </header>

      {/* Search Form */}
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 -mt-8 relative z-10">
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-800 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-shadow"
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-800 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-shadow"
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-800 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-shadow"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="w-full sm:w-auto bg-green-700 text-white px-8 py-2.5 rounded-lg hover:bg-green-800 disabled:bg-gray-400 transition-colors font-medium"
                >
                  {loading ? 'Buscando...' : 'Buscar'}
                </button>
              </div>
            </div>

            {error && (
              <p className="mt-3 text-red-600 text-sm">{error}</p>
            )}
          </div>
        </div>

        {/* Results */}
        {results && (
          <div className="max-w-4xl mx-auto px-4 py-10">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Acomodações disponíveis
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              {results.map((acc) => {
                const unavailable = !acc.available
                const tooMany = acc.exceedsCapacity && acc.type !== 'camping'
                const dimmed = unavailable || tooMany

                return (
                  <div
                    key={acc.id}
                    className={`rounded-xl border p-5 transition-all ${
                      dimmed
                        ? 'bg-gray-50 border-gray-200 opacity-50'
                        : 'bg-white border-gray-200 hover:border-green-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <div className={`mt-0.5 ${dimmed ? 'text-gray-400' : 'text-green-700'}`}>
                          {accIcon(acc.type)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{acc.name}</h3>
                          <p className="text-sm text-gray-500 mt-0.5">{acc.description}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Até {acc.max_capacity} {acc.max_capacity === 1 ? 'pessoa' : 'pessoas'}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${
                          unavailable
                            ? 'bg-red-50 text-red-700'
                            : tooMany
                              ? 'bg-yellow-50 text-yellow-700'
                              : 'bg-green-50 text-green-700'
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
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        {acc.price ? (
                          <>
                            <div className="flex items-baseline justify-between">
                              <p className="text-2xl font-bold text-green-800">
                                {formatBRL(acc.price.totalPrice)}
                              </p>
                              {acc.price.seasonName && (
                                <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                                  {acc.price.seasonName}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {priceLabel(acc.price, numGuests)}
                            </p>
                            <button
                              onClick={() =>
                                router.push(
                                  `/reservar?id=${acc.id}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${numGuests}`
                                )
                              }
                              className="mt-4 w-full bg-green-700 text-white py-2.5 rounded-lg hover:bg-green-800 transition-colors text-sm font-medium"
                            >
                              Reservar
                            </button>
                          </>
                        ) : (
                          <a
                            href="https://wa.me/5521996628900?text=Olá! Gostaria de saber o preço da Suíte."
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-green-700 font-medium hover:text-green-900 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
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

        {/* About section (shown when no results yet) */}
        {!results && (
          <div className="max-w-4xl mx-auto px-4 py-16">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-gray-800">Nossas acomodações</h2>
              <p className="mt-2 text-gray-500">Opções para todos os estilos de viagem</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: 'chale', title: 'Chalés', desc: 'Conforto para famílias e grupos de até 6 pessoas' },
                { icon: 'cabana', title: 'Cabanas', desc: 'Perfeito para casais em busca de tranquilidade' },
                { icon: 'suite', title: 'Suíte', desc: 'Acomodação especial para até 5 pessoas' },
                { icon: 'camping', title: 'Camping', desc: 'Traga sua barraca e viva a natureza' },
              ].map((item) => (
                <div key={item.icon} className="bg-white rounded-xl p-6 text-center border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 text-green-700">
                    {accIcon(item.icon)}
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-16 bg-white rounded-xl border border-gray-100 p-8 sm:p-10">
              <div className="grid sm:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">Sobre o Camping Caiçara</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Localizado na Praia do Sono, em Paraty (RJ), o Camping Caiçara oferece
                    uma experiência única em contato com a natureza. Com chalés confortáveis,
                    cabanas aconchegantes e uma ampla área de camping, é o destino perfeito
                    para quem busca paz e aventura.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">Como chegar</h3>
                  <p className="text-gray-600 leading-relaxed">
                    A Praia do Sono é acessível por trilha a partir do condomínio
                    Laranjeiras ou por barco. Uma experiência que começa antes mesmo
                    de chegar! Entre em contato pelo WhatsApp para orientações detalhadas.
                  </p>
                  <a
                    href="https://wa.me/5521996628900?text=Olá! Gostaria de saber como chegar no Camping Caiçara."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-4 text-green-700 font-medium hover:text-green-800 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Fale conosco no WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 mt-auto">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="grid sm:grid-cols-3 gap-8">
            <div>
              <h4 className="text-white font-semibold mb-3">Camping Caiçara</h4>
              <p className="text-sm leading-relaxed">
                Praia do Sono, Paraty — RJ<br />
                Um paraíso escondido no litoral do Rio de Janeiro.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Contato</h4>
              <div className="space-y-2 text-sm">
                <a
                  href="https://wa.me/5521996628900"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  +55 21 99662-8900
                </a>
                <a
                  href="mailto:campingcaicaraoficial@gmail.com"
                  className="flex items-center gap-2 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  campingcaicaraoficial@gmail.com
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Reservas</h4>
              <p className="text-sm leading-relaxed">
                Reserve online com pagamento seguro via Mercado Pago.
                Aceitamos PIX, cartão de crédito, débito e boleto.
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-6 text-center text-xs">
            <p>&copy; {new Date().getFullYear()} Camping Caiçara. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp button */}
      <a
        href="https://wa.me/5521996628900?text=Olá! Gostaria de informações sobre o Camping Caiçara."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-110"
        aria-label="WhatsApp"
      >
        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </div>
  )
}
