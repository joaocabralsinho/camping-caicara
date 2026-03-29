import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

type ReservationEmail = {
  guestName: string
  guestEmail: string
  reservationId: number
  accommodationName: string
  checkIn: string
  checkOut: string
  numPeople: number
  totalPrice: number
  amountPaid: number
  paymentType: 'full' | 'partial'
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export async function sendConfirmationEmail(data: ReservationEmail) {
  const remaining = data.paymentType === 'partial'
    ? data.totalPrice - data.amountPaid
    : 0

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background-color: #15803d; padding: 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Camping Caiçara</h1>
        <p style="color: #bbf7d0; margin: 8px 0 0 0; font-size: 14px;">Praia do Sono</p>
      </div>

      <div style="padding: 32px 24px;">
        <h2 style="color: #15803d; margin-top: 0;">Reserva confirmada!</h2>
        <p>Olá <strong>${data.guestName}</strong>,</p>
        <p>Seu pagamento foi aprovado e sua reserva está garantida. Aqui estão os detalhes:</p>

        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; font-size: 14px;">Código da reserva:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold; font-size: 20px; color: #15803d;">#${data.reservationId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-size: 14px;">Acomodação:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold;">${data.accommodationName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-size: 14px;">Check-in:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold;">${formatDate(data.checkIn)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-size: 14px;">Check-out:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold;">${formatDate(data.checkOut)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-size: 14px;">Hóspedes:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold;">${data.numPeople} pessoa${data.numPeople !== 1 ? 's' : ''}</td>
            </tr>
            <tr style="border-top: 1px solid #bbf7d0;">
              <td style="padding: 12px 0 4px; color: #666; font-size: 14px;">Valor total:</td>
              <td style="padding: 12px 0 4px; text-align: right; font-weight: bold;">${formatBRL(data.totalPrice)}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #666; font-size: 14px;">Valor pago:</td>
              <td style="padding: 4px 0; text-align: right; font-weight: bold; color: #15803d;">${formatBRL(data.amountPaid)}</td>
            </tr>
            ${remaining > 0 ? `
            <tr>
              <td style="padding: 4px 0; color: #666; font-size: 14px;">Restante na chegada:</td>
              <td style="padding: 4px 0; text-align: right; font-weight: bold; color: #ea580c;">${formatBRL(remaining)}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        ${remaining > 0 ? `
        <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 14px; color: #c2410c;">
            <strong>Atenção:</strong> O valor restante de ${formatBRL(remaining)} deverá ser pago na chegada.
          </p>
        </div>
        ` : ''}

        <p style="font-size: 14px; color: #666;">
          Em breve você receberá o contrato, regras e termos de uso do camping.
        </p>

        <p style="font-size: 14px; color: #666;">
          Precisando de ajuda? Entre em contato pelo WhatsApp informando seu código <strong>#${data.reservationId}</strong>:
        </p>

        <a href="https://wa.me/5521996628900?text=${encodeURIComponent(`Olá! Meu código de reserva é #${data.reservationId}.`)}"
           style="display: inline-block; background-color: #16a34a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 8px;">
          Falar no WhatsApp
        </a>
      </div>

      <div style="background-color: #f3f4f6; padding: 16px 24px; text-align: center; font-size: 12px; color: #9ca3af;">
        <p style="margin: 0;">Camping Caiçara — Praia do Sono, Paraty - RJ</p>
        <p style="margin: 4px 0 0 0;">WhatsApp: +55 21 99662-8900</p>
      </div>
    </div>
  `

  await resend.emails.send({
    from: 'Camping Caiçara <onboarding@resend.dev>',
    replyTo: 'campingcaicaraoficial@gmail.com',
    to: data.guestEmail,
    subject: `Reserva #${data.reservationId} confirmada — Camping Caiçara`,
    html,
  })
}
