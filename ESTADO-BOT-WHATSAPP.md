# 📋 Estado del Bot de WhatsApp — Resumen para retomar

Última actualización: 2026-05-31

## ✅ COMPLETADO

| Componente | Estado | Detalle |
|---|---|---|
| Bot programado (IA + cotización) | ✅ | `backend/src/services/bot.service.ts`, `gemini.service.ts` |
| IA Gemini probada | ✅ | Modelo `gemini-2.5-flash` (el `2.0` daba cuota 0) |
| App en Meta creada | ✅ | App ID: **2826265484440551** ("VerduleriApp Bot") |
| Portfolio comercial | ✅ | "Verduleriapp" (negocio NO verificado, pero ok para pruebas) |
| Número de prueba WhatsApp | ✅ | **+1 555 632 0911** |
| Phone Number ID | ✅ | **1138216419374440** |
| WABA ID (cuenta WhatsApp Business) | ✅ | **1294548579503504** |
| Webhook URL verificada | ✅ | `https://verduleriapp-api.onrender.com/api/whatsapp/webhook` |
| Verify token | ✅ | `verduleriapp-bot-2026` |
| Campo "messages" suscrito | ✅ | En Webhook fields |
| App suscrita a la WABA (subscribed_apps) | ✅ | |
| Número destinatario autorizado | ✅ | **+52 5644645574** (verificado por SMS) |
| Credenciales en Render | ✅ parcial | GEMINI_API_KEY ✓, WHATSAPP_PHONE_ID ✓, WHATSAPP_ACCESS_TOKEN ⚠️ (expirado) |
| Keep-alive (GitHub Action) | ✅ | Ping cada 10 min para que Render no se duerma |

## ⚠️ PENDIENTE (lo único que falta)

### Crear TOKEN PERMANENTE
El token temporal del panel de WhatsApp **expira en horas** (no sirve para 24/7).
Hay que crear un **Usuario del sistema** en Meta Business con token permanente.

**Pasos:**
1. Ir a **business.facebook.com** → Configuración del negocio (Business Settings)
2. **Usuarios → Usuarios del sistema** → Crear (rol: Administrador)
3. **Agregar activos** → asignar la app "VerduleriApp Bot" Y la cuenta de WhatsApp (WABA)
4. **Generar token** → seleccionar la app → permisos:
   `whatsapp_business_messaging` + `whatsapp_business_management`
   → caducidad: **Nunca** (o 60 días)
5. Copiar el token (empieza con `EAA...`)
6. Pegarlo en **Render** → verduleriapp-api → Environment → `WHATSAPP_ACCESS_TOKEN`
   (Service ID Render: srv-d888fruq1p3s7380tag0)
7. Guardar (Render redeploya solo)

### Probar
- Enviar "Hola" al +1 555 632 0911 desde +52 5644645574
- El bot "Verdy 🥬" debe responder y cotizar con precios reales de Neon

## 🔗 Enlaces útiles
- App Meta: https://developers.facebook.com/apps/2826265484440551
- Render env vars: https://dashboard.render.com/web/srv-d888fruq1p3s7380tag0/env
- Frontend: https://verduleriapp.vercel.app
- Backend: https://verduleriapp-api.onrender.com

## 📝 Notas
- El error 131005 que apareció antes del 190 pudo ser por el token degradándose cerca de su expiración. Con el token permanente debería resolverse.
- Si con el token permanente persiste el 131005, esperar a que Meta termine de provisionar la cuenta nueva (puede tardar hasta ~1h) y/o verificar que el número destinatario siga en la lista de autorizados.
- GEMINI_API_KEY y el token NO se guardan en este archivo por seguridad.
