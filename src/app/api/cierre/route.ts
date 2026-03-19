import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getSalesSummary } from '@/lib/alegra'
import {
  calcularCierreCompleto,
  procesarExcedentes,
  procesarDesfases,
  calcularMetodosPago,
  validarCierre,
} from '@/lib/cash-calculator'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const payload = await request.json()
    const {
      date,
      monedas = {},
      billetes = {},
      excedentes = [],
      gastos_operativos = 0,
      gastos_operativos_nota = '',
      prestamos = 0,
      prestamos_nota = '',
      desfases = [],
      metodos_pago = {},
    } = payload

    if (!date) {
      return NextResponse.json({ success: false, error: 'La fecha es requerida' }, { status: 400 })
    }

    // Validar formato de fecha
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ success: false, error: 'Formato de fecha inválido (YYYY-MM-DD)' }, { status: 400 })
    }

    // 1. Obtener datos de Alegra
    const datosAlegra = await getSalesSummary(date)

    // 2. Procesar excedentes
    const excedentesProcessados = procesarExcedentes(excedentes)

    // 3. Procesar desfases
    const desfasesProcessados = procesarDesfases(desfases)

    // 4. Calcular cierre de caja
    const cashResult = calcularCierreCompleto({
      monedas: Object.fromEntries(
        Object.entries(monedas).map(([k, v]) => [parseInt(k), parseInt(String(v))])
      ),
      billetes: Object.fromEntries(
        Object.entries(billetes).map(([k, v]) => [parseInt(k), parseInt(String(v))])
      ),
      excedente: excedentesProcessados.excedente_efectivo,
      gastosOperativos: gastos_operativos,
      prestamos,
      desfases: desfasesProcessados.total_desfase,
    })

    // 5. Calcular métodos de pago
    const metodosPagoCalculados = calcularMetodosPago(metodos_pago, excedentesProcessados)

    // 6. Validar cierre
    const validacion = validarCierre({
      datosAlegra: datosAlegra as { results: Record<string, { total: number }> },
      metodosPagoCalculados: metodosPagoCalculados as Record<string, number>,
      cashResult,
      excedentesProcessados,
      gastosOperativos: gastos_operativos,
      prestamos,
      desfasesProcessados,
    })

    return NextResponse.json({
      success: true,
      request_date: date,
      username_used: session.email,
      alegra: datosAlegra,
      cash_count: cashResult,
      excedentes_detalle: excedentesProcessados.excedentes_detalle,
      gastos_operativos_nota,
      prestamos_nota,
      desfases_detalle: desfasesProcessados.desfases_detalle,
      metodos_pago_registrados: metodosPagoCalculados,
      validation: validacion,
    })
  } catch (error) {
    console.error('Error en cierre:', error)
    const message = error instanceof Error ? error.message : 'Error procesando el cierre'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// Pre-consulta (GET)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json({ success: false, error: 'La fecha es requerida' }, { status: 400 })
    }

    const datosAlegra = await getSalesSummary(date)
    return NextResponse.json({ success: true, alegra: datosAlegra })
  } catch (error) {
    console.error('Error en pre-consulta:', error)
    const message = error instanceof Error ? error.message : 'Error consultando Alegra'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
