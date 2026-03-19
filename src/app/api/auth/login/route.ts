import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { comparePassword, generateToken, setTokenCookie } from '@/lib/auth'

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_MINUTES = 15

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email y contraseña requeridos' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } })

    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, error: 'Credenciales inválidas' }, { status: 401 })
    }

    // Verificar bloqueo
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000)
      return NextResponse.json(
        { success: false, error: `Cuenta bloqueada. Intenta en ${minutesLeft} minutos.` },
        { status: 429 }
      )
    }

    const passwordValid = await comparePassword(password, user.passwordHash)

    if (!passwordValid) {
      const newAttempts = user.failedLoginAttempts + 1
      const lockedUntil = newAttempts >= MAX_FAILED_ATTEMPTS
        ? new Date(Date.now() + LOCKOUT_MINUTES * 60000)
        : null

      await db.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: newAttempts, lockedUntil },
      })

      return NextResponse.json({ success: false, error: 'Credenciales inválidas' }, { status: 401 })
    }

    // Reset failed attempts
    await db.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    })

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'admin' | 'sales',
    })

    const cookieOptions = setTokenCookie(token)
    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    })

    response.cookies.set(cookieOptions)
    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
