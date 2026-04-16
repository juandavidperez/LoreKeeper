# LoreKeeper · El Grimorio del Archivero

[![Vite](https://img.shields.io/badge/vite-7.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/react-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/tailwind-4.0-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/supabase-cloud-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-Oracle-4285F4?logo=google-gemini&logoColor=white)](https://deepmind.google/technologies/gemini/)

**LoreKeeper** es una Progressive Web App (PWA) diseñada para lectores que desean trascender la simple lectura. Inspirada en la estética de los grimorios clásicos, permite llevar un registro profundo de crónicas, visualizar redes de personajes mediante un mapa de sabiduría con física dinámica y consultar a un Oráculo potenciado por IA.

---

### ✦ Vistas de la Aplicación

| Característica | Escritorio | Celular |
| :--- | :---: | :---: |
| **Plan Maestro** <br> Gestión Ritual de Lectura | ![Desktop Plan](./public/screenshots/plan_desktop.png) | ![Mobile Plan](./public/screenshots/plan_mobile.png) |
| **Crónicas** <br> Registro profundo (Modo Oscuro) | ![Desktop Log](./public/screenshots/log_desktop.png) | ![Mobile Log](./public/screenshots/log_mobile.png) |
| **Wisdom Map** <br> Redes con Física d3-force | ![Desktop Map](./public/screenshots/map_desktop.png) | ![Mobile Map](./public/screenshots/map_mobile.png) |

---

## ⚔️ Características Principales

### 🕸️ Wisdom Map (Mapa de Sabiduría)
Motor de visualización basado en **d3-force** que genera una red de conexiones entre personajes y lugares automáticamente a partir de tus crónicas. La física dinámica permite explorar la complejidad de la historia de forma interactiva.

### 📜 Plan Maestro (Rituales)
Sistema de gestión de lectura inspirado en "rituales" semanales. Organiza tus libros actuales y próximos, marcando el ritmo de tu progreso en el grimorio.

### ✍️ Crónicas de Lectura
Editor enriquecido para registrar momentos clave. Incluye captura de imágenes para fragmentos físicos y detección automática de entidades (personajes/lugares) que alimentan el Archivo Global.

### 🔮 El Oráculo de Lore
Integración con la API de **Google Gemini**. El Oráculo conoce tu archivo personal y puede responder preguntas sobre la trama, sugerir conexiones entre personajes o predecir giros basados en tu progreso actual.

---

## 🛠️ Stack Tecnológico

- **Frontend**: React 19 (Hooks avanzados, Suspense, Lazy Loading).
- **Estilo**: Tailwind CSS 4 con sistema de diseño "Grimorio Dorado" (soporte Dark/Light mode real).
- **Animaciones**: Framer Motion para transiciones de página suaves y micro-interacciones.
- **Gráficos**: d3-force para el motor de física del mapa de sabiduría.
- **Backend & Sync**: Supabase para autenticación y respaldo en la nube de crónicas e imágenes.
- **IA**: Modelos Gemini de Google para el motor de sabiduría.
- **PWA**: Instalable, con soporte offline y notificaciones de recordatorio de lectura.

---

## 🏛️ Filosofía de Diseño: "El Grimorio"

LoreKeeper no es una herramienta de productividad; es un artefacto. La interfaz busca evocar la sensación de un libro antiguo y valioso:
- **Tipografía**: Dualidad entre serifas clásicas para contenido y sans-serif modernas para UI.
- **Paleta**: Tonos pergamino, acentos dorados y sombras profundas.
- **Interactividad**: Cada acción tiene peso, desde el efecto de "forjar" una entrada hasta la vibración de los hilos en el mapa.

---

## 🚀 Instalación y Desarrollo

1. Clona el repositorio: `git clone https://github.com/juandavidperez/LoreKeeper.git`
2. Instala dependencias: `npm install`
3. Configura las variables de entorno (`.env.local`):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GEMINI_API_KEY`
4. Inicia el servidor de desarrollo: `npm run dev`

---

*Desarrollado con pasión por la lectura y el código limpio. 2026.*
