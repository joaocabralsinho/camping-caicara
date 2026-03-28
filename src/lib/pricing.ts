import { supabase } from './supabase'

// ---- Types ----

type PricingRule = {
  id: number
  accommodation_id: number
  season_id: number | null
  min_guests: number
  max_guests: number
  price_type: 'per_night' | 'per_person_per_night' | 'per_person_per_day' | 'package'
  price: number
  min_stay_days: number | null
  label: string | null
}

type Season = {
  id: number
  name: string
  date_start: string
  date_end: string
}

export type PriceResult = {
  totalPrice: number
  unitPrice: number // base price from the rule
  priceType: 'per_night' | 'per_person_per_night' | 'per_person_per_day' | 'package'
  label: string
  seasonName: string | null
  nights: number
}

// ---- Helpers ----

function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1 + 'T00:00:00')
  const d2 = new Date(date2 + 'T00:00:00')
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
}

function pickBestRule(
  rules: PricingRule[],
  nights: number
): PricingRule {
  // Pick the rule with the highest min_stay_days that the stay qualifies for
  // This handles the camping réveillon case: 3+ days → R$80, otherwise → R$100
  // For per_person_per_day rules, compare against days (nights + 1)
  const applicable = rules
    .filter((r) => {
      if (!r.min_stay_days) return true
      const stayLength = r.price_type === 'per_person_per_day' ? nights + 1 : nights
      return stayLength >= r.min_stay_days
    })
    .sort((a, b) => (b.min_stay_days || 0) - (a.min_stay_days || 0))

  return applicable[0] || rules[0]
}

function calcFromRule(
  rule: PricingRule,
  nights: number,
  numGuests: number,
  season: Season | null
): PriceResult {
  let totalPrice: number

  switch (rule.price_type) {
    case 'per_night':
      totalPrice = Number(rule.price) * nights
      break
    case 'per_person_per_night':
      totalPrice = Number(rule.price) * numGuests * nights
      break
    case 'per_person_per_day':
      totalPrice = Number(rule.price) * numGuests * (nights + 1)
      break
    case 'package':
      totalPrice = Number(rule.price)
      break
    default:
      totalPrice = 0
  }

  return {
    totalPrice,
    unitPrice: Number(rule.price),
    priceType: rule.price_type,
    label: rule.label || '',
    seasonName: season?.name || null,
    nights,
  }
}

// ---- Main API ----

// Check if the booking dates overlap with any special season
async function getActiveSeason(
  checkIn: string,
  checkOut: string
): Promise<Season | null> {
  const { data } = await supabase
    .from('seasons')
    .select('*')
    .lte('date_start', checkOut)
    .gte('date_end', checkIn)

  return data && data.length > 0 ? (data[0] as Season) : null
}

// Get prices for multiple accommodations in one go (only 2 DB queries total)
export async function getPrices(
  accommodationIds: number[],
  checkIn: string,
  checkOut: string,
  numGuests: number
): Promise<Map<number, PriceResult>> {
  const nights = daysBetween(checkIn, checkOut)
  if (nights <= 0 || accommodationIds.length === 0) return new Map()

  // 1. Check for active season
  const season = await getActiveSeason(checkIn, checkOut)

  // 2. Fetch ALL pricing rules for these accommodations in one query
  const { data: allRules } = await supabase
    .from('pricing')
    .select('*')
    .in('accommodation_id', accommodationIds)
    .lte('min_guests', numGuests)
    .gte('max_guests', numGuests)

  if (!allRules) return new Map()

  const results = new Map<number, PriceResult>()

  for (const accId of accommodationIds) {
    const accRules = allRules.filter(
      (r) => r.accommodation_id === accId
    ) as PricingRule[]

    // Prefer season pricing if a season is active
    const seasonRules = season
      ? accRules.filter((r) => r.season_id === season.id)
      : []
    const regularRules = accRules.filter((r) => r.season_id === null)

    if (seasonRules.length > 0) {
      const rule = pickBestRule(seasonRules, nights)
      results.set(accId, calcFromRule(rule, nights, numGuests, season))
    } else if (regularRules.length > 0) {
      const rule = pickBestRule(regularRules, nights)
      results.set(accId, calcFromRule(rule, nights, numGuests, null))
    }
    // If no rules match → no entry in the map → UI shows "Consulte preço"
  }

  return results
}
