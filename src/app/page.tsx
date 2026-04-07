'use client'

import { useState, useRef } from 'react'
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

// Photo gallery with arrows
function PhotoGallery({ photos, alt }: { photos: string[]; alt: string }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  function scroll(direction: 'left' | 'right') {
    if (!scrollRef.current) return
    const amount = scrollRef.current.clientWidth * 0.7
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    })
  }

  return (
    <div className="relative group" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => scroll('left')}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-stone-800 w-10 h-10 rounded-full flex items-center justify-center shadow-md sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
        {photos.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`${alt} - foto ${i + 1}`}
            className="h-52 w-auto rounded-xl object-cover snap-start shrink-0"
            loading="lazy"
          />
        ))}
      </div>

      <button
        onClick={() => scroll('right')}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-stone-800 w-10 h-10 rounded-full flex items-center justify-center shadow-md sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}

// Accommodation showcase data
const accommodationShowcase = [
  {
    title: 'Área de Camping',
    desc: 'Ampla área verde com vista para as montanhas. Traga sua barraca!',
    capacity: 500,
    photos: [
      '/fotos/camping/camping-01.jpeg',
      '/fotos/camping/camping-02.jpeg',
      '/fotos/camping/camping-03.jpeg',
      '/fotos/camping/cozinha-01.jpeg',
      '/fotos/camping/cozinha-02.jpeg',
      '/fotos/camping/cozinha-03.jpeg',
      '/fotos/camping/banheiro-01.jpeg',
    ],
    cover: '/fotos/camping/camping-01.jpeg',
  },
  {
    title: 'Chalé 1',
    desc: 'Chalé espaçoso com dois andares, TV e conforto para até 6 pessoas.',
    capacity: 6,
    photos: Array.from({ length: 12 }, (_, i) => `/fotos/chale1/chale1-${String(i + 1).padStart(2, '0')}.jpeg`),
    cover: '/fotos/chale1/chale1-02.jpeg',
  },
  {
    title: 'Chalé 2',
    desc: 'Chalé aconchegante para até 4 pessoas.',
    capacity: 4,
    photos: Array.from({ length: 8 }, (_, i) => `/fotos/chale2/chale2-${String(i + 1).padStart(2, '0')}.jpeg`),
    cover: '/fotos/chale2/chale2-01.jpeg',
  },
  {
    title: 'Chalé 3',
    desc: 'Chalé confortável com vista para a natureza.',
    capacity: 4,
    photos: Array.from({ length: 7 }, (_, i) => `/fotos/chale3/chale3-${String(i + 1).padStart(2, '0')}.jpeg`),
    cover: '/fotos/chale3/chale3-01.jpeg',
  },
  {
    title: 'Suíte',
    desc: 'Varanda com rede, clima caiçara e muito aconchego.',
    capacity: 5,
    photos: Array.from({ length: 7 }, (_, i) => `/fotos/suite/suite-${String(i + 1).padStart(2, '0')}.jpeg`),
    cover: '/fotos/suite/suite-01.jpeg',
  },
  {
    title: 'Bangalô 1',
    desc: 'Bangalô rústico de bambu, perfeito para casais.',
    capacity: 2,
    photos: ['/fotos/bangalo1/bangalo1-01.jpeg', '/fotos/bangalo1/bangalo1-02.jpeg'],
    cover: '/fotos/bangalo1/bangalo1-02.jpeg',
  },
  {
    title: 'Bangalô 2',
    desc: 'Bangalô aconchegante em estilo caiçara.',
    capacity: 2,
    photos: ['/fotos/bangalo2/bangalo2-01.jpeg', '/fotos/bangalo2/bangalo2-02.jpeg'],
    cover: '/fotos/bangalo2/bangalo2-02.jpeg',
  },
]

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
  const [expandedAcc, setExpandedAcc] = useState<number | null>(null)
  const [expandedResult, setExpandedResult] = useState<number | null>(null)
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

      setTimeout(() => {
        document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch {
      setError('Erro ao verificar disponibilidade. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      {/* Navbar */}
      <nav className="absolute top-0 left-0 right-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <span className="text-white font-semibold tracking-wide text-lg">
            Camping Caiçara
          </span>
          <div className="hidden sm:flex items-center gap-8 text-white/80 text-sm">
            <a href="#acomodacoes" className="hover:text-white transition-colors">Acomodações</a>
            <a href="#sobre" className="hover:text-white transition-colors">Sobre</a>
            <a href="#contato" className="hover:text-white transition-colors">Contato</a>
            <a
              href="https://wa.me/5521996628900"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-1.5 rounded-full hover:bg-white/20 transition-colors"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </nav>

      {/* Hero — Adaline-style: clean, centered, nature image */}
      <header className="relative min-h-screen flex flex-col items-center justify-center text-white">
        <div className="absolute inset-0">
          <img
            src="/fotos/praia-do-sono.jpg"
            alt="Camping Caiçara — Praia do Sono"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-stone-50" />
        </div>

        <div className="relative z-10 text-center px-4 -mt-20">
          <p className="text-sm tracking-[0.3em] uppercase text-white/70 mb-6">
            Praia do Sono — Paraty, RJ
          </p>
          <h1 className="text-5xl sm:text-7xl tracking-tight leading-tight font-[family-name:var(--font-playfair)] italic">
            Apenas 10 segundos<br />
            <span className="not-italic font-bold">para o mar</span>
          </h1>
          <p className="mt-6 text-lg text-white/70 max-w-lg mx-auto font-light">
            Acorde, abra a porta e sinta a areia nos pés.
            Seu paraíso na Praia do Sono te espera.
          </p>

          <a
            href="#reservar"
            className="inline-block mt-10 bg-white text-stone-900 px-8 py-3 rounded-full text-sm font-medium hover:bg-stone-100 transition-colors"
          >
            Reservar agora
          </a>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </header>

      {/* Highlights strip */}
      <section className="bg-white border-b border-stone-100">
        <div className="max-w-5xl mx-auto px-4 py-14 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-3xl font-semibold text-stone-800">10s</p>
            <p className="text-sm text-stone-500 mt-1">do mar</p>
          </div>
          <div>
            <p className="text-3xl font-semibold text-stone-800">7</p>
            <p className="text-sm text-stone-500 mt-1">acomodações</p>
          </div>
          <div>
            <p className="text-3xl font-semibold text-stone-800">Cozinha</p>
            <p className="text-sm text-stone-500 mt-1">completa com utensílios</p>
          </div>
          <div>
            <p className="text-3xl font-semibold text-stone-800">Natureza</p>
            <p className="text-sm text-stone-500 mt-1">preservada e intocada</p>
          </div>
        </div>
      </section>

      <main className="flex-1">
        {/* Search Form */}
        <section id="reservar" className="max-w-3xl mx-auto px-4 py-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-light text-stone-800">
              Verifique a <span className="font-semibold">disponibilidade</span>
            </h2>
            <p className="text-stone-500 mt-2">Escolha suas datas e veja as opções</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
            <div className="flex flex-col sm:flex-row gap-5">
              <div className="flex-1">
                <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
                  Entrada
                </label>
                <input
                  type="date"
                  min={today}
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full border border-stone-200 rounded-xl px-4 py-3 text-stone-800 focus:ring-2 focus:ring-stone-400 focus:border-stone-400 outline-none transition-all"
                />
              </div>

              <div className="flex-1">
                <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
                  Saída
                </label>
                <input
                  type="date"
                  min={checkIn || today}
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full border border-stone-200 rounded-xl px-4 py-3 text-stone-800 focus:ring-2 focus:ring-stone-400 focus:border-stone-400 outline-none transition-all"
                />
              </div>

              <div className="w-full sm:w-32">
                <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
                  Pessoas
                </label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={numGuests}
                  onChange={(e) => setNumGuests(Number(e.target.value))}
                  className="w-full border border-stone-200 rounded-xl px-4 py-3 text-stone-800 focus:ring-2 focus:ring-stone-400 focus:border-stone-400 outline-none transition-all"
                />
              </div>
            </div>

            <button
              onClick={handleSearch}
              disabled={loading}
              className="mt-6 w-full bg-stone-900 text-white py-3 rounded-xl hover:bg-stone-800 disabled:bg-stone-300 transition-colors font-medium text-sm tracking-wide"
            >
              {loading ? 'Buscando...' : 'Buscar disponibilidade'}
            </button>

            {error && (
              <p className="mt-3 text-red-600 text-sm text-center">{error}</p>
            )}
          </div>
        </section>

        {/* Results */}
        {results && (
          <section id="results" className="max-w-4xl mx-auto px-4 pb-20">
            <h2 className="text-2xl font-light text-stone-800 mb-8">
              Acomodações <span className="font-semibold">disponíveis</span>
            </h2>

            <div className="grid gap-5 sm:grid-cols-2">
              {results.map((acc) => {
                const unavailable = !acc.available
                const tooMany = acc.exceedsCapacity && acc.type !== 'camping'
                const dimmed = unavailable || tooMany

                const showcase = accommodationShowcase.find((s) => {
                  const nameMap: Record<string, string> = {
                    'Chalé 1': 'Chalé 1',
                    'Chalé 2': 'Chalé 2',
                    'Chalé 3': 'Chalé 3',
                    'Suíte': 'Suíte',
                    'Cabana 1': 'Bangalô 1',
                    'Cabana 2': 'Bangalô 2',
                    'Área de Camping': 'Área de Camping',
                  }
                  return s.title === (nameMap[acc.name] || acc.name)
                })

                return (
                  <div
                    key={acc.id}
                    className={`rounded-2xl overflow-hidden transition-all ${
                      dimmed
                        ? 'opacity-40'
                        : 'hover:shadow-lg'
                    } bg-white border border-stone-200`}
                  >
                    {showcase && (
                      <>
                        <div className="h-52 overflow-hidden">
                          <img
                            src={showcase.cover}
                            alt={acc.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {expandedResult === acc.id && (
                          <div className="border-t border-stone-100 p-3 bg-stone-50">
                            <PhotoGallery photos={showcase.photos} alt={acc.name} />
                          </div>
                        )}
                      </>
                    )}

                    <div className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-stone-800 text-lg">{acc.name}</h3>
                          <p className="text-sm text-stone-500 mt-1">{acc.description}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-xs text-stone-400">
                              Até {acc.max_capacity} {acc.max_capacity === 1 ? 'pessoa' : 'pessoas'}
                            </p>
                            {showcase && (
                              <button
                                type="button"
                                onClick={() => setExpandedResult(expandedResult === acc.id ? null : acc.id)}
                                className="text-xs text-stone-900 font-medium flex items-center gap-1 hover:text-green-700 transition-colors cursor-pointer"
                              >
                                {expandedResult === acc.id ? 'Fechar fotos' : `Ver ${showcase.photos.length} fotos`}
                                <svg
                                  className={`w-3 h-3 transition-transform ${expandedResult === acc.id ? 'rotate-180' : ''}`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                        <span
                          className={`text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap ${
                            unavailable
                              ? 'bg-red-50 text-red-600'
                              : tooMany
                                ? 'bg-amber-50 text-amber-600'
                                : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {unavailable ? 'Indisponível' : tooMany ? 'Excede capacidade' : 'Disponível'}
                        </span>
                      </div>

                      {!unavailable && !tooMany && (
                        <div className="mt-5 pt-5 border-t border-stone-100">
                          {acc.price ? (
                            <>
                              <div className="flex items-baseline justify-between">
                                <p className="text-2xl font-semibold text-stone-800">
                                  {formatBRL(acc.price.totalPrice)}
                                </p>
                                {acc.price.seasonName && (
                                  <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full font-medium">
                                    {acc.price.seasonName}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-stone-400 mt-1">
                                {priceLabel(acc.price, numGuests)}
                              </p>
                              <button
                                onClick={() =>
                                  router.push(
                                    `/reservar?id=${acc.id}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${numGuests}`
                                  )
                                }
                                className="mt-5 w-full bg-stone-900 text-white py-3 rounded-xl hover:bg-stone-800 transition-colors text-sm font-medium"
                              >
                                Reservar
                              </button>
                            </>
                          ) : (
                            <a
                              href="https://wa.me/5521996628900?text=Olá! Gostaria de saber o preço da Suíte."
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-sm text-emerald-700 font-medium hover:text-emerald-900 transition-colors"
                            >
                              Consulte preço via WhatsApp
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Accommodations Showcase */}
        {!results && (
          <>
            <section id="acomodacoes" className="py-20">
              <div className="text-center mb-14 px-4">
                <h2 className="text-3xl sm:text-4xl font-light text-stone-800">
                  Conheça nossas <span className="font-semibold">acomodações</span>
                </h2>
                <p className="mt-3 text-stone-500 max-w-md mx-auto">
                  Do rústico ao confortável, cada espaço foi pensado para você aproveitar a natureza.
                </p>
              </div>

              <div className="max-w-5xl mx-auto px-4 space-y-5">
                {accommodationShowcase.map((acc, index) => (
                  <div
                    key={acc.title}
                    className="bg-white rounded-2xl border border-stone-100 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row">
                      <div className="sm:w-80 h-60 sm:h-auto shrink-0 overflow-hidden">
                        <img
                          src={acc.cover}
                          alt={acc.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 p-8 flex flex-col justify-center">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-semibold text-stone-800">{acc.title}</h3>
                          <span className="text-xs text-stone-400 bg-stone-100 px-2.5 py-1 rounded-full">
                            {acc.capacity === 500 ? 'Área aberta' : `Até ${acc.capacity} pessoas`}
                          </span>
                        </div>
                        <p className="text-stone-500 mt-2 leading-relaxed">{acc.desc}</p>
                        <button
                          type="button"
                          onClick={() => setExpandedAcc(expandedAcc === index ? null : index)}
                          className="text-sm text-stone-900 font-medium mt-5 flex items-center gap-1.5 hover:text-green-700 transition-colors cursor-pointer"
                        >
                          {expandedAcc === index ? 'Fechar fotos' : `Ver ${acc.photos.length} fotos`}
                          <svg
                            className={`w-4 h-4 transition-transform ${expandedAcc === index ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {expandedAcc === index && (
                      <div className="border-t border-stone-100 p-5 bg-stone-50">
                        <PhotoGallery photos={acc.photos} alt={acc.title} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* About */}
            <section id="sobre" className="py-20 bg-white">
              <div className="max-w-5xl mx-auto px-4">
                {/* Main selling points */}
                <div className="grid sm:grid-cols-3 gap-12 mb-20">
                  <div className="text-center">
                    <div className="w-14 h-14 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-7 h-7 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-stone-800 text-lg mb-2">Pé na areia</h3>
                    <p className="text-stone-500 text-sm leading-relaxed">
                      A apenas 10 segundos da praia. Acorde e mergulhe no mar mais
                      cristalino do litoral carioca.
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-14 h-14 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-7 h-7 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-stone-800 text-lg mb-2">Cozinha equipada</h3>
                    <p className="text-stone-500 text-sm leading-relaxed">
                      Cozinha comunitária completa com fogão, geladeira, panelas, pratos,
                      talheres e tudo que você precisa para suas refeições.
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-14 h-14 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-7 h-7 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-stone-800 text-lg mb-2">Natureza preservada</h3>
                    <p className="text-stone-500 text-sm leading-relaxed">
                      Sem carros, sem barulho. Apenas o som do mar, dos pássaros e a
                      tranquilidade da Mata Atlântica ao seu redor.
                    </p>
                  </div>
                </div>

                {/* About + How to get there */}
                <div className="grid sm:grid-cols-2 gap-16">
                  <div>
                    <p className="text-xs tracking-[0.3em] uppercase text-stone-400 mb-4">Sobre nós</p>
                    <h3 className="text-2xl font-light text-stone-800 mb-4">
                      Desconecte para <span className="font-semibold">reconectar</span>
                    </h3>
                    <p className="text-stone-500 leading-relaxed">
                      O Camping Caiçara é mais do que uma hospedagem — é uma experiência.
                      Localizado na Praia do Sono, em Paraty (RJ), oferecemos chalés
                      confortáveis, bangalôs rústicos e uma ampla área de camping com
                      toda a infraestrutura que você precisa: cozinha equipada,
                      banheiros limpos e o mar a poucos passos.
                    </p>
                  </div>
                  <div>
                    <p className="text-xs tracking-[0.3em] uppercase text-stone-400 mb-4">Como chegar</p>
                    <h3 className="text-2xl font-light text-stone-800 mb-4">
                      A aventura começa na <span className="font-semibold">trilha</span>
                    </h3>
                    <p className="text-stone-500 leading-relaxed">
                      A Praia do Sono é acessível por uma trilha de 30 minutos a partir
                      do condomínio Laranjeiras, ou por barco. Sem estradas, sem carros —
                      só você e a natureza. Parece longe, mas quando você chega, entende
                      por que vale cada passo.
                    </p>
                    <a
                      href="https://wa.me/5521996628900?text=Olá! Gostaria de saber como chegar no Camping Caiçara."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-5 text-stone-900 font-medium hover:text-stone-600 transition-colors text-sm"
                    >
                      Fale conosco para orientações
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </section>

            {/* Full-width image divider */}
            <div className="h-[400px] overflow-hidden">
              <img
                src="/fotos/camping/camping-02.jpeg"
                alt="Vista do Camping Caiçara"
                className="w-full h-full object-cover"
              />
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer id="contato" className="bg-stone-900 text-stone-400">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <div className="grid sm:grid-cols-3 gap-10">
            <div>
              <h4 className="text-white font-semibold text-lg mb-4">Camping Caiçara</h4>
              <p className="text-sm leading-relaxed">
                Praia do Sono, Paraty — RJ<br />
                Um paraíso escondido no litoral do Rio de Janeiro.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contato</h4>
              <div className="space-y-3 text-sm">
                <a
                  href="https://wa.me/5521996628900"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  +55 21 99662-8900
                </a>
                <a
                  href="mailto:campingcaicaraoficial@gmail.com"
                  className="flex items-center gap-2.5 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  campingcaicaraoficial@gmail.com
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Pagamento seguro</h4>
              <p className="text-sm leading-relaxed">
                Reserve online via Mercado Pago.
                Aceitamos PIX, cartão de crédito, débito e boleto.
              </p>
            </div>
          </div>
          <div className="border-t border-stone-800 mt-10 pt-8 text-center text-xs text-stone-600">
            <p>&copy; {new Date().getFullYear()} Camping Caiçara. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp */}
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
