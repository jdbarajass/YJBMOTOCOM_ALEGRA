# YJBMOTOCOM ALEGRA — Sistema de Gestión

Sistema de cierre de caja, análisis de ventas e inventario para **YJBMOTOCOM** (Accesorios para Motos), integrado con Alegra.

> Creado el 2026-03-19. Basado en el proyecto CIERRE_KOAJ (Flask+React), modernizado y unificado como una sola aplicación Next.js.

---

## Contexto del proyecto

Este sistema fue creado para el negocio **YJBMOTOCOM** de venta de accesorios de motos ubicado en Puerto Carreño. El negocio utiliza la plataforma **Alegra** para facturación, y este sistema se conecta a esa API para:

- Consultar las ventas del día y validar el cierre de caja
- Analizar ventas por periodo, clientes, vendedores y horas pico
- Revisar el inventario activo con clasificación ABC
- Gestionar los usuarios que usan el sistema

La plataforma hermana es **CIERRE_KOAJ** (tienda de ropa KOAJ), ubicada en `C:\Users\JJBarajas\Pictures\CIERRE_KOAJ`.

---

## Credenciales de Alegra

```
Usuario: yjbmotocom@gmail.com
Token:   8c6be851a71e7d1bebe9
API URL: https://api.alegra.com/api/v1
```

Estas credenciales ya están configuradas en `.env.local`.

---

## Tecnologías utilizadas

| Tecnología | Versión | Uso |
|------------|---------|-----|
| Next.js | 15.1.0 | Framework principal (front + back juntos) |
| React | 19.0 | UI |
| TypeScript | 5.7 | Tipado estático |
| Tailwind CSS | 3.4 | Estilos |
| Prisma | 5.22 | ORM para base de datos |
| SQLite | — | Base de datos (desarrollo) |
| PostgreSQL | — | Base de datos (producción) |
| JWT (jsonwebtoken) | 9.0 | Autenticación |
| bcryptjs | 2.4 | Hash de contraseñas |

---

## Estructura del proyecto

```
YJBMOTOCOM_ALEGRA/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/page.tsx          ← Página de inicio de sesión
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx              ← Layout con Navbar (protegido por sesión)
│   │   │   ├── cierre/page.tsx         ← Cierre de caja
│   │   │   ├── ventas-mensuales/page.tsx ← Ventas por periodo
│   │   │   ├── analytics/page.tsx      ← Analíticas (horas, clientes, vendedores)
│   │   │   ├── inventario/page.tsx     ← Inventario con ABC
│   │   │   ├── productos/page.tsx      ← Análisis de productos
│   │   │   └── usuarios/page.tsx       ← Gestión de usuarios (solo admin)
│   │   ├── api/
│   │   │   ├── auth/login/route.ts     ← POST login
│   │   │   ├── auth/logout/route.ts    ← POST logout
│   │   │   ├── auth/verify/route.ts    ← GET verificar sesión
│   │   │   ├── cierre/route.ts         ← POST/GET cierre de caja
│   │   │   ├── ventas-mensuales/route.ts ← GET ventas por rango
│   │   │   ├── analytics/dashboard/route.ts ← GET dashboard analítico
│   │   │   ├── inventario/route.ts     ← GET inventario Alegra
│   │   │   ├── usuarios/route.ts       ← GET/POST usuarios
│   │   │   └── health/route.ts         ← GET health check
│   │   ├── globals.css                 ← Estilos globales + componentes Tailwind
│   │   └── layout.tsx                  ← Root layout
│   ├── components/
│   │   ├── layout/Navbar.tsx           ← Barra de navegación con roles
│   │   └── dashboard/CierreCaja.tsx    ← Componente principal cierre de caja
│   ├── lib/
│   │   ├── alegra.ts                   ← Cliente API Alegra (paginación, facturas, inventario)
│   │   ├── cash-calculator.ts          ← Algoritmo knapsack + cálculos de cierre
│   │   ├── analytics.ts                ← Lógica de analíticas (horas, clientes, tendencias)
│   │   ├── auth.ts                     ← JWT, bcrypt, cookies
│   │   ├── db.ts                       ← Singleton Prisma
│   │   └── utils.ts                    ← Helpers (formatCOP, fechas Colombia)
│   ├── middleware.ts                   ← Protección de rutas + verificación JWT
│   └── types/index.ts                  ← Tipos TypeScript globales
├── prisma/
│   └── schema.prisma                   ← Modelos: User
├── scripts/
│   └── seed.ts                         ← Script para crear usuario admin inicial
├── .env.local                          ← Variables de entorno (credenciales Alegra)
├── .env.example                        ← Ejemplo de variables de entorno
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## Configuración inicial (primera vez)

### 1. Instalar dependencias
```bash
npm install
```

### 2. Crear la base de datos
```bash
npm run db:push
```

### 3. Crear usuario admin inicial
```bash
npm run seed
```
Credenciales creadas:
- **Email:** `admin@yjbmotocom.com`
- **Password:** `Admin123!`
- **Rol:** Administrador

> Cambia la contraseña después del primer login creando un nuevo admin desde la sección Usuarios.

### 4. Iniciar en desarrollo
```bash
npm run dev
```
Visita [http://localhost:3000](http://localhost:3000) → redirige automáticamente al login.

---

## Funcionalidades

### Cierre de Caja (`/cierre`)
- Roles: Admin + Vendedor
- Conteo de monedas (50, 100, 200, 500, 1000) y billetes (2k, 5k, 10k, 20k, 50k, 100k)
- Registro de pagos digitales: Nequi, Daviplata, QR, Addi, Tarjeta Débito, Tarjeta Crédito
- Registro de gastos operativos y préstamos del día
- **Pre-consulta**: Consulta Alegra antes de enviar el cierre para ver las ventas del día
- **Algoritmo Knapsack**: Calcula automáticamente la combinación óptima de billetes/monedas para la base de caja (objetivo: $450,000 COP)
- Validación del cierre comparando efectivo físico vs Alegra
- Estados de validación: ✅ Correcto / ⚠️ Advertencia / ❌ Error
- Detección automática de desfases (faltantes/sobrantes)

### Ventas del Periodo (`/ventas-mensuales`)
- Roles: Admin + Vendedor
- Selección de rango de fechas
- Total vendido en el periodo
- Desglose por método de pago (efectivo, tarjeta, transferencias)
- Porcentaje por método
- Facturas activas y anuladas

### Analíticas (`/analytics`)
- Roles: Admin + Vendedor
- **Tendencias**: Tabla de ventas diarias por fecha
- **Horas Pico**: Gráfico de barras de facturas por hora
- **Top Clientes**: Ranking con total de compras y promedio
- **Vendedores**: Ranking de rendimiento por vendedor

### Inventario (`/inventario`)
- Rol: Solo Admin
- KPIs: total items, valor total, sin stock, bajo stock
- **Análisis ABC**: Clase A (80% del valor), B (15%), C (5%)
- Lista de productos sin stock
- Lista de productos con bajo stock (≤5 unidades)
- Top 20 productos por valor total

### Productos (`/productos`)
- Rol: Solo Admin
- Resumen de ventas del periodo
- Gráfico de barras de ventas diarias

### Usuarios (`/usuarios`)
- Rol: Solo Admin
- Lista de todos los usuarios
- Crear nuevos usuarios con rol (admin/vendedor)
- Validación de fortaleza de contraseña
- Bloqueo por intentos fallidos (5 intentos → 15 min bloqueo)

---

## Integración con Alegra

### Autenticación
- Tipo: HTTP Basic Auth con `usuario:token` en Base64
- Se configura automáticamente desde las variables de entorno

### Métodos implementados (`src/lib/alegra.ts`)

| Método | Descripción |
|--------|-------------|
| `getInvoicesByDate(date)` | Obtiene todas las facturas de un día con paginación automática (límite Alegra: 30 por página) |
| `getAllInvoicesInRange(start, end)` | Consulta día por día para rangos de fechas |
| `getSalesSummary(date)` | Resumen de ventas de un día (filtra anuladas) |
| `getMonthlySalesSummary(start, end)` | Resumen de ventas de un periodo |
| `getSalesComparisonYoY(date)` | Comparación año a año |
| `getActiveItems()` | Items activos del inventario |
| `filterVoidedInvoices(invoices)` | Filtra facturas con status void/anulada/cancelled |

### Lógica de paginación
La API de Alegra devuelve máximo 30 facturas por request. El cliente hace la primera consulta con `metadata=true` para saber el total, y luego hace requests adicionales con `start=30`, `start=60`, etc. hasta obtener todas.

### Filtrado de facturas anuladas
Las facturas con status `void`, `voided`, `anulada`, `cancelled`, o `canceled` se excluyen automáticamente de todos los cálculos de venta.

---

## Algoritmo Knapsack (Base de Caja)

El sistema usa programación dinámica (0/1 Knapsack) para encontrar la combinación óptima de billetes y monedas que sume exactamente $450,000 COP (base objetivo) o lo más cercano posible.

```
Objetivo: BASE_OBJETIVO = 450,000 COP
Umbral menudo: UMBRAL_MENUDO = 10,000 COP
Monedas: [50, 100, 200, 500, 1,000]
Billetes: [2,000, 5,000, 10,000, 20,000, 50,000, 100,000]
```

**Estados de la base:**
- `exacta`: El efectivo total es exactamente $450,000
- `faltante`: Falta dinero para completar la base
- `sobrante`: Hay más de $450,000 (lo extra se consigna)

---

## Fórmulas del Cierre

```
Venta efectivo Alegra = Total general - Excedente efectivo - Base + Gastos operativos + Préstamos
                        (los gastos y préstamos se suman porque ya se sacaron físicamente ANTES de contar)

Validación: Alegra[cash] + Excedente efectivo - Gastos - Préstamos + Desfases ≈ Total a consignar
            (diferencia < $100 = válido)
```

---

## Base de Datos

### Modelo User
```prisma
model User {
  id                   Int       @id @default(autoincrement())
  email                String    @unique
  passwordHash         String
  name                 String
  role                 String    @default("sales")  // "admin" | "sales"
  isActive             Boolean   @default(true)
  failedLoginAttempts  Int       @default(0)
  lockedUntil          DateTime?
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
}
```

---

## Autenticación y Seguridad

- **JWT** con expiración de 8 horas, almacenado en cookie `HttpOnly`
- **bcrypt** con 10 rondas de salt para contraseñas
- **Middleware** Next.js protege todas las rutas (excepto `/login` y `/api/auth/login`)
- **Roles**: `admin` tiene acceso total; `sales` solo ve cierre, ventas y analíticas
- Bloqueo de cuenta tras 5 intentos fallidos (15 minutos)
- Requisitos de contraseña: mín. 8 caracteres, mayúscula, minúscula y número

---

## Variables de entorno

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `DATABASE_URL` | `file:./dev.db` | SQLite en desarrollo |
| `JWT_SECRET` | (string secreto) | Clave para firmar tokens JWT |
| `JWT_EXPIRES_IN` | `8h` | Expiración de sesión |
| `ALEGRA_USER` | `yjbmotocom@gmail.com` | Usuario Alegra |
| `ALEGRA_TOKEN` | `8c6be851a71e7d1bebe9` | Token API Alegra |
| `ALEGRA_API_BASE_URL` | `https://api.alegra.com/api/v1` | URL base Alegra |
| `ALEGRA_TIMEOUT` | `30` | Timeout en segundos |
| `BASE_OBJETIVO` | `450000` | Base de caja objetivo en COP |
| `UMBRAL_MENUDO` | `10000` | Umbral para moneda menuda |

---

## Scripts disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run db:push      # Crear/actualizar DB sin migraciones (desarrollo)
npm run db:migrate   # Crear migración y aplicar (producción)
npm run db:studio    # Abrir Prisma Studio (GUI de la DB)
npm run seed         # Crear usuario admin inicial
```

---

## API Endpoints

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | No | Iniciar sesión |
| POST | `/api/auth/logout` | Sí | Cerrar sesión |
| GET | `/api/auth/verify` | Sí | Verificar sesión activa |
| POST | `/api/cierre` | Sí | Procesar cierre de caja completo |
| GET | `/api/cierre?date=YYYY-MM-DD` | Sí | Pre-consulta datos Alegra del día |
| GET | `/api/ventas-mensuales?start_date=&end_date=` | Sí | Ventas por rango de fechas |
| GET | `/api/ventas-mensuales?type=yoy&date=` | Sí | Comparación año a año |
| GET | `/api/analytics/dashboard?start_date=&end_date=` | Sí | Dashboard analítico completo |
| GET | `/api/inventario` | Admin | Análisis completo de inventario |
| GET | `/api/usuarios` | Admin | Listar usuarios |
| POST | `/api/usuarios` | Admin | Crear usuario |
| GET | `/api/health` | No | Health check |

---

## Despliegue en producción (Vercel + PostgreSQL)

1. Cambia el provider en `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. Configura las variables de entorno en Vercel (las mismas de `.env.local`)

3. Ejecuta la migración inicial:
   ```bash
   npm run db:migrate
   ```

4. Despliega en Vercel:
   ```bash
   vercel --prod
   ```

---

## Historial de cambios

| Fecha | Descripción |
|-------|-------------|
| 2026-03-19 | Creación inicial del proyecto. Basado en CIERRE_KOAJ, migrado de Flask+React a Next.js 15 + TypeScript. Se unificó el front y el back en un solo proyecto. Se configuraron las credenciales de Alegra para yjbmotocom@gmail.com. |
