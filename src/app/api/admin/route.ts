import { cookies } from 'next/headers'

const SESSION_COOKIE = 'admin_session'
// Simple session token — in production, use a proper secret
const SESSION_TOKEN = 'camping_admin_authenticated'

// POST /api/admin — login
export async function POST(request: Request) {
  const body = await request.json()
  const { password } = body

  if (password === process.env.ADMIN_PASSWORD) {
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, SESSION_TOKEN, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })
    return Response.json({ success: true })
  }

  return Response.json({ error: 'Senha incorreta' }, { status: 401 })
}

// GET /api/admin — verify session
export async function GET() {
  const cookieStore = await cookies()
  const session = cookieStore.get(SESSION_COOKIE)

  if (session?.value === SESSION_TOKEN) {
    return Response.json({ authenticated: true })
  }

  return Response.json({ authenticated: false }, { status: 401 })
}

// DELETE /api/admin — logout
export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
  return Response.json({ success: true })
}
