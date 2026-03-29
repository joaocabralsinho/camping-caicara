'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function SucessoContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const reservationId = searchParams.get('id')

  return (
    <div className="min-h-screen bg-green-50">
      <header className="bg-green-800 text-white py-6 px-4 text-center">
        <h1 className="text-3xl font-bold">Camping Caiçara</h1>
        <p className="mt-2 text-green-200">Praia do Sono</p>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-4">
        {/* Success card */}
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-2">Reserva confirmada!</h2>
          <p className="text-gray-500 mb-4">
            Tudo certo! Seu pagamento foi aprovado e sua reserva está garantida.
          </p>

          {/* Reservation ID highlight */}
          {reservationId && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600 mb-1">Seu código de reserva:</p>
              <p className="text-3xl font-bold text-green-800">#{reservationId}</p>
              <p className="text-xs text-gray-500 mt-1">
                Guarde este número! Use-o para atendimento pelo WhatsApp.
              </p>
            </div>
          )}
        </div>

        {/* What happens next */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="font-semibold text-gray-800 mb-3">O que acontece agora?</h3>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-green-700">1</span>
              </div>
              <p className="text-sm text-gray-600">
                Você receberá um <strong>e-mail</strong> com os detalhes da reserva, contrato, regras e termos de uso.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-green-700">2</span>
              </div>
              <p className="text-sm text-gray-600">
                Também enviaremos uma mensagem no <strong>WhatsApp</strong> com todas as informações.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-green-700">3</span>
              </div>
              <p className="text-sm text-gray-600">
                Qualquer dúvida, entre em contato informando seu código <strong>#{reservationId}</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* WhatsApp CTA */}
        <a
          href={`https://wa.me/5521996628900?text=${encodeURIComponent(
            `Olá! Acabei de fazer uma reserva no Camping Caiçara.\nMeu código de reserva é #${reservationId}.\nGostaria de confirmar os detalhes.`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-green-600 text-white text-center py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          Falar no WhatsApp
        </a>

        <button
          onClick={() => router.push('/')}
          className="block w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors py-2"
        >
          Voltar ao início
        </button>
      </main>
    </div>
  )
}

export default function SucessoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <p className="text-gray-600">Carregando...</p>
      </div>
    }>
      <SucessoContent />
    </Suspense>
  )
}
