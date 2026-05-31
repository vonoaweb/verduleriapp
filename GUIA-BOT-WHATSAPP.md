# 🤖 Guía para activar el Bot de WhatsApp con IA

Esta guía te lleva paso a paso a conseguir las **4 credenciales** que el bot
necesita para funcionar. Todo es **gratis** y toma ~15 minutos.

Cuando termines, solo tienes que pasarle estos 4 datos a tu desarrollador y el
bot quedará respondiendo solo:

```
1. GEMINI_API_KEY        = ____________________
2. WHATSAPP_PHONE_ID     = ____________________
3. WHATSAPP_ACCESS_TOKEN = ____________________
4. WHATSAPP_VERIFY_TOKEN = verduleriapp-bot-2026   (ya está elegido, no lo cambies)
```

---

## PARTE 1 — Clave de IA (Google Gemini) · 3 min

El "cerebro" del bot. Gratis.

1. Entra a 👉 **https://aistudio.google.com/app/apikey**
2. Inicia sesión con una cuenta de Google (la del negocio).
3. Haz clic en **"Create API key"** (Crear clave de API).
4. Si pide proyecto, elige **"Create API key in new project"**.
5. Copia la clave que aparece (empieza con `AIza...`).

➡️ **Ese es tu `GEMINI_API_KEY`.** Guárdalo.

---

## PARTE 2 — WhatsApp Cloud API (Meta) · 10 min

Aquí Meta te regala un **número de prueba gratis** para empezar de inmediato.

### 2.1 Crear la app
1. Entra a 👉 **https://developers.facebook.com**
2. Inicia sesión con tu Facebook (sirve uno personal para empezar).
3. Arriba a la derecha: **"My Apps"** → **"Create App"**.
4. En "¿Qué quieres hacer?", elige **"Other"** → **Next**.
5. Tipo de app: elige **"Business"** → **Next**.
6. Ponle un nombre (ej: *VerduleriApp Bot*) → **Create App**.

### 2.2 Agregar WhatsApp
1. En el panel de la app, busca la tarjeta **"WhatsApp"** → **"Set up"**.
2. Si pide una "Business portfolio", crea una rápida con el nombre del negocio.

### 2.3 Copiar los datos
1. En el menú izquierdo: **WhatsApp → API Setup** (Configuración de API).
2. Verás una sección **"Send and receive messages"**. Ahí está:
   - **Phone number ID** → cópialo.
     ➡️ Ese es tu **`WHATSAPP_PHONE_ID`**.
   - **Temporary access token** → cópialo (botón "Copy").
     ➡️ Ese es tu **`WHATSAPP_ACCESS_TOKEN`**.

> ⚠️ Nota: el token temporal dura **24 horas**. Sirve perfecto para PROBAR.
> Para dejarlo permanente se genera un "token de sistema" (te ayudo con eso
> cuando ya esté probado y funcionando).

### 2.4 Agregar tu número para recibir pruebas
1. En la misma pantalla, sección **"To"**, haz clic en **"Manage phone number list"**.
2. Agrega **TU número de celular** (con código de país, ej: +52...).
3. Te llegará un código por WhatsApp → ingrésalo para verificar.

✅ Con esto ya puedes recibir mensajes del bot en tu celular durante las pruebas.

---

## PARTE 3 — Conectar el Webhook · 3 min

Esto le dice a WhatsApp "cuando llegue un mensaje, avísale a mi bot".

1. En el menú izquierdo: **WhatsApp → Configuration** (Configuración).
2. En la sección **"Webhook"**, haz clic en **"Edit"**.
3. Llena:
   - **Callback URL:**
     ```
     https://verduleriapp-api.onrender.com/api/whatsapp/webhook
     ```
   - **Verify token:**
     ```
     verduleriapp-bot-2026
     ```
4. Haz clic en **"Verify and save"**. Debe quedar en verde ✅.
   (Si falla, avísale al desarrollador: el backend debe estar configurado primero.)
5. Abajo, en **"Webhook fields"**, busca **"messages"** y haz clic en
   **"Subscribe"**.

---

## PARTE 4 — Entregar las credenciales

Pásale a tu desarrollador estos 4 valores (los de las Partes 1 y 2):

```
GEMINI_API_KEY        = AIza...........
WHATSAPP_PHONE_ID     = 123456789......
WHATSAPP_ACCESS_TOKEN = EAAG...........
WHATSAPP_VERIFY_TOKEN = verduleriapp-bot-2026
```

El desarrollador los pone en Render (Settings → Environment) y el bot queda
respondiendo solo. 🎉

---

## 🧪 Cómo probar que funciona

1. Desde tu celular (el que agregaste en el paso 2.4), envía un WhatsApp al
   número de prueba de Meta con el texto: **"Hola"**.
2. El bot "Verdy 🥬" debe responderte y ayudarte a cotizar productos reales.
3. Prueba pedir algo: *"quiero 2 kilos de tomate y una lechuga"*.
4. Confirma el pedido y revisa que la cotización aparezca en el panel de admin.

---

## ❓ Preguntas frecuentes

**¿Es gratis?**
Sí. Gemini (1.500 mensajes/día gratis), WhatsApp Cloud API (1.000
conversaciones/mes gratis) y el hosting. Solo se paga si el volumen crece mucho.

**¿El token de 24 h es un problema?**
Solo para pruebas. Una vez que funcione, se cambia por un token permanente
(paso que hace el desarrollador en 5 min).

**¿Puedo usar mi número personal de WhatsApp?**
No para el bot. El bot necesita un número dedicado. Meta da uno de prueba gratis,
y para producción se registra el número del negocio (que no debe estar ya en un
WhatsApp normal).
