import { supabase } from '@/lib/supabase'

// Cancel pending reservations older than 1h that were never paid
// Call this via a cron service (e.g., Vercel Cron, cron-job.org)
export async function GET(request: Request) {
  // Simple auth: check for a secret header to prevent abuse
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  // Find pending reservations older than 24h with no paid payment
  const { data: expired } = await supabase
    .from('reservations')
    .select('id, payments(status)')
    .eq('status', 'pending')
    .lt('created_at', cutoff)

  if (!expired || expired.length === 0) {
    return Response.json({ cancelled: 0 })
  }

  // Only cancel if no payment is "paid"
  const toCancel = expired.filter((r) => {
    const payments = r.payments as { status: string }[]
    return !payments?.some((p) => p.status === 'paid')
  })

  if (toCancel.length === 0) {
    return Response.json({ cancelled: 0 })
  }

  const ids = toCancel.map((r) => r.id)
  await supabase
    .from('reservations')
    .update({ status: 'cancelled' })
    .in('id', ids)

  return Response.json({ cancelled: ids.length, ids })
}
