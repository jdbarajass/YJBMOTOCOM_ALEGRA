'use client'

import { useState } from 'react'

type Tab = 'resumen' | 'abc' | 'sin-stock' | 'bajo-stock' | 'top-valor'

export default function InventarioPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('resumen')

  async function fetchData() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/inventario')
      const json = await res.json()
      if (!json.success) {
        setError(json.error || 'Error consultando inventario')
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
  const items = data?.items as Array<Record<string, unknown>> | undefined
  const outOfStock = data?.out_of_stock as Array<Record<string, unknown>> | undefined
  const lowStock = data?.low_stock as Array<Record<string, unknown>> | undefined
  const topByValue = data?.top_by_value as Array<Record<string, unknown>> | undefined
  const abcAnalysis = data?.abc_analysis as Record<string, Array<Record<string, unknown>>> | undefined

  const TABS: { id: Tab; label: string }[] = [
    { id: 'resumen', label: 'Resumen' },
    { id: 'abc', label: 'Análisis ABC' },
    { id: 'sin-stock', label: `Sin Stock (${outOfStock?.length ?? 0})` },
    { id: 'bajo-stock', label: `Bajo Stock (${lowStock?.length ?? 0})` },
    { id: 'top-valor', label: 'Top por Valor' },
  ]

  function ItemTable({ rows }: { rows?: Array<Record<string, unknown>> }) {
    if (!rows?.length) return <p className="text-gray-500 text-sm">Sin datos</p>
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 text-gray-500">Producto</th>
              <th className="text-right py-2 text-gray-500">Cantidad</th>
              <th className="text-right py-2 text-gray-500">Precio</th>
              <th className="text-right py-2 text-gray-500">Valor Total</th>
              <th className="text-left py-2 text-gray-500">Categoría</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item, i) => (
              <tr key={String(item.id ?? i)} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 font-medium">{String(item.name || '')}</td>
                <td className="py-2 text-right">{String(item.quantity ?? '-')}</td>
                <td className="py-2 text-right">{String(item.price_formatted || '-')}</td>
                <td className="py-2 text-right">{String(item.value_formatted || '-')}</td>
                <td className="py-2 text-gray-500">{String(item.category || '-')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
          <p className="text-sm text-gray-500 mt-1">Análisis del inventario desde Alegra</p>
        </div>
        <button onClick={fetchData} disabled={loading} className="btn-primary">
          {loading ? 'Cargando...' : '🔄 Cargar Inventario'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {!data && !loading && !error && (
        <div className="card text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">📦</p>
          <p>Presiona "Cargar Inventario" para consultar los datos</p>
        </div>
      )}

      {summary && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card text-center">
              <p className="text-xs text-gray-500">TOTAL ITEMS</p>
              <p className="text-2xl font-bold text-gray-900">{String(summary.total_items || '-')}</p>
            </div>
            <div className="card text-center">
              <p className="text-xs text-gray-500">VALOR TOTAL</p>
              <p className="text-2xl font-bold text-gray-900">{String(summary.total_value_formatted || '-')}</p>
            </div>
            <div className="card text-center border-red-200">
              <p className="text-xs text-red-500">SIN STOCK</p>
              <p className="text-2xl font-bold text-red-600">{String(summary.out_of_stock_count ?? '-')}</p>
            </div>
            <div className="card text-center border-yellow-200">
              <p className="text-xs text-yellow-600">BAJO STOCK</p>
              <p className="text-2xl font-bold text-yellow-600">{String(summary.low_stock_count ?? '-')}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-1 border-b border-gray-200">
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

          {activeTab === 'resumen' && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Todos los items</h2>
              <ItemTable rows={items} />
            </div>
          )}

          {activeTab === 'abc' && abcAnalysis && (
            <div className="space-y-4">
              {(['A', 'B', 'C'] as const).map((cls) => (
                <div key={cls} className="card">
                  <h2 className="text-lg font-semibold mb-2">
                    Clase {cls}
                    {cls === 'A' && ' — Vitales (80% del valor)'}
                    {cls === 'B' && ' — Importantes (15% del valor)'}
                    {cls === 'C' && ' — Triviales (5% del valor)'}
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({abcAnalysis[cls]?.length ?? 0} items)
                    </span>
                  </h2>
                  <ItemTable rows={abcAnalysis[cls]} />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'sin-stock' && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4 text-red-600">Productos Sin Stock</h2>
              <ItemTable rows={outOfStock} />
            </div>
          )}

          {activeTab === 'bajo-stock' && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4 text-yellow-600">Productos con Bajo Stock (&le;5)</h2>
              <ItemTable rows={lowStock} />
            </div>
          )}

          {activeTab === 'top-valor' && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Top 20 por Valor</h2>
              <ItemTable rows={topByValue} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
