# Lorekeeper: The Golden Archive

![Lorekeeper Hero](public/assets/hero.png)

**Lorekeeper** es un archivo digital premium diseñado para guardianes del conocimiento literario. Esta Progressive Web App (PWA) permite gestionar lecturas, capturar reflexiones y explorar un archivo de conocimiento organizado con una estética elegante y minimalista.

## ✨ Características Principales

- 📖 **Bitácora de Lectura:** Registra tu progreso con estados de ánimo, búsqueda por texto/fecha/libro, eliminación masiva y paginación.
- ⏳ **Plan Maestro:** Organiza libros por fases y cronogramas semanales. Marca semanas completadas, visualiza streaks y estadísticas de progreso. Exporta/importa backups JSON.
- 📚 **Archivo (Enciclopedia):** Repositorio auto-generado de personajes, lugares, glosario y reglas del mundo. Línea temporal de menciones por entidad.
- 🔮 **El Oráculo:** IA que genera revelaciones poéticas sobre las entidades de tu archivo usando la API de Gemini.
- 🎤 **Entrada de Voz:** Dictado en español (Web Speech API) integrado en el formulario de entrada.
- ✍️ **Formulario enriquecido:** Personajes, lugares, frases, glosario, reglas del mundo, conexiones entre libros, y paneles de manga (comprimidos a WebP, almacenados en IndexedDB). Auto-guardado de borradores y extracción automática de metadata con IA.
- 📶 **PWA con soporte offline:** Instalable en móvil, caché con Workbox, notificación de actualizaciones.
- 🎨 **Tema dual:** Dark (zinc/amber) y light (pergamino), con toggle y persistencia. Fuentes: Playfair Display, Inter, Source Serif 4.
- ⌨️ **Atajos de teclado:** `Cmd+K` buscar, `Cmd+1/2/3` cambiar tab.
- ♿ **Accesibilidad:** Skip-to-content, ARIA roles/labels, focus-visible, touch targets mínimos.

## 🛠️ Tecnologías

![Lorekeeper UI Mockup](public/assets/mockup.png)

- **Frontend:** React 19 + Vite 7
- **Estilos:** Tailwind CSS 4 (tema zinc/amber dark, pergamino light)
- **Animaciones:** Framer Motion
- **IA:** Gemini API con retry/backoff para extracción de metadata y El Oráculo
- **Persistencia:** localStorage con validación de forma + IndexedDB para imágenes
- **PWA:** vite-plugin-pwa (generateSW, offline fallback, prompt de actualización)
- **Testing:** Vitest + jsdom + @testing-library/react (70 tests)

## 🚀 Instalación y Uso

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar API de Gemini (opcional):**
   ```bash
   cp .env.example .env
   # Editar .env con tu VITE_GEMINI_API_KEY
   # Sin API key, la app usa respuestas mock
   ```

3. **Desarrollo local:**
   ```bash
   npm run dev
   ```

4. **Tests:**
   ```bash
   npm run test          # Ejecución única
   npm run test:watch    # Modo watch
   ```

5. **Build de producción:**
   ```bash
   npm run build
   npm run preview       # Preview del build
   ```

## 📁 Estructura

```
src/
├── views/          # ReadingPlan, ReadingLog, Encyclopedia, EntryForm
├── components/     # MainLayout, ErrorBoundary, ReloadPrompt
├── hooks/          # useLorekeeperState, useLocalStorage, useNotification,
│                   # useSpeechRecognition, useKeyboardShortcuts
├── utils/          # ai.js (Gemini API), imageStore.js (IndexedDB)
├── data/           # mockData.js (libros, fases, cronograma)
├── __tests__/      # 6 suites, 70 tests
├── App.jsx         # Componente raíz
└── main.jsx        # Punto de entrada + providers
```

---
*Preserva el conocimiento. Protege la historia.*
