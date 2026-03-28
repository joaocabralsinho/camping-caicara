'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function PendenteContent() {
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
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-2">Pagamento pendente</h2>
          <p className="text-gray-500 mb-4">
            Seu pagamento está sendo processado. Assim que for confirmado, sua reserva será atualizada automaticamente.
          </p>

          {reservationId && (
            <p className="text-sm text-gray-600 mb-6">
              Reserva #{reservationId}
            </p>
          )}

          <p className="text-sm text-gray-500 mb-6">
            Se precisar de ajuda, entre em contato pelo{' '}
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

export default function PendentePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <p className="text-gray-600">Carregando...</p>
      </div>
    }>
      <PendenteContent />
    </Suspense>
  )
}
