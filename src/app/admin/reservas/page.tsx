'use client'

import { useState, useEffect } from 'react'
import AdminShell from '../AdminShell'
import { supabase } from '@/lib/supabase'

type Reservation = {
  id: number
  accommodation_id: number
  guest_name: string
  guest_email: string
  guest_phone: string
  guests: { name: string; cpf: string; rg: string }[]
  num_people: number
  check_in: string
  check_out: string
  total_price: number
  status: string
  notes: string | null
  created_at: string
  accommodations: { name: string }
  payments: { amount: number; payment_type: string; status: string; payment_method: string | null }[]
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    completed: 'bg-blue-100 text-blue-800',
  }
  const labels: Record<string, string> = {
    pending: 'Pendente',
    confirmed: 'Confirmada',
    cancelled: 'Cancelada',
    completed: 'Concluída',
  }
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {labels[status] || status}
    </span>
  )
}

function paymentBadge(payment: Reservation['payments'][0] | undefined, totalPrice: number) {
  if (!payment) {
    return <span className="text-xs text-gray-500">Sem pagamento</span>
  }

  const isPaid = payment.status === 'paid'
  const isPartial = payment.payment_type === 'partial'
  const remaining = isPartial ? totalPrice - payment.amount : 0

  return (
    <div className="space-y-1">
      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
        isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
      }`}>
        {isPaid ? 'Pago' : 'Aguardando'}
      </span>
      <p className="text-xs text-gray-600">
        {isPartial ? '50% entrada' : '100% integral'}: {formatBRL(payment.amount)}
      </p>
      {isPartial && isPaid && remaining > 0 && (
        <p className="text-xs font-medium text-orange-600">
          Falta: {formatBRL(remaining)} na chegada
        </p>
      )}
      {isPartial && !isPaid && (
        <p className="text-xs font-medium text-red-600">
          Entrada não paga: {formatBRL(payment.amount)}
        </p>
      )}
    </div>
  )
}

export default function ReservasAdmin() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [expanded, setExpanded] = useState<number | null>(null)

  useEffect(() => {
    loadReservations()
  }, [])

  async function loadReservations() {
    const { data } = await supabase
      .from('reservations')
      .select('*, accommodations(name), payments(*)')
      .order('created_at', { ascending: false })

    setReservations((data || []) as unknown as Reservation[])
    setLoading(false)
  }

  async function updateStatus(id: number, status: string) {
    await supabase.from('reservations').update({ status }).eq('id', id)
    loadReservations()
  }

  const filtered = filter === 'all'
    ? reservations
    : reservations.filter((r) => r.status === filter)

  const pendingPayments = reservations.filter(
    (r) => r.payments?.[0]?.payment_type === 'partial' && r.payments?.[0]?.status === 'paid' && r.status !== 'cancelled'
  )

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Reservas</h2>
          <p className="text-sm text-gray-500">{filtered.length} reserva{filtered.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Alert: pending 50% payments */}
        {pendingPayments.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm font-medium text-orange-800">
              {pendingPayments.length} reserva{pendingPayments.length !== 1 ? 's' : ''} com 50% pendente na chegada
            </p>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {[
            { value: 'all', label: 'Todas' },
            { value: 'pending', label: 'Pendentes' },
            { value: 'confirmed', label: 'Confirmadas' },
            { value: 'completed', label: 'Concluídas' },
            { value: 'cancelled', label: 'Canceladas' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === f.value
                  ? 'bg-green-700 text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-gray-500">Carregando...</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-500">Nenhuma reserva encontrada.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => (
              <div key={r.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Summary row */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-800">#{r.id}</span>
                        <span className="text-sm text-gray-600">{r.guest_name}</span>
                        {statusBadge(r.status)}
                      </div>
                      <p className="text-sm text-gray-500">
                        {r.accommodations?.name} · {formatDate(r.check_in)} → {formatDate(r.check_out)} · {r.num_people} pessoa{r.num_people !== 1 ? 's' : ''}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-bold text-gray-800">{formatBRL(r.total_price)}</p>
                      {paymentBadge(r.payments?.[0], r.total_price)}
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                {expanded === r.id && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-4">
                    {/* Contact */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Contato</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">E-mail: </span>
                          <span className="text-gray-800">{r.guest_email}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">WhatsApp: </span>
                          <a
                            href={`https://wa.me/${r.guest_phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-700 underline"
                          >
                            {r.guest_phone}
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Guests */}
                    {r.guests && r.guests.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Hóspedes</h4>
                        <div className="space-y-1">
                          {r.guests.map((g, i) => (
                            <div key={i} className="text-sm text-gray-800 bg-white rounded p-2">
                              <span className="font-medium">{g.name}</span>
                              <span className="text-gray-500 ml-3">CPF: {g.cpf}</span>
                              <span className="text-gray-500 ml-3">RG: {g.rg}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {r.notes && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-1">Observações</h4>
                        <p className="text-sm text-gray-600">{r.notes}</p>
                      </div>
                    )}

                    {/* Created at */}
                    <p className="text-xs text-gray-400">
                      Criada em {new Date(r.created_at).toLocaleString('pt-BR')}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      {r.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateStatus(r.id, 'confirmed')}
                            className="px-3 py-1.5 bg-green-700 text-white text-sm rounded-md hover:bg-green-800 transition-colors"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => updateStatus(r.id, 'cancelled')}
                            className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                          >
                            Cancelar
                          </button>
                        </>
                      )}
                      {r.status === 'confirmed' && (
                        <button
                          onClick={() => updateStatus(r.id, 'completed')}
                          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Marcar como concluída
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  )
}
