import { MercadoPagoConfig, Payment } from 'mercadopago'
import { createClient } from '@supabase/supabase-js'

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Checkout Pro sends payment notifications with type "payment"
    if (body.type !== 'payment') {
      return Response.json({ received: true })
    }

    const paymentId = body.data?.id
    if (!paymentId) {
      return Response.json({ received: true })
    }

    // Fetch full payment details from Mercado Pago
    const payment = new Payment(mpClient)
    const paymentData = await payment.get({ id: paymentId })

    const reservationId = paymentData.metadata?.reservation_id
    const status = paymentData.status

    if (!reservationId) {
      return Response.json({ received: true })
    }

    // Update payment record
    if (status === 'approved') {
      await supabase
        .from('payments')
        .update({
          status: 'paid',
          payment_method: paymentData.payment_type_id || paymentData.payment_method_id || 'unknown',
          paid_at: new Date().toISOString(),
        })
        .eq('reservation_id', Number(reservationId))

      // Confirm the reservation
      await supabase
        .from('reservations')
        .update({ status: 'confirmed' })
        .eq('id', Number(reservationId))
    } else if (status === 'rejected') {
      await supabase
        .from('payments')
        .update({ status: 'pending' })
        .eq('reservation_id', Number(reservationId))
    }

    return Response.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return Response.json({ received: true })
  }
}
