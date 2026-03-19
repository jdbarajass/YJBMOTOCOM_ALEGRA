'use client'

import { useState } from 'react'
import { formatColombiaDate } from '@/lib/utils'

const MONEDAS = [50, 100, 200, 500, 1000]
const BILLETES = [2000, 5000, 10000, 20000, 50000, 100000]

function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const TODAY = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })

export default function CierreCaja() {
  const [date, setDate] = useState(TODAY)
  const [monedas, setMonedas] = useState<Record<number, number>>(
    Object.fromEntries(MONEDAS.map((d) => [d, 0]))
  )
  const [billetes, setBilletes] = useState<Record<number, number>>(
    Object.fromEntries(BILLETES.map((d) => [d, 0]))
  )
  const [gastosOperativos, setGastosOperativos] = useState(0)
  const [gastosNota, setGastosNota] = useState('')
  const [prestamos, setPrestamos] = useState(0)
  const [prestamosNota, setPrestamosNota] = useState('')

  // Métodos de pago
  const [nequi, setNequi] = useState(0)
  const [daviplata, setDaviplata] = useState(0)
  const [qr, setQr] = useState(0)
  const [addi, setAddi] = useState(0)
  const [tarjetaDebito, setTarjetaDebito] = useState(0)
  const [tarjetaCredito, setTarjetaCredito] = useState(0)

  // Excedentes simples
  const [excedente, setExcedente] = useState(0)

  // Estado
  const [loading, setLoading] = useState(false)
  const [preconsulta, setPreconsulta] = useState(false)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState('')

  const totalMonedas = MONEDAS.reduce((s, d) => s + d * (monedas[d] || 0), 0)
  const totalBilletes = BILLETES.reduce((s, d) => s + d * (billetes[d] || 0), 0)
  const totalEfectivo = totalMonedas + totalBilletes

  async function handlePreconsulta() {
    setError('')
    setPreconsulta(true)
    try {
      const res = await fetch(`/api/cierre?date=${date}`)
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.error || 'Error consultando Alegra')
      } else {
        setResult(data)
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setPreconsulta(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setResult(null)
    setLoading(true)

    const payload = {
      date,
      monedas,
      billetes,
      excedentes: excedente > 0 ? [{ tipo: 'efectivo', valor: excedente }] : [],
      gastos_operativos: gastosOperativos,
      gastos_operativos_nota: gastosNota,
      prestamos,
      prestamos_nota: prestamosNota,
      desfases: [],
      metodos_pago: {
        addi_datafono: addi,
        nequi,
        daviplata,
        qr,
        tarjeta_debito: tarjetaDebito,
        tarjeta_credito: tarjetaCredito,
      },
    }

    try {
      const res = await fetch('/api/cierre', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.error || 'Error procesando el cierre')
      } else {
        setResult(data)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } catch {
      setError('Error de conexión con el servidor')
    } finally {
      setLoading(false)
    }
  }

  const validation = result?.validation as Record<string, unknown> | undefined

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cierre de Caja</h1>
        <p className="text-gray-500 text-sm mt-1">
          YJBMOTOCOM - Accesorios para Motos · Integrado con Alegra
        </p>
      </div>

      {/* Resultado de validación */}
      {validation && (
        <div className={`card border-l-4 ${
          validation.validation_status === 'success' ? 'border-green-500' :
          validation.validation_status === 'warning' ? 'border-yellow-500' :
          'border-red-500'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">
              {validation.validation_status === 'success' ? '✅' :
               validation.validation_status === 'warning' ? '⚠️' : '❌'}
            </span>
            <h3 className="font-bold text-gray-900">
              {validation.validation_status === 'success' ? 'Cierre Validado Correctamente' :
               validation.validation_status === 'warning' ? 'Cierre con Advertencias' :
               'Cierre con Errores'}
            </h3>
          </div>
          <p className="text-sm text-gray-700">{String(validation.mensaje_validacion || '')}</p>

          {/* Totales Alegra */}
          {result?.alegra && (() => {
            const alegra = result.alegra as Record<string, unknown>
            const totalSale = alegra.total_sale as { formatted?: string } | undefined
            const invoicesSummary = alegra.invoices_summary as { active_invoices?: number; voided_invoices?: number } | undefined
            return (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-blue-600 font-medium">TOTAL VENTA ALEGRA</p>
                  <p className="text-lg font-bold text-blue-900">{totalSale?.formatted || '-'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 font-medium">FACTURAS ACTIVAS</p>
                  <p className="text-lg font-bold text-gray-900">{invoicesSummary?.active_invoices ?? '-'}</p>
                </div>
                {(invoicesSummary?.voided_invoices ?? 0) > 0 && (
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-red-600 font-medium">ANULADAS</p>
                    <p className="text-lg font-bold text-red-900">{invoicesSummary?.voided_invoices}</p>
                  </div>
                )}
                {result?.cash_count && (() => {
                  const cc = result.cash_count as Record<string, unknown>
                  const consignar = cc.consignar as Record<string, unknown> | undefined
                  return (
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-green-600 font-medium">A CONSIGNAR</p>
                      <p className="text-lg font-bold text-green-900">
                        {String(consignar?.efectivo_para_consignar_final_formatted || '-')}
                      </p>
                    </div>
                  )
                })()}
              </div>
            )
          })()}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Fecha */}
        <div className="card">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <label className="label">Fecha del cierre</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input-field w-auto"
                max={TODAY}
              />
            </div>
            <button
              type="button"
              onClick={handlePreconsulta}
              disabled={preconsulta}
              className="btn-secondary"
            >
              {preconsulta ? 'Consultando...' : '🔍 Pre-consultar Alegra'}
            </button>
          </div>
        </div>

        {/* Conteo de efectivo */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Conteo de Efectivo</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Monedas */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Monedas</h3>
              <div className="space-y-2">
                {MONEDAS.map((d) => (
                  <div key={d} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-24">{formatCOP(d)}</span>
                    <input
                      type="number"
                      min={0}
                      value={monedas[d] || 0}
                      onChange={(e) => setMonedas({ ...monedas, [d]: parseInt(e.target.value) || 0 })}
                      className="input-field w-24 text-center"
                    />
                    <span className="text-sm text-gray-500 w-28 text-right">
                      = {formatCOP(d * (monedas[d] || 0))}
                    </span>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Total monedas</span>
                  <span className="text-sm font-bold text-gray-900">{formatCOP(totalMonedas)}</span>
                </div>
              </div>
            </div>

            {/* Billetes */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Billetes</h3>
              <div className="space-y-2">
                {BILLETES.map((d) => (
                  <div key={d} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-24">{formatCOP(d)}</span>
                    <input
                      type="number"
                      min={0}
                      value={billetes[d] || 0}
                      onChange={(e) => setBilletes({ ...billetes, [d]: parseInt(e.target.value) || 0 })}
                      className="input-field w-24 text-center"
                    />
                    <span className="text-sm text-gray-500 w-28 text-right">
                      = {formatCOP(d * (billetes[d] || 0))}
                    </span>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Total billetes</span>
                  <span className="text-sm font-bold text-gray-900">{formatCOP(totalBilletes)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-brand-50 rounded-lg flex justify-between items-center">
            <span className="font-semibold text-brand-800">TOTAL EFECTIVO</span>
            <span className="text-xl font-bold text-brand-900">{formatCOP(totalEfectivo)}</span>
          </div>
        </div>

        {/* Métodos de pago digitales */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pagos Digitales y Tarjetas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Nequi', value: nequi, setter: setNequi },
              { label: 'Daviplata', value: daviplata, setter: setDaviplata },
              { label: 'QR', value: qr, setter: setQr },
              { label: 'Addi (Datafono)', value: addi, setter: setAddi },
              { label: 'Tarjeta Débito', value: tarjetaDebito, setter: setTarjetaDebito },
              { label: 'Tarjeta Crédito', value: tarjetaCredito, setter: setTarjetaCredito },
            ].map(({ label, value, setter }) => (
              <div key={label}>
                <label className="label">{label}</label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={value || ''}
                  onChange={(e) => setter(parseInt(e.target.value) || 0)}
                  className="input-field"
                  placeholder="0"
                />
                {value > 0 && (
                  <p className="text-xs text-gray-500 mt-1">{formatCOP(value)}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Ajustes */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ajustes del Día</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Excedente en efectivo</label>
              <input
                type="number"
                min={0}
                step={1000}
                value={excedente || ''}
                onChange={(e) => setExcedente(parseInt(e.target.value) || 0)}
                className="input-field"
                placeholder="0"
              />
            </div>
            <div>
              <label className="label">Gastos operativos</label>
              <input
                type="number"
                min={0}
                step={1000}
                value={gastosOperativos || ''}
                onChange={(e) => setGastosOperativos(parseInt(e.target.value) || 0)}
                className="input-field"
                placeholder="0"
              />
              <input
                type="text"
                value={gastosNota}
                onChange={(e) => setGastosNota(e.target.value)}
                className="input-field mt-2"
                placeholder="Nota de gastos..."
              />
            </div>
            <div>
              <label className="label">Préstamos</label>
              <input
                type="number"
                min={0}
                step={1000}
                value={prestamos || ''}
                onChange={(e) => setPrestamos(parseInt(e.target.value) || 0)}
                className="input-field"
                placeholder="0"
              />
              <input
                type="text"
                value={prestamosNota}
                onChange={(e) => setPrestamosNota(e.target.value)}
                className="input-field mt-2"
                placeholder="Nota de préstamos..."
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => { setResult(null); setError('') }}
            className="btn-secondary"
          >
            Limpiar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary px-8 py-3 text-base"
          >
            {loading ? 'Procesando cierre...' : '🏦 Procesar Cierre de Caja'}
          </button>
        </div>
      </form>

      {/* Resultado detallado */}
      {result && result.cash_count && (() => {
        const cc = result.cash_count as Record<string, unknown>
        const base = cc.base as Record<string, unknown> | undefined
        const totals = cc.totals as Record<string, unknown> | undefined
        const consignar = cc.consignar as Record<string, unknown> | undefined
        return (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Resultado del Cierre</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Total Efectivo Contado</p>
                <p className="text-xl font-bold text-gray-900">
                  {String(totals?.total_general_formatted || '-')}
                </p>
              </div>
              <div className={`rounded-lg p-4 ${
                base?.base_status === 'exacta' ? 'bg-green-50' :
                base?.base_status === 'faltante' ? 'bg-red-50' : 'bg-blue-50'
              }`}>
                <p className="text-sm text-gray-500">Base ({String(base?.base_status || '-')})</p>
                <p className="text-xl font-bold text-gray-900">
                  {String(base?.total_base_formatted || '-')}
                </p>
                <p className="text-xs text-gray-600 mt-1">{String(base?.mensaje_base || '')}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">A Consignar</p>
                <p className="text-xl font-bold text-green-900">
                  {String(consignar?.efectivo_para_consignar_final_formatted || '-')}
                </p>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
