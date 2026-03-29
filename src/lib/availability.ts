import { supabase } from './supabase'

export type Accommodation = {
  id: number
  name: string
  type: string
  max_capacity: number
  description: string
}

export type AvailabilityResult = Accommodation & {
  available: boolean
}

// Check which accommodations are available for given dates
export async function checkAvailability(
  checkIn: string,
  checkOut: string
): Promise<AvailabilityResult[]> {
  // 1. Get all accommodations
  const { data: accommodations, error: accError } = await supabase
    .from('accommodations')
    .select('*')

  if (accError || !accommodations) {
    throw new Error('Erro ao buscar acomodações')
  }

  // 2. Get reservations that overlap with the requested dates
  // A reservation overlaps if it starts before checkout AND ends after checkin
  // Only count paid reservations (confirmed/completed) — pending = not paid yet
  const { data: reservations, error: resError } = await supabase
    .from('reservations')
    .select('accommodation_id, num_people')
    .in('status', ['confirmed', 'completed'])
    .lt('check_in', checkOut)
    .gt('check_out', checkIn)

  if (resError) {
    throw new Error('Erro ao verificar reservas')
  }

  // 3. Check availability for each accommodation
  return accommodations.map((acc) => {
    if (acc.type === 'camping') {
      // For camping: sum all people and check against max capacity
      const totalPeople = (reservations || [])
        .filter((r) => r.accommodation_id === acc.id)
        .reduce((sum, r) => sum + r.num_people, 0)

      return { ...acc, available: totalPeople < acc.max_capacity }
    } else {
      // For chalés, suíte, cabanas: if ANY reservation exists, it's booked
      const isBooked = (reservations || []).some(
        (r) => r.accommodation_id === acc.id
      )
      return { ...acc, available: !isBooked }
    }
  })
}
