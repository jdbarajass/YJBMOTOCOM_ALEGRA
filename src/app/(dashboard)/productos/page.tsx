'use client'

import { useState } from 'react'
import { getTodayBogota } from '@/lib/utils'

function getMonthRange() {
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), 1)
    .toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })
  return { start, end: getTodayBogota() }
}

export default function ProductosPage() {
  const range = getMonthRange()
  const [startDate, setStartDate] = useState(range.start)
  const [endDate, setEndDate] = useState(range.end)
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function fetchData() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/analytics/dashboard?start_date=${startDate}&end_date=${endDate}`)
      const json = await res.json()
      if (!json.success) {
        setError(json.error || 'Error consultando productos')
      } else {
        setData(json)
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Análisis de Productos</h1>
        <p className="text-sm text-gray-500 mt-1">Productos y accesorios más vendidos de YJBMOTOCOM</p>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="label">Fecha inicio</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="label">Fecha fin</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input-field" />
          </div>
          <button onClick={fetchData} disabled={loading} className="btn-primary">
            {loading ? 'Analizando...' : '🔍 Analizar Productos'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {data && (() => {
        const trends = data.sales_trends as Array<{ date: string; total: number; total_formatted: string; invoice_count: number }> | undefined
        const summary = data.summary as Record<string, unknown> | undefined

        return (
          <>
            <div className="card bg-gradient-to-r from-brand-600 to-brand-700 text-white">
              <p className="text-sm opacity-80">RESUMEN DEL PERIODO</p>
              <p className="text-3xl font-bold mt-1">{String(summary?.total_sales_formatted || '-')}</p>
              <p className="text-sm opacity-70 mt-1">
                {String(summary?.total_invoices || 0)} facturas · Promedio diario: {String(summary?.average_daily_sales_formatted || '-')}
              </p>
            </div>

            {trends && trends.length > 0 && (
              <div className="card">
                <h2 className="text-lg font-semibold mb-4">Ventas Diarias</h2>
                <div className="space-y-2">
                  {trends.map((day) => {
                    const maxTotal = Math.max(...trends.map((d) => d.total))
                    const pct = maxTotal > 0 ? (day.total / maxTotal) * 100 : 0
                    return (
                      <div key={day.date} className="flex items-center gap-3">
                        <span className="text-sm text-gray-500 w-28">{day.date}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                          <div
                            className="bg-brand-500 h-4 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-36 text-right">{day.total_formatted}</span>
                        <span className="text-xs text-gray-400 w-16 text-right">{day.invoice_count} fact.</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )
      })()}

      {!data && !loading && !error && (
        <div className="card text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">🏍️</p>
          <p>Selecciona un rango de fechas y presiona Analizar Productos</p>
        </div>
      )}
    </div>
  )
}
