# Revibo Frontend

Frontend móvil desarrollado con Expo, Expo Router y React Native.

## Visión general

`revibo_frontend` usa una arquitectura modular con rutas basadas en archivos bajo `app/` y código compartido en `src/`.

- `app/`: rutas y pantallas de Expo Router.
- `src/features/`: lógica por dominio (admin, auth, crear_reportes, incidents, map, report, rutas).
- `src/shared/`: componentes reutilizables, hooks, constantes, notificaciones y estado global.
- `app.json`: configuración de Expo, plugins, notificaciones y Google Maps.
- `tsconfig.json`: alias `@/*` para importar desde `src/`.

## Arquitectura del proyecto

```text
revibo_frontend/
├─ app/                      # Rutas y pantallas Expo Router
├─ assets/                   # Imágenes, iconos y recursos estáticos
├─ src/
│  ├─ features/              # Dominios de negocio
│  │  ├─ admin/
│  │  ├─ auth/
│  │  ├─ crear_reportes/
│  │  ├─ incidents/
│  │  ├─ map/
│  │  ├─ report/
│  │  └─ rutas/
│  └─ shared/                # Reutilizables y utilidades
│     ├─ components/
│     ├─ constants/
│     ├─ hooks/
│     ├─ notifications/
│     └─ store/
├─ app.json                  # Configuración de Expo y plugins
├─ package.json              # Dependencias y scripts
├─ tsconfig.json             # Alias de importación y TypeScript
└─ expo-env.d.ts
```

### Principios clave

- `app/` permanece en la raíz para dejar a Expo Router manejar la navegación sin interferencias.
- `src/features/` agrupa la funcionalidad por dominio y facilita la escalabilidad.
- `src/shared/` centraliza UI común, hooks y estado para evitar duplicación.
- `tsconfig.json` define `@/*` para permitir imports absolutos desde `src/`.

## Librerías esenciales

### Base Expo / React Native

- `expo` / `react-native`: plataforma principal.
- `expo-router`: routing basado en archivos.
- `expo-dev-client`: flujo de desarrollo nativo personalizado.
- `expo-constants`, `expo-device`, `expo-system-ui`, `expo-status-bar`.
- `react-dom`, `react-native-web`: soporte web.

### Navegación

- `@react-navigation/native`
- `@react-navigation/bottom-tabs`
- `@react-navigation/elements`
- `react-native-gesture-handler`
- `react-native-screens`
- `react-native-safe-area-context`

### Estado y formularios

- `zustand`: estado global liviano.
- `react-hook-form`: manejo de formularios.

### UI / Estilos

- `nativewind`: Tailwind para React Native.
- `tailwindcss`
- `prettier-plugin-tailwindcss`
- `@expo/vector-icons`

### Funcionalidad móvil importante

- `expo-image-picker`: selección de imagen.
- `expo-location`: acceso a ubicación.
- `expo-notifications`: notificaciones push/locales.
- `expo-secure-store`: almacenamiento seguro.
- `expo-splash-screen`: pantalla de carga.
- `@react-native-async-storage/async-storage`: caché local.
- `@react-native-community/netinfo`: estado de red.
- `react-native-toast-message`: mensajes tipo toast.

### Mapas y rutas

- `react-native-maps`: mapas nativos.
- `react-native-maps-directions`: direcciones y rutas.

### Animaciones / rendimiento

- `react-native-reanimated`
- `react-native-worklets`

## Configuración destacada en `app.json`

- `scheme`: `revibofrontend`
- `newArchEnabled: true`
- `plugins`: `expo-router`, `expo-splash-screen`, `expo-web-browser`, `expo-notifications`, `expo-secure-store`
- `android.config.googleMaps.apiKey`: clave de Google Maps.
- `web.output`: `static`
- `experiments.typedRoutes`: true
- `experiments.reactCompiler`: true

## Instalación y ejecución

1. Instala dependencias:

```bash
npm install
```

2. Inicia el servidor de desarrollo:

```bash
npm run start
```

Alternativa si no se detecta Expo global:

```bash
npx expo start
```

### Comandos útiles

- `npm run android`
- `npm run ios` (macOS)
- `npm run web`
- `npm run lint`

## Notas importantes

- Mantén las rutas de navegación en `app/` y la lógica de dominio en `src/features/`.
- Usa `src/shared/` para componentes, hooks y utilidades reutilizables.
- Evita crear `src/app/` junto con `app/` para no confundir Expo Router.
- Si necesitas nuevos dominios, agrega carpetas en `src/features/` y exporta lógica localmente.
