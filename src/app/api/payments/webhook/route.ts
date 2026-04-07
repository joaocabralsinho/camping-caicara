import { MercadoPagoConfig, Payment } from 'mercadopago'
import { createClient } from '@supabase/supabase-js'
import { sendConfirmationEmail } from '@/lib/email'

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

      // Send confirmation email
      const { data: reservation } = await supabase
        .from('reservations')
        .select('*, accommodations(name), payments(*)')
        .eq('id', Number(reservationId))
        .single()

      if (reservation) {
        const pmt = reservation.payments?.[0]
        const accommodationName = reservation.accommodations?.name || ''

        // Send confirmation email with contract attached
        await sendConfirmationEmail({
          guestName: reservation.guest_name,
          guestEmail: reservation.guest_email,
          guestPhone: reservation.guest_phone || '',
          reservationId: reservation.id,
          accommodationName,
          checkIn: reservation.check_in,
          checkOut: reservation.check_out,
          numPeople: reservation.num_people,
          totalPrice: Number(reservation.total_price),
          amountPaid: pmt ? Number(pmt.amount) : 0,
          paymentType: pmt?.payment_type === 'full' ? 'full' : 'partial',
        }).catch((err) => console.error('Email error:', err))

      }
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
