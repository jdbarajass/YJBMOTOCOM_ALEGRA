import { NextRequest, NextResponse } from 'next/server'
import { getSession, hashPassword, validatePasswordStrength } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 })
    }

    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, users })
  } catch (error) {
    console.error('Error listing users:', error)
    return NextResponse.json({ success: false, error: 'Error consultando usuarios' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 })
    }

    const { email, name, password, role } = await request.json()

    if (!email || !name || !password) {
      return NextResponse.json({ success: false, error: 'Email, nombre y contraseña son requeridos' }, { status: 400 })
    }

    const pwValidation = validatePasswordStrength(password)
    if (!pwValidation.valid) {
      return NextResponse.json({ success: false, error: pwValidation.message }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) {
      return NextResponse.json({ success: false, error: 'El email ya está en uso' }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        passwordHash,
        role: role === 'admin' ? 'admin' : 'sales',
      },
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
    })

    return NextResponse.json({ success: true, user }, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ success: false, error: 'Error creando usuario' }, { status: 500 })
  }
}
