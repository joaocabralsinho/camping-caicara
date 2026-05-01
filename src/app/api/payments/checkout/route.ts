import { MercadoPagoConfig, Preference } from 'mercadopago'

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { reservation_id, amount, description, payer_email } = body

    if (!reservation_id || !amount || !payer_email) {
      return Response.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    const preference = new Preference(client)

    // Build preference body
    const preferenceBody: Record<string, unknown> = {
      items: [
        {
          id: String(reservation_id),
          title: description || 'Reserva Camping Caiçara',
          quantity: 1,
          unit_price: Number(amount),
          currency_id: 'BRL',
        },
      ],
      payer: {
        email: payer_email,
      },
      metadata: {
        reservation_id: String(reservation_id),
      },
    }

    // TODO: add back_urls once custom domain is configured
    // Mercado Pago rejects .vercel.app URLs

    const result = await preference.create({
      body: preferenceBody as Parameters<typeof preference.create>[0]['body'],
    })

    return Response.json({
      checkout_url: result.init_point,
      preference_id: result.id,
    })
  } catch (error) {
    console.error('Erro ao criar checkout:', error)
    return Response.json(
      { error: 'Erro ao gerar pagamento' },
      { status: 500 }
    )
  }
}
