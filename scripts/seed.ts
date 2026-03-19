// Script para crear el usuario admin inicial
// Ejecutar con: npx tsx scripts/seed.ts

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Inicializando base de datos YJBMOTOCOM...')

  const existingAdmin = await prisma.user.findFirst({ where: { role: 'admin' } })

  if (existingAdmin) {
    console.log('✅ Ya existe un usuario admin:', existingAdmin.email)
    return
  }

  const passwordHash = await bcrypt.hash('Admin123!', 10)

  const admin = await prisma.user.create({
    data: {
      email: 'admin@yjbmotocom.com',
      name: 'Administrador',
      passwordHash,
      role: 'admin',
    },
  })

  console.log('✅ Usuario admin creado:')
  console.log('   Email:', admin.email)
  console.log('   Password: Admin123!')
  console.log('   ⚠️  CAMBIA LA CONTRASEÑA después del primer login!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
