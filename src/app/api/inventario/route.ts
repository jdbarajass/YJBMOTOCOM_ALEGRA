import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getActiveItems } from '@/lib/alegra'

function safeNumber(v: unknown): number {
  const n = Number(v)
  return isNaN(n) ? 0 : n
}

function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }
    if (session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 })
    }

    const rawItems = await getActiveItems() as Array<Record<string, unknown>>

    interface Item {
      id: unknown
      name: unknown
      price: unknown
      inventory?: { unit?: { availableQuantity?: unknown } }
      category?: { name?: unknown }
      status: unknown
    }

    const items = (rawItems as Item[]).map((item) => {
      const quantity = safeNumber(item.inventory?.unit?.availableQuantity ?? 0)
      const price = safeNumber(item.price ?? 0)
      const value = quantity * price

      return {
        id: item.id,
        name: String(item.name || ''),
        quantity,
        price,
        value,
        value_formatted: formatCOP(value),
        price_formatted: formatCOP(price),
        category: String(item.category?.name || 'Sin categoría'),
        status: String(item.status || 'active'),
      }
    })

    // Análisis ABC
    const totalValue = items.reduce((s, i) => s + i.value, 0)
    const sorted = [...items].sort((a, b) => b.value - a.value)

    let cumulative = 0
    const withABC = sorted.map((item) => {
      cumulative += item.value
      const pct = totalValue > 0 ? cumulative / totalValue : 0
      const abc = pct <= 0.8 ? 'A' : pct <= 0.95 ? 'B' : 'C'
      return { ...item, abc_class: abc }
    })

    const outOfStock = items.filter((i) => i.quantity === 0)
    const lowStock = items.filter((i) => i.quantity > 0 && i.quantity <= 5)

    return NextResponse.json({
      success: true,
      summary: {
        total_items: items.length,
        total_value: Math.round(totalValue),
        total_value_formatted: formatCOP(totalValue),
        out_of_stock_count: outOfStock.length,
        low_stock_count: lowStock.length,
      },
      items: withABC,
      out_of_stock: outOfStock,
      low_stock: lowStock,
      top_by_value: sorted.slice(0, 20),
      abc_analysis: {
        A: withABC.filter((i) => i.abc_class === 'A'),
        B: withABC.filter((i) => i.abc_class === 'B'),
        C: withABC.filter((i) => i.abc_class === 'C'),
      },
    })
  } catch (error) {
    console.error('Error inventario:', error)
    const message = error instanceof Error ? error.message : 'Error consultando inventario'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
