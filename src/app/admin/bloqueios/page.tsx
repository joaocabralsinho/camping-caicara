'use client'

import { useState, useEffect } from 'react'
import AdminShell from '../AdminShell'
import { supabase } from '@/lib/supabase'

type Accommodation = { id: number; name: string }
type BlockedDate = {
  id: number
  accommodation_id: number
  date_blocked: string
  reason: string | null
  created_at: string
  accommodations: { name: string }
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export default function BloqueiosAdmin() {
  const [blocks, setBlocks] = useState<BlockedDate[]>([])
  const [accommodations, setAccommodations] = useState<Accommodation[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const [accId, setAccId] = useState<number>(0)
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')
  const [reason, setReason] = useState('')

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    const [blocksRes, accRes] = await Promise.all([
      supabase
        .from('blocked_dates')
        .select('*, accommodations(name)')
        .order('date_blocked', { ascending: false }),
      supabase.from('accommodations').select('id, name').order('id'),
    ])

    setBlocks((blocksRes.data || []) as unknown as BlockedDate[])
    setAccommodations((accRes.data || []) as Accommodation[])
    setLoading(false)
  }

  function openNew() {
    setAccId(accommodations[0]?.id || 0)
    setDateStart('')
    setDateEnd('')
    setReason('')
    setShowForm(true)
  }

  async function handleSave() {
    // Generate all dates in range
    const start = new Date(dateStart + 'T00:00:00')
    const end = dateEnd ? new Date(dateEnd + 'T00:00:00') : start
    const dates: string[] = []

    const current = new Date(start)
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0])
      current.setDate(current.getDate() + 1)
    }

    const rows = dates.map((d) => ({
      accommodation_id: accId,
      date_blocked: d,
      reason: reason || null,
    }))

    await supabase.from('blocked_dates').insert(rows)
    setShowForm(false)
    loadAll()
  }

  async function handleDelete(id: number) {
    if (!confirm('Remover este bloqueio?')) return
    await supabase.from('blocked_dates').delete().eq('id', id)
    loadAll()
  }

  async function handleDeleteGroup(accIdGroup: number, dateGroup: string[]) {
    if (!confirm(`Remover ${dateGroup.length} dia${dateGroup.length !== 1 ? 's' : ''} bloqueado${dateGroup.length !== 1 ? 's' : ''}?`)) return
    await supabase
      .from('blocked_dates')
      .delete()
      .eq('accommodation_id', accIdGroup)
      .in('date_blocked', dateGroup)
    loadAll()
  }

  // Group consecutive dates by accommodation + reason for cleaner display
  type BlockGroup = {
    accommodation_id: number
    accommodation_name: string
    reason: string | null
    dates: string[]
    ids: number[]
  }

  function groupBlocks(): BlockGroup[] {
    const groups: BlockGroup[] = []
    const sorted = [...blocks].sort((a, b) => {
      if (a.accommodation_id !== b.accommodation_id) return a.accommodation_id - b.accommodation_id
      return a.date_blocked.localeCompare(b.date_blocked)
    })

    for (const block of sorted) {
      const last = groups[groups.length - 1]
      if (
        last &&
        last.accommodation_id === block.accommodation_id &&
        last.reason === block.reason
      ) {
        // Check if consecutive date
        const lastDate = new Date(last.dates[last.dates.length - 1] + 'T00:00:00')
        const thisDate = new Date(block.date_blocked + 'T00:00:00')
        const diffDays = (thisDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        if (diffDays === 1) {
          last.dates.push(block.date_blocked)
          last.ids.push(block.id)
          continue
        }
      }
      groups.push({
        accommodation_id: block.accommodation_id,
        accommodation_name: block.accommodations.name,
        reason: block.reason,
        dates: [block.date_blocked],
        ids: [block.id],
      })
    }

    return groups
  }

  const grouped = groupBlocks()

  // Check if a blocked date is in the past
  function isPast(dateStr: string): boolean {
    return dateStr < new Date().toISOString().split('T')[0]
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Bloqueios de Data</h2>
          <button
            onClick={openNew}
            className="px-4 py-2 bg-green-700 text-white text-sm font-medium rounded-md hover:bg-green-800 transition-colors"
          >
            + Novo Bloqueio
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Novo Bloqueio</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Acomodação</label>
                <select
                  value={accId}
                  onChange={(e) => setAccId(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800"
                >
                  {accommodations.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Motivo</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex: Manutenção, Evento privado"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Data início</label>
                <input
                  type="date"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Data fim (opcional)</label>
                <input
                  type="date"
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                  min={dateStart}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800"
                />
                <p className="text-xs text-gray-400 mt-1">Deixe vazio para bloquear apenas 1 dia</p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                disabled={!accId || !dateStart}
                className="px-4 py-2 bg-green-700 text-white text-sm font-medium rounded-md hover:bg-green-800 transition-colors disabled:opacity-50"
              >
                Bloquear
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-white text-gray-600 text-sm font-medium rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Blocked dates list */}
        {loading ? (
          <p className="text-gray-500">Carregando...</p>
        ) : grouped.length === 0 ? (
          <p className="text-gray-500">Nenhuma data bloqueada.</p>
        ) : (
          <div className="space-y-3">
            {grouped.map((g, i) => (
              <div
                key={i}
                className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center justify-between ${
                  isPast(g.dates[g.dates.length - 1]) ? 'opacity-60' : ''
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-800">{g.accommodation_name}</span>
                    {g.reason && (
                      <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded">
                        {g.reason}
                      </span>
                    )}
                    {isPast(g.dates[g.dates.length - 1]) && (
                      <span className="text-xs text-gray-400">Passado</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {g.dates.length === 1
                      ? formatDate(g.dates[0])
                      : `${formatDate(g.dates[0])} → ${formatDate(g.dates[g.dates.length - 1])} (${g.dates.length} dias)`}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteGroup(g.accommodation_id, g.dates)}
                  className="text-sm text-red-600 hover:text-red-800 shrink-0"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  )
}
