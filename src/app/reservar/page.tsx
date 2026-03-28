'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getPrices, PriceResult } from '@/lib/pricing'
import { createReservation, Reservation, GuestInfo } from '@/lib/reservations'
import { validateCPF, formatCPF } from '@/lib/cpf'

type Accommodation = {
  id: number
  name: string
  type: string
  max_capacity: number
  description: string
}

type PixPayment = {
  payment_id: number
  qr_code: string         // PIX copia e cola
  qr_code_base64: string  // QR code image
  amount: number           // how much this PIX is for
  payment_type: 'full' | 'partial'
  total_price: number      // original total before discount
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
  const [pixPayment, setPixPayment] = useState<PixPayment | null>(null)
  const [pixCopied, setPixCopied] = useState(false)

  // Form fields — contact (one set)
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [paymentType, setPaymentType] = useState<'full' | 'partial'>('partial')

  // Guest info — one per person
  const [guests, setGuests] = useState<GuestInfo[]>(
    Array.from({ length: numGuests }, () => ({ name: '', cpf: '', rg: '' }))
  )

  function updateGuest(index: number, field: keyof GuestInfo, value: string) {
    setGuests((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

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

    // Validate contact info
    if (!email.trim() || !phone.trim()) {
      setError('Preencha o e-mail e WhatsApp')
      return
    }

    // Validate all guests
    for (let i = 0; i < guests.length; i++) {
      const g = guests[i]
      if (!g.name.trim() || !g.cpf.trim() || !g.rg.trim()) {
        setError(`Preencha todos os dados do Hóspede ${i + 1}`)
        return
      }
      if (!validateCPF(g.cpf)) {
        setError(`CPF inválido para o Hóspede ${i + 1}. Verifique o número.`)
        return
      }
    }

    if (!price || !accommodation) return

    setSubmitting(true)
    setError('')

    try {
      // 1. Create reservation
      const cleanGuests = guests.map((g) => ({
        name: g.name.trim(),
        cpf: g.cpf.replace(/\D/g, ''),
        rg: g.rg.trim(),
      }))

      const reservation = await createReservation({
        accommodation_id: accId,
        guest_name: cleanGuests[0].name,
        guest_email: email.trim(),
        guest_phone: phone.trim(),
        guests: cleanGuests,
        num_people: numGuests,
        check_in: checkIn,
        check_out: checkOut,
        total_price: price.totalPrice,
        notes: notes.trim() || undefined,
      })

      // 2. Calculate PIX amount based on payment type
      const pixAmount = paymentType === 'full'
        ? Math.round(price.totalPrice * 0.95 * 100) / 100  // 5% discount
        : Math.round(price.totalPrice * 0.50 * 100) / 100  // 50% deposit

      // 3. Create payment record in Supabase
      await supabase.from('payments').insert({
        reservation_id: reservation.id,
        amount: pixAmount,
        payment_type: paymentType,
        status: 'pending',
      })

      // 4. Generate PIX payment via Mercado Pago
      const pixResponse = await fetch('/api/payments/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservation_id: reservation.id,
          amount: pixAmount,
          description: `Reserva Camping Caiçara - ${accommodation.name}`,
          payer_email: email.trim(),
        }),
      })

      const pixData = await pixResponse.json()

      if (pixData.qr_code) {
        setPixPayment({
          payment_id: pixData.payment_id,
          qr_code: pixData.qr_code,
          qr_code_base64: pixData.qr_code_base64,
          amount: pixAmount,
          payment_type: paymentType,
          total_price: price.totalPrice,
        })
      }

      setConfirmation(reservation)
    } catch {
      setError('Erro ao criar reserva. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  function formatDate(dateStr: string): string {
    const [y, m, d] = dateStr.split('-')
    return `${d}/${m}/${y}`
  }

  async function copyPixCode() {
    if (!pixPayment?.qr_code) return
    await navigator.clipboard.writeText(pixPayment.qr_code)
    setPixCopied(true)
    setTimeout(() => setPixCopied(false), 3000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <p className="text-gray-600">Carregando...</p>
      </div>
    )
  }

  // ---- Confirmation + PIX payment screen ----
  if (confirmation) {
    return (
      <div className="min-h-screen bg-green-50">
        <header className="bg-green-800 text-white py-6 px-4 text-center">
          <h1 className="text-3xl font-bold">Camping Caiçara</h1>
          <p className="mt-2 text-green-200">Praia do Sono</p>
        </header>

        <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
          {/* Reservation confirmed */}
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">Reserva registrada!</h2>
            <p className="text-gray-500 mb-6">
              Agora é só fazer o pagamento via PIX para confirmar.
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
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="text-sm font-semibold text-gray-700">Total da estadia</span>
                <span className="text-sm font-bold text-gray-800">{formatBRL(confirmation.total_price)}</span>
              </div>

              {pixPayment && (
                <>
                  {pixPayment.payment_type === 'full' ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Desconto 5% (pagamento integral)</span>
                        <span className="text-sm text-green-600">-{formatBRL(pixPayment.total_price * 0.05)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-semibold text-green-700">Pagar agora via PIX</span>
                        <span className="text-sm font-bold text-green-700">{formatBRL(pixPayment.amount)}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm font-semibold text-green-700">Pagar agora (50%)</span>
                        <span className="text-sm font-bold text-green-700">{formatBRL(pixPayment.amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Restante na chegada</span>
                        <span className="text-sm text-gray-600">{formatBRL(confirmation.total_price - pixPayment.amount)}</span>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* PIX payment */}
          {pixPayment ? (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Pagamento via PIX</h3>
              <p className="text-2xl font-bold text-green-700 mb-1">{formatBRL(pixPayment.amount)}</p>
              <p className="text-sm text-gray-500 mb-4">
                Escaneie o QR Code ou copie o código abaixo
              </p>

              {/* QR Code */}
              {pixPayment.qr_code_base64 && (
                <div className="flex justify-center mb-4">
                  <img
                    src={`data:image/png;base64,${pixPayment.qr_code_base64}`}
                    alt="QR Code PIX"
                    className="w-56 h-56"
                  />
                </div>
              )}

              {/* Copia e cola */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-500 mb-2">PIX Copia e Cola</p>
                <p className="text-xs text-gray-700 break-all font-mono leading-relaxed">
                  {pixPayment.qr_code}
                </p>
              </div>

              <button
                onClick={copyPixCode}
                className="w-full bg-green-700 text-white py-2 rounded-md hover:bg-green-800 transition-colors text-sm font-medium"
              >
                {pixCopied ? 'Copiado!' : 'Copiar código PIX'}
              </button>

              <p className="text-xs text-gray-400 mt-3">
                Após o pagamento, sua reserva será confirmada automaticamente.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <p className="text-sm text-gray-500">
                Não foi possível gerar o PIX. Entre em contato pelo{' '}
                <a
                  href="https://wa.me/5521996628900"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-700 underline"
                >
                  WhatsApp
                </a>{' '}
                para finalizar o pagamento.
              </p>
            </div>
          )}

          <div className="text-center">
            <button
              onClick={() => router.push('/')}
              className="text-sm text-green-700 underline hover:text-green-900"
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

        {/* Contact info */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Contato</h2>

            <div className="space-y-4">
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
            </div>
          </div>

          {/* Guest info — one block per person */}
          {guests.map((guest, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Hóspede {i + 1}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Nome completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={guest.name}
                    onChange={(e) => updateGuest(i, 'name', e.target.value)}
                    placeholder="Nome completo"
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
                    value={guest.cpf}
                    onChange={(e) => updateGuest(i, 'cpf', formatCPF(e.target.value))}
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
                    value={guest.rg}
                    onChange={(e) => updateGuest(i, 'rg', e.target.value)}
                    placeholder="00.000.000-0"
                    maxLength={14}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800 placeholder-gray-400"
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Payment option */}
          {price && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Forma de pagamento</h2>

              <div className="space-y-3">
                <label
                  className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    paymentType === 'partial'
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentType"
                      value="partial"
                      checked={paymentType === 'partial'}
                      onChange={() => setPaymentType('partial')}
                      className="accent-green-700"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800">Pagar 50% agora</p>
                      <p className="text-xs text-gray-500">Restante na chegada</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-800">
                    {formatBRL(Math.round(price.totalPrice * 0.50 * 100) / 100)}
                  </span>
                </label>

                <label
                  className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    paymentType === 'full'
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentType"
                      value="full"
                      checked={paymentType === 'full'}
                      onChange={() => setPaymentType('full')}
                      className="accent-green-700"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        Pagar 100%
                        <span className="ml-1 text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">5% OFF</span>
                      </p>
                      <p className="text-xs text-gray-500">Pagamento integral com desconto</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-800">
                    {formatBRL(Math.round(price.totalPrice * 0.95 * 100) / 100)}
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Notes + submit */}
          <div className="bg-white rounded-lg shadow-md p-6">
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
                {submitting ? 'Gerando pagamento...' : 'Reservar e pagar'}
              </button>
            </div>
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
