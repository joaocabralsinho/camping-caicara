import { MercadoPagoConfig, Payment } from 'mercadopago'
import { createClient } from '@supabase/supabase-js'

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
})

// Use service-level supabase client for webhook (server-side)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Mercado Pago sends different notification types
    // We only care about payment notifications
    if (body.type !== 'payment' && body.action !== 'payment.updated') {
      return Response.json({ received: true })
    }

    const paymentId = body.data?.id
    if (!paymentId) {
      return Response.json({ received: true })
    }

    // Fetch the full payment details from Mercado Pago
    const payment = new Payment(mpClient)
    const paymentData = await payment.get({ id: paymentId })

    const reservationId = paymentData.metadata?.reservation_id
    const status = paymentData.status // 'approved', 'pending', 'rejected', etc.

    if (!reservationId) {
      return Response.json({ received: true })
    }

    // Update payment record in our database
    await supabase
      .from('payments')
      .update({
        status: status === 'approved' ? 'paid' : 'pending',
        paid_at: status === 'approved' ? new Date().toISOString() : null,
      })
      .eq('reservation_id', Number(reservationId))

    // If payment is approved, confirm the reservation
    if (status === 'approved') {
      await supabase
        .from('reservations')
        .update({ status: 'confirmed' })
        .eq('id', Number(reservationId))
    }

    return Response.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    // Always return 200 to Mercado Pago so they don't retry endlessly
    return Response.json({ received: true })
  }
}
