'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getPrices, PriceResult } from '@/lib/pricing'
import { createReservation, Reservation } from '@/lib/reservations'
import { validateCPF, formatCPF } from '@/lib/cpf'

type Accommodation = {
  id: number
  name: string
  type: string
  max_capacity: number
  description: string
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function ReservarForm() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const accId = Number(searchParams.get('id'))
  const checkIn = searchParams.get('checkIn') || ''
  const checkOut = searchParams.get('checkOut') || ''
  const numGuests = Number(searchParams.get('guests')) || 2

  const [accommodation, setAccommodation] = useState<Accommodation | null>(null)
  const [price, setPrice] = useState<PriceResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [confirmation, setConfirmation] = useState<Reservation | null>(null)

  // Form fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [cpf, setCpf] = useState('')
  const [rg, setRg] = useState('')
  const [notes, setNotes] = useState('')

  // Load accommodation and recalculate price
  useEffect(() => {
    async function load() {
      if (!accId || !checkIn || !checkOut) {
        setError('Dados de reserva incompletos')
        setLoading(false)
        return
      }

      const { data: acc } = await supabase
        .from('accommodations')
        .select('*')
        .eq('id', accId)
        .single()

      if (!acc) {
        setError('Acomodação não encontrada')
        setLoading(false)
        return
      }

      setAccommodation(acc as Accommodation)

      const prices = await getPrices([accId], checkIn, checkOut, numGuests)
      setPrice(prices.get(accId) || null)
      setLoading(false)
    }

    load()
  }, [accId, checkIn, checkOut, numGuests])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim() || !email.trim() || !phone.trim() || !cpf.trim() || !rg.trim()) {
      setError('Preencha todos os campos obrigatórios')
      return
    }

    if (!validateCPF(cpf)) {
      setError('CPF inválido. Verifique o número digitado.')
      return
    }

    if (!price || !accommodation) return

    setSubmitting(true)
    setError('')

    try {
      const reservation = await createReservation({
        accommodation_id: accId,
        guest_name: name.trim(),
        guest_email: email.trim(),
        guest_phone: phone.trim(),
        cpf: cpf.replace(/\D/g, ''),
        rg: rg.trim(),
        num_people: numGuests,
        check_in: checkIn,
        check_out: checkOut,
        total_price: price.totalPrice,
        notes: notes.trim() || undefined,
      })

      setConfirmation(reservation)
    } catch {
      setError('Erro ao criar reserva. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  // Format dates for display
  function formatDate(dateStr: string): string {
    const [y, m, d] = dateStr.split('-')
    return `${d}/${m}/${y}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <p className="text-gray-600">Carregando...</p>
      </div>
    )
  }

  // ---- Confirmation screen ----
  if (confirmation) {
    return (
      <div className="min-h-screen bg-green-50">
        <header className="bg-green-800 text-white py-6 px-4 text-center">
          <h1 className="text-3xl font-bold">Camping Caiçara</h1>
          <p className="mt-2 text-green-200">Praia do Sono</p>
        </header>

        <main className="max-w-lg mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">Reserva enviada!</h2>
            <p className="text-gray-500 mb-6">
              Sua reserva foi registrada e está aguardando confirmação.
            </p>

            <div className="text-left bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Reserva #</span>
                <span className="text-sm font-medium text-gray-800">{confirmation.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Acomodação</span>
                <span className="text-sm font-medium text-gray-800">{accommodation?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Entrada</span>
                <span className="text-sm font-medium text-gray-800">{formatDate(checkIn)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Saída</span>
                <span className="text-sm font-medium text-gray-800">{formatDate(checkOut)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Pessoas</span>
                <span className="text-sm font-medium text-gray-800">{numGuests}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Hóspede</span>
                <span className="text-sm font-medium text-gray-800">{confirmation.guest_name}</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="text-sm font-semibold text-gray-700">Total</span>
                <span className="text-sm font-bold text-green-700">{formatBRL(confirmation.total_price)}</span>
              </div>
            </div>

            <p className="text-sm text-gray-500 mt-4">
              Entraremos em contato pelo WhatsApp ou e-mail para confirmar sua reserva e informar os dados de pagamento.
            </p>

            <button
              onClick={() => router.push('/')}
              className="mt-6 bg-green-700 text-white px-6 py-2 rounded-md hover:bg-green-800 transition-colors"
            >
              Voltar ao início
            </button>
          </div>
        </main>
      </div>
    )
  }

  // ---- Booking form ----
  return (
    <div className="min-h-screen bg-green-50">
      <header className="bg-green-800 text-white py-6 px-4 text-center">
        <h1 className="text-3xl font-bold">Camping Caiçara</h1>
        <p className="mt-2 text-green-200">Praia do Sono — Finalizar reserva</p>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        {/* Reservation summary */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Resumo da reserva</h2>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Acomodação</span>
              <span className="text-sm font-medium text-gray-800">{accommodation?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Entrada</span>
              <span className="text-sm font-medium text-gray-800">{formatDate(checkIn)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Saída</span>
              <span className="text-sm font-medium text-gray-800">{formatDate(checkOut)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Pessoas</span>
              <span className="text-sm font-medium text-gray-800">{numGuests}</span>
            </div>

            {price && (
              <>
                {price.seasonName && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Temporada</span>
                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                      {price.seasonName}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="text-sm font-semibold text-gray-700">Total</span>
                  <span className="text-lg font-bold text-green-700">{formatBRL(price.totalPrice)}</span>
                </div>
              </>
            )}

            {!price && (
              <p className="text-sm text-gray-500 italic mt-2">Preço sob consulta</p>
            )}
          </div>
        </div>

        {/* Guest info form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Seus dados</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Nome completo *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="João da Silva"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800 placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                E-mail *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="joao@email.com"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800 placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                CPF *
              </label>
              <input
                type="text"
                required
                value={cpf}
                onChange={(e) => setCpf(formatCPF(e.target.value))}
                placeholder="000.000.000-00"
                maxLength={14}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800 placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                RG *
              </label>
              <input
                type="text"
                required
                value={rg}
                onChange={(e) => setRg(e.target.value)}
                placeholder="00.000.000-0"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800 placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                WhatsApp / Telefone *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(21) 99999-9999"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800 placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Observações
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Alguma solicitação especial? (opcional)"
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800 placeholder-gray-400 resize-none"
              />
            </div>
          </div>

          {error && (
            <p className="mt-3 text-red-600 text-sm">{error}</p>
          )}

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={submitting || !price}
              className="flex-1 bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800 disabled:bg-gray-400 transition-colors"
            >
              {submitting ? 'Enviando...' : 'Confirmar reserva'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

export default function ReservarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <p className="text-gray-600">Carregando...</p>
      </div>
    }>
      <ReservarForm />
    </Suspense>
  )
}
