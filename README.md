# DuckHunt - Hand Tracking MVP

Un proyecto MVP de hand tracking en tiempo real usando Next.js, TypeScript y MediaPipe. Detecta gestos de mano para apuntar y disparar, preparado para convertirse en un juego tipo Duck Hunt.

## Características

- **Hand Tracking en Tiempo Real**: Usa MediaPipe HandLandmarker con WASM para detección precisa de manos
- **Detección de Gestos**: Detecta el gesto de "pinch" (pulgar + índice) para disparar
- **Visualización Completa**: Muestra landmarks, conectores y una retícula que sigue el dedo índice
- **Suavizado EMA**: Aplica Exponential Moving Average para una retícula estable y sin temblores
- **Debounce Inteligente**: Sistema de cooldown para evitar disparos múltiples involuntarios
- **FPS Counter**: Muestra el rendimiento en tiempo real

## Requisitos

- Node.js 18 o superior
- Navegador moderno con soporte para:
  - WebRTC (getUserMedia)
  - WebAssembly
  - Canvas 2D
- Cámara web funcional

## Instalación

1. Clonar o descargar este proyecto

2. Instalar dependencias:
```bash
npm install
```

3. Iniciar el servidor de desarrollo:
```bash
npm run dev
```

4. Abrir en el navegador:
```
http://localhost:3000
```

5. Navegar a la página de tracking:
```
http://localhost:3000/tracking
```

## Cómo Usar

1. **Permitir acceso a la cámara** cuando el navegador lo solicite
2. **Mostrar tu mano** frente a la cámara
3. **Apuntar** usando tu dedo índice - verás una retícula siguiéndolo
4. **Disparar** haciendo el gesto de pinch (juntar pulgar e índice)
5. Verás "FIRE!" en pantalla cuando dispares exitosamente

## Arquitectura

### Estructura de Archivos

```
DuckHunt/
├── app/
│   ├── layout.tsx           # Layout raíz de la aplicación
│   ├── page.tsx             # Página de inicio
│   └── tracking/
│       └── page.tsx         # Página de tracking (client-only)
├── components/
│   └── HandTracker.tsx      # Componente principal de tracking
├── lib/
│   └── mediapipe-config.ts  # Constantes y configuración
├── public/                  # Archivos estáticos
├── package.json
├── tsconfig.json
└── next.config.js
```

### Componente HandTracker

El componente principal `HandTracker.tsx` implementa:

**Estados:**
- `status`: Estado de inicialización (initializing, loading, ready, error)
- `fps`: Frames por segundo calculados
- `isFiring`: Indicador de disparo activo
- `errorMessage`: Mensaje de error si ocurre alguno

**Refs:**
- `videoRef`: Referencia al elemento de video
- `canvasRef`: Referencia al canvas overlay
- `handLandmarkerRef`: Instancia del detector de MediaPipe
- `smoothedPositionRef`: Posición suavizada para la retícula (EMA)

**Funciones Principales:**
- `initialize()`: Carga MediaPipe y configura la cámara
- `detectHands()`: Loop principal de detección en requestAnimationFrame
- `drawConnections()`: Dibuja las líneas entre landmarks de la mano
- `drawLandmarks()`: Dibuja los puntos de la mano
- `drawCrosshair()`: Dibuja la retícula en la posición suavizada
- `detectPinch()`: Detecta el gesto de pinch y activa el disparo
- `drawFireMessage()`: Muestra "FIRE!" en pantalla

### Algoritmos Clave

#### Suavizado EMA (Exponential Moving Average)
```typescript
smoothed.x = smoothed.x * ALPHA + current.x * (1 - ALPHA)
smoothed.y = smoothed.y * ALPHA + current.y * (1 - ALPHA)
```
- `ALPHA = 0.7`: Mayor valor = más suavizado pero más lag

#### Detección de Pinch
```typescript
const distance = Math.sqrt(
  Math.pow(thumb.x - index.x, 2) +
  Math.pow(thumb.y - index.y, 2)
);

if (distance < PINCH_THRESHOLD && !isPinching && canFire) {
  // FIRE!
}
```
- `PINCH_THRESHOLD = 0.05`: Distancia normalizada entre pulgar e índice
- Debounce de 500ms entre disparos

### MediaPipe Configuration

**Landmarks de la Mano** (21 puntos, índices 0-20):
- 0: Muñeca (WRIST)
- 1-4: Pulgar (THUMB)
- 5-8: Índice (INDEX_FINGER) - El punto 8 es la punta
- 9-12: Medio (MIDDLE_FINGER)
- 13-16: Anular (RING_FINGER)
- 17-20: Meñique (PINKY)

**Opciones del HandLandmarker:**
- `runningMode`: "VIDEO" - Optimizado para video en tiempo real
- `numHands`: 1 - Detecta solo una mano
- `minHandDetectionConfidence`: 0.5
- `minTrackingConfidence`: 0.5
- `delegate`: "GPU" - Usa aceleración GPU si está disponible

## Configuración y Constantes

Todas las constantes configurables están en `lib/mediapipe-config.ts`:

```typescript
EMA_ALPHA = 0.7           // Factor de suavizado
PINCH_THRESHOLD = 0.05    // Umbral de detección de pinch
FIRE_DEBOUNCE_MS = 500    // Cooldown entre disparos
FIRE_DISPLAY_MS = 300     // Duración del mensaje "FIRE!"
```

## Notas sobre HTTPS y Cámara

### Desarrollo Local
- `localhost` funciona sin HTTPS
- La cámara es accesible directamente

### Producción y Móviles
- **getUserMedia requiere HTTPS** en entornos de producción
- Para probar en móvil en la misma red:
  1. Usar **ngrok** o **localtunnel** para túnel HTTPS
  2. Configurar HTTPS local con certificado autofirmado
  3. Desplegar en servicio con HTTPS (Vercel, Netlify, etc.)

### Ejemplo con ngrok:
```bash
# Terminal 1
npm run dev

# Terminal 2
ngrok http 3000
```
Usar la URL HTTPS generada por ngrok en tu móvil.

## Troubleshooting

### La cámara no se activa
- Verificar permisos de cámara en el navegador
- Revisar que no haya otra aplicación usando la cámara
- Probar con otro navegador (Chrome, Edge recomendados)

### Bajo rendimiento (FPS < 20)
- Cerrar otras pestañas/aplicaciones
- Reducir la resolución de la cámara en `HandTracker.tsx`
- Verificar que la GPU esté disponible

### "FIRE!" se activa solo
- Ajustar `PINCH_THRESHOLD` en `mediapipe-config.ts`
- Incrementar el valor si es muy sensible
- Decrementar si no detecta el gesto

### MediaPipe no se carga
- Verificar conexión a internet (los archivos WASM vienen del CDN)
- Revisar la consola del navegador para errores específicos
- Verificar que el modelo esté accesible desde Google Storage

## Próximos Pasos

Este MVP está diseñado para fácilmente extenderse a un juego completo:

- [ ] Agregar sprites de patos con animaciones
- [ ] Sistema de puntuación y vidas
- [ ] Niveles con dificultad creciente
- [ ] Efectos de sonido y música
- [ ] Detección de colisión entre retícula y patos
- [ ] Pantalla de game over y high scores
- [ ] Soporte para múltiples manos (modo multijugador)
- [ ] Diferentes tipos de objetivos (patos, objetivos bonus, etc.)

## Tecnologías Utilizadas

- **Next.js 14**: Framework React con App Router
- **TypeScript**: Tipado estático
- **MediaPipe Tasks Vision**: Hand tracking con WASM
- **Canvas 2D API**: Renderizado de overlays
- **WebRTC getUserMedia**: Acceso a cámara web

## Performance

El sistema está optimizado para:
- **30-60 FPS** en hardware moderno
- **< 100ms latencia** desde gesto hasta detección
- **Mínimo uso de CPU** gracias a MediaPipe WASM + GPU delegate

## Licencia

MIT

## Créditos

- Hand tracking powered by [MediaPipe](https://developers.google.com/mediapipe)
- Built with [Next.js](https://nextjs.org)

## Deployment (Static Export with Base Path)

### Configuration

This app is configured to deploy under a base path (e.g., `https://dxjx.dev/voidhunter/`).

**Environment variable:**
```bash
NEXT_PUBLIC_BASE_PATH=/voidhunter
```

### Build for Production

```bash
# 1. Set environment variable (or use .env.local)
export NEXT_PUBLIC_BASE_PATH=/voidhunter

# 2. Build static export
npm run build

# 3. Output will be in ./out directory
```

### Local Testing with Base Path

```bash
# 1. Start dev server with base path
npm run dev

# 2. Open in browser
http://localhost:3000/voidhunter/
```

### Deployment Verification

- [ ] PWA installs correctly with scope `/voidhunter/`
- [ ] All assets load (sprites, icons, fonts)
- [ ] Service worker registers at `/voidhunter/sw.js`
- [ ] MediaPipe WASM files load from CDN
- [ ] Navigation works (landing → /tracking)
- [ ] All canvas animations render correctly

### NGINX Configuration (Optional Reference)

```nginx
location /voidhunter/ {
    alias /var/www/voidhunter/out/;
    try_files $uri $uri/ /voidhunter/index.html;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

**Desarrollado como MVP para proyecto Duck Hunt con hand tracking**
