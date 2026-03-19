'use client'

import { useState } from 'react'
import { getTodayBogota, formatCOP } from '@/lib/utils'

function getMonthRange() {
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), 1)
    .toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })
  return { start, end: getTodayBogota() }
}

export default function VentasMensualesPage() {
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
      const res = await fetch(`/api/ventas-mensuales?start_date=${startDate}&end_date=${endDate}`)
      const json = await res.json()
      if (!json.success) {
        setError(json.error || 'Error consultando ventas')
      } else {
        setData(json)
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const paymentMethods = data?.payment_methods as Record<string, { label: string; total: number; formatted: string }> | undefined
  const totalVendido = data?.total_vendido as { formatted: string; total: number } | undefined
  const invoicesSummary = data?.invoices_summary as { total_invoices: number; active_invoices: number; voided_invoices: number } | undefined

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ventas del Periodo</h1>
        <p className="text-sm text-gray-500 mt-1">Consulta las ventas por rango de fechas desde Alegra</p>
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
            {loading ? 'Consultando...' : 'Consultar'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {data && (
        <>
          {/* Total */}
          <div className="card bg-gradient-to-r from-brand-600 to-brand-700 text-white">
            <p className="text-sm opacity-80">TOTAL VENDIDO</p>
            <p className="text-4xl font-bold mt-1">{totalVendido?.formatted || '-'}</p>
            <div className="flex gap-4 mt-3 text-sm opacity-80">
              <span>Facturas activas: {invoicesSummary?.active_invoices ?? '-'}</span>
              {(invoicesSummary?.voided_invoices ?? 0) > 0 && (
                <span>Anuladas: {invoicesSummary?.voided_invoices}</span>
              )}
            </div>
          </div>

          {/* Por método de pago */}
          {paymentMethods && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(paymentMethods).map(([key, val]) => (
                <div key={key} className="card text-center">
                  <p className="text-xs text-gray-500 font-medium uppercase">{val.label}</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{val.formatted}</p>
                  {totalVendido && totalVendido.total > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      {Math.round((val.total / totalVendido.total) * 100)}%
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!data && !loading && !error && (
        <div className="card text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">📊</p>
          <p>Selecciona un rango de fechas y presiona Consultar</p>
        </div>
      )}
    </div>
  )
}
