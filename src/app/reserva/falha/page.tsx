'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function FalhaContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const reservationId = searchParams.get('id')

  return (
    <div className="min-h-screen bg-green-50">
      <header className="bg-green-800 text-white py-6 px-4 text-center">
        <h1 className="text-3xl font-bold">Camping Caiçara</h1>
        <p className="mt-2 text-green-200">Praia do Sono</p>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-2">Pagamento não aprovado</h2>
          <p className="text-gray-500 mb-4">
            O pagamento não foi processado. Sua reserva ainda está pendente.
          </p>

          {reservationId && (
            <p className="text-sm text-gray-600 mb-6">
              Reserva #{reservationId}
            </p>
          )}

          <p className="text-sm text-gray-500 mb-6">
            Você pode tentar novamente ou entrar em contato pelo{' '}
            <a
              href="https://wa.me/5521996628900"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-700 underline"
            >
              WhatsApp
            </a>.
          </p>

          <button
            onClick={() => router.push('/')}
            className="bg-green-700 text-white px-6 py-2 rounded-md hover:bg-green-800 transition-colors"
          >
            Voltar ao início
          </button>
        </div>
      </main>
    </div>
  )
}

export default function FalhaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <p className="text-gray-600">Carregando...</p>
      </div>
    }>
      <FalhaContent />
    </Suspense>
  )
}
