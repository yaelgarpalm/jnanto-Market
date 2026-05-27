# Deploy en Render

Este proyecto se despliega como Web Service de Node usando el `render.yaml` incluido en la raiz.

## Antes de desplegar

1. Sube el repositorio a GitHub.
2. Crea o actualiza las tablas en Supabase con `schema.sql`.
3. Si necesitas ubicaciones GPS reales para rutas, ejecuta tambien `docs/route-gps-location.sql` en Supabase.
4. Configura las variables de entorno en Render antes del primer deploy.

## Blueprint

1. En Render abre **New > Blueprint**.
2. Conecta el repositorio de GitHub.
3. Render detectara `render.yaml`.
4. Completa las variables marcadas como `sync: false`.
5. Aplica el Blueprint.

## Variables obligatorias

```bash
NODE_ENV=production
NODE_VERSION=20
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
APP_URL=https://tu-servicio.onrender.com
```

`APP_URL` debe ser la URL final del servicio en Render. Se usa para QR, NFC y retornos seguros de Stripe.

## Variables opcionales

```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
POLYGON_RPC_URL=https://rpc-amoy.polygon.technology
BLOCKCHAIN_PRIVATE_KEY=0x...
GEMINI_API_KEY=...
```

No configures `PORT`; Render lo inyecta automaticamente.

## Comandos del servicio

```bash
Build Command: npm ci && npm run build
Start Command: npm run start
Health Check Path: /api/health
```

## Checklist de verificacion

```bash
npm run lint
npm run build
```

Despues del deploy, abre:

```bash
https://tu-servicio.onrender.com/api/health
```

Debe responder `{"ok":true,...}`. Si `supabase` aparece en `false` o el servicio no arranca, revisa `VITE_SUPABASE_URL` y `SUPABASE_SECRET_KEY`.
