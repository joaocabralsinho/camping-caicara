import { MercadoPagoConfig, Payment } from 'mercadopago'

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
})

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { reservation_id, amount, description, payer_email } = body

    if (!reservation_id || !amount || !payer_email) {
      return Response.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    const payment = new Payment(client)

    const result = await payment.create({
      body: {
        transaction_amount: Number(amount),
        description: description || 'Reserva Camping Caiçara',
        payment_method_id: 'pix',
        payer: {
          email: payer_email,
        },
        metadata: {
          reservation_id: String(reservation_id),
        },
      },
    })

    // Extract PIX data from response
    const pixData = result.point_of_interaction?.transaction_data

    return Response.json({
      payment_id: result.id,
      status: result.status,
      qr_code: pixData?.qr_code,           // PIX copia e cola
      qr_code_base64: pixData?.qr_code_base64, // QR code image
    })
  } catch (error) {
    console.error('Erro ao criar pagamento PIX:', error)
    return Response.json(
      { error: 'Erro ao gerar pagamento PIX' },
      { status: 500 }
    )
  }
}
