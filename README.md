# Lorekeeper: The Golden Archive

![Lorekeeper Hero](public/assets/hero.png)

**Lorekeeper** es un archivo digital premium diseñado para guardianes del conocimiento literario. Más que una simple aplicación de seguimiento, es un **grimorio vivo** que permite capturar, reflexionar y organizar el universo de tus lecturas con una estética solemne y un motor técnico de alto rendimiento.

## 📜 Filosofía de Diseño: "Solemne, Vivo, Íntimo"

Lorekeeper no es una herramienta de productividad genérica; es un espacio para el ritual de la lectura.

- **El Ámbar es Sagrado**: El color `#f59e0b` se reserva exclusivamente para estados activos, acciones primarias y momentos de logro (como sellar una semana).
- **El Pergamino lidera**: El modo claro (*parchment*) es la referencia estética primordial, inspirada en manuscritos medievales.
- **Voz del Archivero**: La interfaz se comunica con solemnidad. No usamos "borrar", usamos **"Desvanecer"**. No es "guardar", es **"Forjar"**.

---

## ✨ Características Principales

### ⚔️ Bitácora de Crónicas (Reading Log)
- **Registro Enriquecido**: Captura estados de ánimo, progreso y metadatos detallados.
- **Multimedia**: Soporte para paneles de manga (WebP) almacenados localmente en IndexedDB.
- **Voz**: Entrada de dictado en español (`Web Speech API`) integrada en el formulario.

### ⏳ El Plan Maestro (Reading Plan)
- **Fases y Cronogramas**: Organización semanal con visualización de *streaks* y estadísticas.
- **Sellar Semanas**: Un ritual visual para marcar el progreso cumplido.
- **Backups**: Sistema de Exportación/Importación JSON con validación de esquema.

### 📚 El Archivo (Encyclopedia)
- **Auto-generación**: Repositorio automático de personajes, lugares, glosario y reglas del mundo basado en tus crónicas.
- **Línea Temporal**: Rastreo de menciones por entidad a través de todos los libros.

### 🔮 El Oráculo (AI Oracle)
- **IA Poética**: Integración con la API de Gemini para generar revelaciones y extraer metadatos automáticamente.
- **Resiliencia**: Sistema de *retry* con *exponential backoff* para manejar límites de API.

---

## 🛠️ Stack Tecnológico 2.0

Lorekeeper utiliza las últimas tecnologías de la web moderna para garantizar una experiencia fluida y offline:

- **Core**: React 19 + Vite 7 (JavaScript puro).
- **Estilos**: Tailwind CSS 4 con sistema de variables personalizadas para temas dark/parchment.
- **Animaciones**: Framer Motion 12 para transiciones solemnes.
- **Persistencia & Sync**:
  - `localStorage`: Estado global de la app con validación de forma.
  - `IndexedDB`: Almacenamiento de imágenes de alto peso.
  - `Supabase`: Motor de sincronización en la nube (opcional).
- **Mobile**: Capacitor 8 para soporte nativo en Android.
- **PWA**: `vite-plugin-pwa` con estrategias de caché personalizadas (Workbox).

---

## 🚀 Instalación y Configuración

### 1. Requisitos Previos
```bash
npm install
```

### 2. Configuración de Entorno
Copia el archivo `.env.example` a `.env` y configura tus llaves:
- `VITE_GEMINI_API_KEY`: Para habilitar El Oráculo y extracción de metadata.
- `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY`: Para la sincronización en la nube.

### 3. Desarrollo Local
```bash
npm run dev        # Web (Vite)
npx cap open android # Android (Android Studio)
```

### 4. Tests y Calidad
```bash
npm run test       # Vitest (14 suites, +70 tests)
npm run lint       # ESLint
```

---

## 🏗️ Arquitectura y Flujos

### Sincronización Local-First
Lorekeeper prioriza la velocidad local. Los cambios se guardan instantáneamente en `localStorage` y se encolan para su sincronización con Supabase (`src/utils/syncEngine.js`). Si el usuario está offline, el `SyncQueue` reintentará la operación automáticamente al recuperar la conexión.

### Gestión de Imágenes
Para evitar saturar el `localStorage`, las imágenes (paneles de manga) se comprimen en el cliente a formato WebP y se guardan en IndexedDB a través de `src/utils/imageStore.js`.

---

## 📁 Estructura del Proyecto

```
src/
├── components/     # UI shared (MainLayout, SyncIndicator, AuthBanner)
├── context/        # Providers (ThemeContext, LorekeeperContext)
├── hooks/          # Logica (useSync, useAuth, useLorekeeperState)
├── utils/          # Motores (syncEngine, ai, imageStore)
├── views/          # Paginas (ReadingPlan, Encyclopedia, EntryForm)
└── __tests__/      # Cobertura de tests unitarios y de integración
```

---
*Preserva el conocimiento. Protege la historia. Forja tu leyenda.*
