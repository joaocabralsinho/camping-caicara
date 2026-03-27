import { supabase } from './supabase'

export type GuestInfo = {
  name: string
  cpf: string
  rg: string
}

export type ReservationInput = {
  accommodation_id: number
  guest_name: string
  guest_email: string
  guest_phone: string
  guests: GuestInfo[]
  num_people: number
  check_in: string
  check_out: string
  total_price: number
  notes?: string
}

export type Reservation = ReservationInput & {
  id: number
  status: string
  created_at: string
}

export async function createReservation(
  input: ReservationInput
): Promise<Reservation> {
  const { data, error } = await supabase
    .from('reservations')
    .insert({
      accommodation_id: input.accommodation_id,
      guest_name: input.guest_name,
      guest_email: input.guest_email,
      guest_phone: input.guest_phone,
      guests: input.guests,
      num_people: input.num_people,
      check_in: input.check_in,
      check_out: input.check_out,
      total_price: input.total_price,
      notes: input.notes || null,
      status: 'pending',
    })
    .select()
    .single()

  if (error || !data) {
    throw new Error('Erro ao criar reserva: ' + (error?.message || 'unknown'))
  }

  return data as Reservation
}
