# 📋 VerduleriApp — Resumen / Traspaso de proyecto

> **Cómo usar este documento:** pégalo al inicio de una nueva sesión para dar
> contexto completo. Cubre qué es el proyecto, qué está hecho, qué falta y cómo
> continuar.

---

## 1. ¿Qué es?

**VerduleriApp** = marketplace de frutas y verduras con:
- **Web** (cliente, vendedor, admin) para ver catálogo y gestionar productos.
- **Bot de WhatsApp con IA** ("Verdy 🥬") que atiende clientes, cotiza con
  precios reales en tiempo real y guarda los pedidos.

## 2. Stack técnico

| Capa | Tecnología | Dónde vive |
|---|---|---|
| Frontend | React 19 + TypeScript + Vite + Tailwind | **Vercel** |
| Backend | Express 5 + TypeScript + Prisma | **Render** (plan free) |
| Base de datos | PostgreSQL | **Neon** (cloud) |
| Bot IA | Google Gemini (`gemini-2.5-flash`) | en el backend |
| WhatsApp | WhatsApp Cloud API (Meta) | número de prueba |

## 3. URLs y repos

- Frontend: https://verduleriapp.vercel.app
- Backend: https://verduleriapp-api.onrender.com
- GitHub: https://github.com/vonoaweb/verduleriapp (rama `master`)
- Carpeta local: `C:\Users\makin\OneDrive\Documentos\productos`
  (`app/` = frontend, `backend/` = backend)

## 4. Credenciales de acceso (seed)

| Rol | Email | Password |
|---|---|---|
| Admin | admin@verduleriapp.com | admin123 |
| Vendedor (frutas) | maria@frutasmaria.cl | vendor123 |
| Vendedor (verduras) | pedro@hortalizaspedro.cl | vendor123 |
| Vendedor (mixto) | carmen@frescosdelcampo.cl | vendor123 |
| Cliente | cliente@ejemplo.com | cliente123 |

## 5. IDs de la integración WhatsApp (no son secretos)

- Meta App ID: **2826265484440551** ("VerduleriApp Bot")
- WhatsApp Phone Number ID: **1138216419374440**
- WABA ID: **1294548579503504**
- Número de prueba: **+1 555 632 0911**
- Portfolio comercial Meta: "Verduleriapp"
- Usuario del sistema (token permanente): "VerduleriBot" (Admin)
- Número autorizado de prueba (cliente/dueño): **+52 5644645574**

> 🔐 Los **secretos** (GEMINI_API_KEY, WHATSAPP_ACCESS_TOKEN permanente,
> WHATSAPP_PHONE_ID, OWNER_WHATSAPP, DATABASE_URL, JWT_SECRET) están en
> **Render → Environment**. NO se guardan en este archivo.
> Service ID Render: `srv-d888fruq1p3s7380tag0`

---

## 6. ✅ Qué está HECHO y funcionando

- App desplegada (Vercel + Render + Neon).
- **Bot de WhatsApp 100% funcional**: recibe → IA Gemini → cotiza con precios
  reales de Neon → guarda el pedido → responde al cliente → **avisa al dueño**
  por WhatsApp (`OWNER_WHATSAPP`).
- **Token permanente** (Usuario del sistema, no expira).
- **Hosting despierto**: GitHub Action hace ping cada 5 min (`/.github/workflows/keep-alive.yml`)
  para que Render free no se duerma.
- **Edición de precios/productos** en panel de vendedor Y de admin (botón lápiz).
- **Pausar/activar** productos (switch) y eliminar.
- Mejoras de **accesibilidad** (aria-label, role=switch, foco visible).

### Bugs ya corregidos
- Cotizaciones no se guardaban → ahora sí (van a la BD + panel).
- Totales inflados por vendedor → corregido.
- Precios sin validar (venían del cliente) → ahora se validan contra la BD.
- CORS abierto → restringido.
- Número México con dígito extra (521…) → normalizado al enviar.
- Nombre "Frutas Mar�a" corrupto en la BD → corregido a "Frutas María".
- Botón de editar producto muerto (`onClick` vacío) → ahora funciona.

### Flujo del pedido (a dónde llega)
1. **Cliente**: respuesta del bot en su WhatsApp.
2. **Dueño** (`OWNER_WHATSAPP`): aviso "NUEVO PEDIDO" con cliente, productos, total.
3. **Panel web**: queda guardado en "Cotizaciones".

---

## 7. ⏳ Qué FALTA (pendientes)

### A) Mejoras UX/accesibilidad sugeridas (no urgentes)
1. El lápiz de editar solo aparece al pasar el mouse (no se ve en móvil) → hacerlo siempre visible.
2. Eliminar usa `confirm()`/`alert()` del navegador → modal propio.
3. Acciones que fallan lo hacen "en silencio" → mostrar toast de error.
4. Contraste de textos gris claro (`#95A893`) puede no cumplir WCAG AA → oscurecer.
5. El admin no puede CREAR productos (solo editar) → agregar botón "Nuevo".

### B) Pasarela de pagos (NUEVO — solicitado, aún no empezado)
- Objetivo: que el cliente pueda **pagar** el pedido (no solo cotizar).
- Decisiones a tomar: proveedor (Stripe / Mercado Pago / etc. según país),
  si el pago es por la web o por link en WhatsApp, manejo de estados del pedido
  (pendiente → pagado → completado).
- El modelo `Quote` ya tiene `status` (PENDING/RESPONDED/COMPLETED/CANCELLED);
  habría que añadir estado de pago y la integración.

### C) Infra
- **Imágenes en Render son efímeras**: si un vendedor sube fotos reales, se
  pierden en cada deploy. Migrar a Cloudinary / S3 / Vercel Blob.
- Render free se duerme (mitigado con el ping). Para producción real: plan pago (~$7/mes)
  o mover el webhook a serverless.

---

## 8. Archivos clave del bot
- `backend/src/services/bot.service.ts` — orquestador (recibe → IA → guarda → avisa).
- `backend/src/services/gemini.service.ts` — IA + catálogo en tiempo real + detección de pedido.
- `backend/src/services/whatsapp.service.ts` — enviar/recibir WhatsApp (incluye fix MX 521).
- `backend/src/routes/whatsapp.ts` — webhook.
- `backend/prisma/schema.prisma` — modelos (incluye `BotConversation`).
- `app/src/pages/VendorProductoNuevo.tsx` — formulario crear/**editar** producto.
- `ESTADO-BOT-WHATSAPP.md` — detalle del setup de Meta/WhatsApp.

## 9. Cómo continuar (siguiente sesión)
1. Leer este archivo + `ESTADO-BOT-WHATSAPP.md`.
2. Para cambios de código: editar en `app/` o `backend/`, `npm run build` para
   verificar, commit + push a `master` → Vercel/Render despliegan solos.
3. Próximo trabajo sugerido: **(B) pasarela de pagos** y **(A) las 5 mejoras UX**.
