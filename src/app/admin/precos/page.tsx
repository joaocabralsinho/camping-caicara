'use client'

import { useState, useEffect } from 'react'
import AdminShell from '../AdminShell'
import { supabase } from '@/lib/supabase'

type Accommodation = { id: number; name: string; type: string; max_capacity: number }
type Season = { id: number; name: string; date_start: string; date_end: string }
type PricingRule = {
  id: number
  accommodation_id: number
  season_id: number | null
  min_guests: number
  max_guests: number
  price_type: string
  price: number
  min_stay_days: number | null
  label: string | null
  accommodations: { name: string }
  seasons: { name: string } | null
}

const PRICE_TYPE_LABELS: Record<string, string> = {
  per_night: 'Por noite',
  per_person_per_night: 'Por pessoa/noite',
  per_person_per_day: 'Por pessoa/dia',
  package: 'Pacote',
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const emptyForm = {
  accommodation_id: 0,
  season_id: null as number | null,
  min_guests: 1,
  max_guests: 2,
  price_type: 'per_night',
  price: '',
  min_stay_days: '',
  label: '',
}

export default function PrecosAdmin() {
  const [rules, setRules] = useState<PricingRule[]>([])
  const [accommodations, setAccommodations] = useState<Accommodation[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    const [rulesRes, accRes, seasonsRes] = await Promise.all([
      supabase
        .from('pricing')
        .select('*, accommodations(name), seasons(name)')
        .order('accommodation_id')
        .order('season_id', { ascending: true, nullsFirst: true })
        .order('min_guests'),
      supabase.from('accommodations').select('*').order('id'),
      supabase.from('seasons').select('*').order('date_start'),
    ])

    setRules((rulesRes.data || []) as unknown as PricingRule[])
    setAccommodations((accRes.data || []) as Accommodation[])
    setSeasons((seasonsRes.data || []) as Season[])
    setLoading(false)
  }

  function openNew() {
    setForm({ ...emptyForm, accommodation_id: accommodations[0]?.id || 0 })
    setEditingId(null)
    setShowForm(true)
  }

  function openEdit(rule: PricingRule) {
    setForm({
      accommodation_id: rule.accommodation_id,
      season_id: rule.season_id,
      min_guests: rule.min_guests,
      max_guests: rule.max_guests,
      price_type: rule.price_type,
      price: String(rule.price),
      min_stay_days: rule.min_stay_days ? String(rule.min_stay_days) : '',
      label: rule.label || '',
    })
    setEditingId(rule.id)
    setShowForm(true)
  }

  async function handleSave() {
    const data = {
      accommodation_id: form.accommodation_id,
      season_id: form.season_id || null,
      min_guests: form.min_guests,
      max_guests: form.max_guests,
      price_type: form.price_type,
      price: parseFloat(form.price),
      min_stay_days: form.min_stay_days ? parseInt(form.min_stay_days) : null,
      label: form.label || null,
    }

    if (editingId) {
      await supabase.from('pricing').update(data).eq('id', editingId)
    } else {
      await supabase.from('pricing').insert(data)
    }

    setShowForm(false)
    loadAll()
  }

  async function handleDelete(id: number) {
    if (!confirm('Tem certeza que deseja excluir esta regra de preço?')) return
    await supabase.from('pricing').delete().eq('id', id)
    loadAll()
  }

  // Group rules by accommodation
  const grouped = accommodations.map((acc) => ({
    accommodation: acc,
    rules: rules.filter((r) => r.accommodation_id === acc.id),
  })).filter((g) => g.rules.length > 0)

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Preços</h2>
          <button
            onClick={openNew}
            className="px-4 py-2 bg-green-700 text-white text-sm font-medium rounded-md hover:bg-green-800 transition-colors"
          >
            + Novo Preço
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">
              {editingId ? 'Editar Preço' : 'Novo Preço'}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Acomodação</label>
                <select
                  value={form.accommodation_id}
                  onChange={(e) => setForm({ ...form, accommodation_id: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800"
                >
                  {accommodations.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Temporada</label>
                <select
                  value={form.season_id ?? ''}
                  onChange={(e) => setForm({ ...form, season_id: e.target.value ? Number(e.target.value) : null })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800"
                >
                  <option value="">Regular (sem temporada)</option>
                  {seasons.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Mín. hóspedes</label>
                <input
                  type="number"
                  min={1}
                  value={form.min_guests}
                  onChange={(e) => setForm({ ...form, min_guests: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Máx. hóspedes</label>
                <input
                  type="number"
                  min={1}
                  value={form.max_guests}
                  onChange={(e) => setForm({ ...form, max_guests: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Tipo de preço</label>
                <select
                  value={form.price_type}
                  onChange={(e) => setForm({ ...form, price_type: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800"
                >
                  {Object.entries(PRICE_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Preço (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="0.00"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Estadia mínima (dias)</label>
                <input
                  type="number"
                  min={1}
                  value={form.min_stay_days}
                  onChange={(e) => setForm({ ...form, min_stay_days: e.target.value })}
                  placeholder="Opcional"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Label</label>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="Ex: Casal, Pacote Réveillon"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                disabled={!form.price || !form.accommodation_id}
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

        {/* Price list grouped by accommodation */}
        {loading ? (
          <p className="text-gray-500">Carregando...</p>
        ) : grouped.length === 0 ? (
          <p className="text-gray-500">Nenhuma regra de preço cadastrada.</p>
        ) : (
          <div className="space-y-4">
            {grouped.map(({ accommodation, rules: accRules }) => (
              <div key={accommodation.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                  <h3 className="font-semibold text-gray-800">{accommodation.name}</h3>
                  <p className="text-xs text-gray-500">Capacidade: {accommodation.max_capacity} pessoa{accommodation.max_capacity !== 1 ? 's' : ''}</p>
                </div>
                <div className="divide-y divide-gray-100">
                  {accRules.map((rule) => (
                    <div key={rule.id} className="px-4 py-3 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-800">{formatBRL(Number(rule.price))}</span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            {PRICE_TYPE_LABELS[rule.price_type] || rule.price_type}
                          </span>
                          {rule.seasons?.name && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                              {rule.seasons.name}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {rule.min_guests === rule.max_guests
                            ? `${rule.min_guests} pessoa${rule.min_guests !== 1 ? 's' : ''}`
                            : `${rule.min_guests}–${rule.max_guests} pessoas`}
                          {rule.label && ` · ${rule.label}`}
                          {rule.min_stay_days && ` · Mín. ${rule.min_stay_days} dias`}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => openEdit(rule)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(rule.id)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  )
}
