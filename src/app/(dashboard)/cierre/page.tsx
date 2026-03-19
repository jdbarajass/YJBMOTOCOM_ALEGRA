import { Metadata } from 'next'
import CierreCaja from '@/components/dashboard/CierreCaja'

export const metadata: Metadata = {
  title: 'Cierre de Caja | YJBMOTOCOM',
}

export default function CierrePage() {
  return <CierreCaja />
}
