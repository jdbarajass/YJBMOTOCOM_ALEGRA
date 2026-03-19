// ============================================================
// Tipos globales de YJBMOTOCOM ALEGRA
// ============================================================

export type UserRole = 'admin' | 'sales'

export interface UserSession {
  id: number
  email: string
  name: string
  role: UserRole
}

// ----------- Alegra API Types -----------

export interface AlegraPayment {
  paymentMethod: string
  amount: number
}

export interface AlegraInvoice {
  id: number | string
  number?: string
  date: string
  datetime?: string
  total: number
  status?: string
  payments?: AlegraPayment[]
  client?: { name?: string }
}

export interface AlegraPaymentResult {
  label: string
  total: number
  formatted: string
}

export interface AlegraResponse {
  date_requested: string
  username_used: string
  results: {
    cash: AlegraPaymentResult
    transfer: AlegraPaymentResult
    'credit-card': AlegraPaymentResult
    'debit-card': AlegraPaymentResult
  }
  total_sale: AlegraPaymentResult
  invoices_summary: {
    total_invoices: number
    active_invoices: number
    voided_invoices: number
  }
  voided_invoices?: {
    voided_count: number
    total_voided_amount: number
    total_voided_amount_formatted: string
    voided_summary: VoidedInvoiceSummary[]
  }
}

export interface VoidedInvoiceSummary {
  id: number | string
  number?: string
  total: number
  total_formatted: string
  client_name: string
}

// ----------- Cash Closing Types -----------

export interface CoinCount {
  [denomination: number]: number
}

export interface BillCount {
  [denomination: number]: number
}

export interface ExcedentItem {
  tipo: 'efectivo' | 'datafono' | 'qr_transferencias'
  subtipo?: 'nequi' | 'daviplata' | 'qr'
  valor: number
}

export interface DesfaseItem {
  tipo: 'faltante_caja' | 'sobrante_caja'
  valor: number
  nota: string
}

export interface MetodosPago {
  addi_datafono: number
  nequi: number
  daviplata: number
  qr: number
  tarjeta_debito: number
  tarjeta_credito: number
}

export interface CashClosingPayload {
  date: string
  monedas: CoinCount
  billetes: BillCount
  excedentes: ExcedentItem[]
  gastos_operativos: number
  gastos_operativos_nota: string
  prestamos: number
  prestamos_nota: string
  desfases: DesfaseItem[]
  metodos_pago: MetodosPago
}

export interface CashResult {
  totals: {
    total_monedas: number
    total_billetes: number
    total_general: number
    total_general_formatted: string
  }
  base: {
    total_base: number
    total_base_formatted: string
    base_status: 'exacta' | 'faltante' | 'sobrante'
    diferencia_base: number
    diferencia_base_formatted: string
    mensaje_base: string
    exact_base_obtained: boolean
  }
  consignar: {
    total_consignar_sin_ajustes: number
    efectivo_para_consignar_final: number
    efectivo_para_consignar_final_formatted: string
  }
  adjustments: {
    excedente: number
    gastos_operativos: number
    prestamos: number
    venta_efectivo_diaria_alegra: number
    venta_efectivo_diaria_alegra_formatted: string
  }
}

export interface ValidationResult {
  cierre_validado: boolean
  validation_status: 'success' | 'warning' | 'error'
  diferencias: {
    efectivo: {
      efectivo_alegra: number
      efectivo_alegra_formatted: string
      excedente_efectivo: number
      suma_efectivo_ajustada: number
      suma_efectivo_ajustada_formatted: string
      efectivo_para_consignar: number
      efectivo_para_consignar_formatted: string
      diferencia: number
      diferencia_formatted: string
      es_valido: boolean
    }
    transferencias: {
      alegra: number
      registrado: number
      diferencia: number
      diferencia_formatted: string
      es_significativa: boolean
    }
    datafono: {
      alegra: number
      registrado: number
      diferencia: number
      diferencia_formatted: string
      es_significativa: boolean
    }
    datafono_real: {
      total: number
      total_formatted: string
    }
  }
  mensaje_validacion: string
  mensajes_detallados: string[]
  desfase_sugerido: {
    detectado: boolean
    tipo?: string
    valor?: number
    valor_formatted?: string
    mensaje: string
  }
}

// ----------- Analytics Types -----------

export interface PeakHour {
  hour: number
  hour_label: string
  invoice_count: number
  total_sales: number
  total_sales_formatted: string
}

export interface TopCustomer {
  name: string
  invoice_count: number
  total_purchases: number
  total_purchases_formatted: string
  average_purchase: number
}

export interface TopSeller {
  name: string
  invoice_count: number
  total_sales: number
  total_sales_formatted: string
}

export interface SalesTrend {
  date: string
  total: number
  total_formatted: string
  invoice_count: number
}

export interface AnalyticsDashboard {
  peak_hours: PeakHour[]
  top_customers: TopCustomer[]
  top_sellers: TopSeller[]
  sales_trends: SalesTrend[]
  summary: {
    total_sales: number
    total_invoices: number
    average_daily_sales: number
    date_range: { start: string; end: string }
  }
}

// ----------- Inventory Types -----------

export interface InventoryItem {
  id: string | number
  name: string
  reference?: string
  quantity: number
  price: number
  cost?: number
  category?: string
  status: string
}

export interface InventoryAnalysis {
  summary: {
    total_items: number
    total_value: number
    total_value_formatted: string
    out_of_stock_count: number
    low_stock_count: number
  }
  abc_analysis: {
    A: InventoryItem[]
    B: InventoryItem[]
    C: InventoryItem[]
  }
  out_of_stock: InventoryItem[]
  low_stock: InventoryItem[]
  top_by_value: InventoryItem[]
}

// ----------- API Response Types -----------

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
