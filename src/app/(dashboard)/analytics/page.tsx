'use client'

import { useState } from 'react'
import { getTodayBogota, formatCOP } from '@/lib/utils'

function getMonthRange() {
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), 1)
    .toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })
  return { start, end: getTodayBogota() }
}

type Tab = 'tendencias' | 'horas' | 'clientes' | 'vendedores'

export default function AnalyticsPage() {
  const range = getMonthRange()
  const [startDate, setStartDate] = useState(range.start)
  const [endDate, setEndDate] = useState(range.end)
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('tendencias')

  async function fetchData() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/analytics/dashboard?start_date=${startDate}&end_date=${endDate}`)
      const json = await res.json()
      if (!json.success) {
        setError(json.error || 'Error consultando analíticas')
      } else {
        setData(json)
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const summary = data?.summary as Record<string, unknown> | undefined
  const salesTrends = data?.sales_trends as Array<{ date: string; total: number; total_formatted: string; invoice_count: number }> | undefined
  const peakHours = data?.peak_hours as Array<{ hour: number; hour_label: string; invoice_count: number; total_sales_formatted: string }> | undefined
  const topCustomers = data?.top_customers as Array<{ name: string; invoice_count: number; total_purchases_formatted: string; average_purchase: number }> | undefined
  const topSellers = data?.top_sellers as Array<{ name: string; invoice_count: number; total_sales_formatted: string }> | undefined

  const TABS: { id: Tab; label: string }[] = [
    { id: 'tendencias', label: 'Tendencias' },
    { id: 'horas', label: 'Horas Pico' },
    { id: 'clientes', label: 'Top Clientes' },
    { id: 'vendedores', label: 'Vendedores' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analíticas de Ventas</h1>
        <p className="text-sm text-gray-500 mt-1">Análisis detallado de ventas por periodo</p>
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
            {loading ? 'Analizando...' : 'Analizar'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card text-center">
            <p className="text-xs text-gray-500 font-medium">TOTAL VENTAS</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{String(summary.total_sales_formatted || '-')}</p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-gray-500 font-medium">FACTURAS</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{String(summary.total_invoices || '-')}</p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-gray-500 font-medium">PROMEDIO DIARIO</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{String(summary.average_daily_sales_formatted || '-')}</p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-gray-500 font-medium">DÍAS</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{salesTrends?.length ?? '-'}</p>
          </div>
        </div>
      )}

      {data && (
        <>
          {/* Tabs */}
          <div className="flex gap-1 border-b border-gray-200">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tendencias */}
          {activeTab === 'tendencias' && salesTrends && (
            <div className="card overflow-x-auto">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tendencias por Día</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-gray-500">Fecha</th>
                    <th className="text-right py-2 text-gray-500">Facturas</th>
                    <th className="text-right py-2 text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {salesTrends.map((row) => (
                    <tr key={row.date} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2">{row.date}</td>
                      <td className="py-2 text-right">{row.invoice_count}</td>
                      <td className="py-2 text-right font-medium">{row.total_formatted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Horas Pico */}
          {activeTab === 'horas' && peakHours && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Horas Pico de Ventas</h2>
              <div className="space-y-2">
                {peakHours
                  .sort((a, b) => b.invoice_count - a.invoice_count)
                  .map((row) => (
                    <div key={row.hour} className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 w-16">{row.hour_label}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                        <div
                          className="bg-brand-500 h-5 rounded-full"
                          style={{ width: `${Math.min((row.invoice_count / (peakHours[0]?.invoice_count || 1)) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">{row.invoice_count}</span>
                      <span className="text-sm text-gray-500 w-32 text-right">{row.total_sales_formatted}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Top Clientes */}
          {activeTab === 'clientes' && topCustomers && (
            <div className="card overflow-x-auto">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Clientes</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-gray-500">#</th>
                    <th className="text-left py-2 text-gray-500">Cliente</th>
                    <th className="text-right py-2 text-gray-500">Compras</th>
                    <th className="text-right py-2 text-gray-500">Total</th>
                    <th className="text-right py-2 text-gray-500">Promedio</th>
                  </tr>
                </thead>
                <tbody>
                  {topCustomers.map((c, i) => (
                    <tr key={c.name} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 text-gray-400">{i + 1}</td>
                      <td className="py-2 font-medium">{c.name}</td>
                      <td className="py-2 text-right">{c.invoice_count}</td>
                      <td className="py-2 text-right font-medium">{c.total_purchases_formatted}</td>
                      <td className="py-2 text-right text-gray-500">{formatCOP(c.average_purchase)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Vendedores */}
          {activeTab === 'vendedores' && topSellers && (
            <div className="card overflow-x-auto">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Rendimiento de Vendedores</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-gray-500">#</th>
                    <th className="text-left py-2 text-gray-500">Vendedor</th>
                    <th className="text-right py-2 text-gray-500">Facturas</th>
                    <th className="text-right py-2 text-gray-500">Total Ventas</th>
                  </tr>
                </thead>
                <tbody>
                  {topSellers.map((s, i) => (
                    <tr key={s.name} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 text-gray-400">{i + 1}</td>
                      <td className="py-2 font-medium">{s.name}</td>
                      <td className="py-2 text-right">{s.invoice_count}</td>
                      <td className="py-2 text-right font-medium">{s.total_sales_formatted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {!data && !loading && !error && (
        <div className="card text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">📈</p>
          <p>Selecciona un rango de fechas y presiona Analizar</p>
        </div>
      )}
    </div>
  )
}
