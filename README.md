# Revibo Frontend (Expo + Expo Router)

Aplicacion mobile con arquitectura modular por dominios y codigo compartido centralizado en `src/`.

## Estructura del proyecto

```text
revibo_frontend/
|- app/                        # Rutas de Expo Router (file-based routing)
|- assets/
|- src/
|  |- app/                     # Reservado para migracion futura de rutas
|  |- features/                # Dominios de negocio (map, incidents, auth, etc.)
|  |- shared/
|  |  |- components/
|  |  |- hooks/
|  |  |- constants/
|  |- services/                # Clientes API / integraciones externas
|  |- store/                   # Estado global
|  |- utils/                   # Utilidades puras
|- App.tsx                     # Componente temporal de ejemplo NativeWind
|- app.json
|- package.json
|- tsconfig.json
|- .env.example
```

## Por que esta estructura

- `app/` queda en raiz para mantener Expo Router estable sin configuracion extra.
- `src/features` organiza la logica por dominio para escalar mejor.
- `src/shared` contiene piezas reutilizables y evita duplicacion.
- `src/services`, `src/store` y `src/utils` separan responsabilidades tecnicas.

## Alias e imports

Se usa el alias `@/` en `tsconfig.json` con prioridad a `src`.

- `@/shared/...` -> codigo compartido
- `@/features/...` -> modulos por dominio
- `@/assets/...` -> recursos estaticos en raiz

## Instalacion y ejecucion


1. Instalar dependencias:

```bash
npm install
```

2. Iniciar el servidor de desarrollo:

```bash
npm run start
```

Si en tu terminal aparece "expo no se reconoce", usa esta alternativa:

```bash
npx expo start
```

Comandos utiles:

- `npm run android` (abre en Android)
- `npm run ios` (abre en iOS, solo macOS)
- `npm run web` (abre en navegador)
- `npm run lint` (ejecuta lint)

## Convenciones recomendadas

- Mantener las pantallas/rutas dentro de `app/`.
- Mover logica de negocio y UI reutilizable a `src/features` y `src/shared`.
- Evitar importar directo entre features; compartir por `src/shared` o `src/services`.

## Proxima migracion sugerida

- Crear carpetas por feature dentro de `src/features` (por ejemplo `map`, `incidents`, `auth`).
- Extraer gradualmente componentes usados por una sola feature.
- Dejar en `src/shared` solo elementos realmente reutilizables.
