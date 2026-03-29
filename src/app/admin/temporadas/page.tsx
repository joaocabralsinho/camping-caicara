'use client'

import { useState, useEffect } from 'react'
import AdminShell from '../AdminShell'
import { supabase } from '@/lib/supabase'

type Season = {
  id: number
  name: string
  date_start: string
  date_end: string
  created_at: string
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

const emptyForm = {
  name: '',
  date_start: '',
  date_end: '',
}

export default function TemporadasAdmin() {
  const [seasons, setSeasons] = useState<Season[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    loadSeasons()
  }, [])

  async function loadSeasons() {
    const { data } = await supabase
      .from('seasons')
      .select('*')
      .order('date_start', { ascending: false })

    setSeasons((data || []) as Season[])
    setLoading(false)
  }

  function openNew() {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(true)
  }

  function openEdit(season: Season) {
    setForm({
      name: season.name,
      date_start: season.date_start,
      date_end: season.date_end,
    })
    setEditingId(season.id)
    setShowForm(true)
  }

  async function handleSave() {
    const data = {
      name: form.name,
      date_start: form.date_start,
      date_end: form.date_end,
    }

    if (editingId) {
      await supabase.from('seasons').update(data).eq('id', editingId)
    } else {
      await supabase.from('seasons').insert(data)
    }

    setShowForm(false)
    loadSeasons()
  }

  async function handleDelete(id: number) {
    if (!confirm('Tem certeza? Isso vai desvincular todos os preços dessa temporada.')) return
    await supabase.from('pricing').update({ season_id: null }).eq('season_id', id)
    await supabase.from('seasons').delete().eq('id', id)
    loadSeasons()
  }

  // Determine if a season is currently active
  function isActive(season: Season): boolean {
    const today = new Date().toISOString().split('T')[0]
    return season.date_start <= today && season.date_end >= today
  }

  // Determine if a season is in the future
  function isFuture(season: Season): boolean {
    const today = new Date().toISOString().split('T')[0]
    return season.date_start > today
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Temporadas</h2>
          <button
            onClick={openNew}
            className="px-4 py-2 bg-green-700 text-white text-sm font-medium rounded-md hover:bg-green-800 transition-colors"
          >
            + Nova Temporada
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">
              {editingId ? 'Editar Temporada' : 'Nova Temporada'}
            </h3>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Nome</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Réveillon 2027/2028"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Data início</label>
                <input
                  type="date"
                  value={form.date_start}
                  onChange={(e) => setForm({ ...form, date_start: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Data fim</label>
                <input
                  type="date"
                  value={form.date_end}
                  onChange={(e) => setForm({ ...form, date_end: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                disabled={!form.name || !form.date_start || !form.date_end}
                className="px-4 py-2 bg-green-700 text-white text-sm font-medium rounded-md hover:bg-green-800 transition-colors disabled:opacity-50"
              >
                {editingId ? 'Salvar' : 'Criar'}
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

        {/* Seasons list */}
        {loading ? (
          <p className="text-gray-500">Carregando...</p>
        ) : seasons.length === 0 ? (
          <p className="text-gray-500">Nenhuma temporada cadastrada.</p>
        ) : (
          <div className="space-y-3">
            {seasons.map((s) => (
              <div key={s.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-800">{s.name}</span>
                    {isActive(s) && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                        Ativa agora
                      </span>
                    )}
                    {isFuture(s) && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        Futura
                      </span>
                    )}
                    {!isActive(s) && !isFuture(s) && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        Encerrada
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {formatDate(s.date_start)} → {formatDate(s.date_end)}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => openEdit(s)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  )
}
