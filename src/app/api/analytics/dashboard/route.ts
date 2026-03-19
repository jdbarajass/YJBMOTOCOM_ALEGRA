import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getAnalyticsDashboard } from '@/lib/analytics'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    if (!startDate || !endDate) {
      return NextResponse.json({ success: false, error: 'Fechas requeridas' }, { status: 400 })
    }

    const data = await getAnalyticsDashboard(startDate, endDate)
    return NextResponse.json({ success: true, ...data })
  } catch (error) {
    console.error('Error analytics dashboard:', error)
    const message = error instanceof Error ? error.message : 'Error consultando analíticas'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
