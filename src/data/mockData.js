// Initial constants to populate empty state
export const INITIAL_BOOKS = [
  { id: "book-1", title: "El Hobbit", emoji: "🧙", color: "#16A34A", type: "novel" },
  { id: "book-2", title: "La Comunidad del Anillo", emoji: "💍", color: "#7C3AED", type: "novel" },
  { id: "book-3", title: "Las Dos Torres", emoji: "🗡️", color: "#B45309", type: "novel" },
  { id: "book-4", title: "El Retorno del Rey", emoji: "👑", color: "#DC2626", type: "novel" },
  { id: "book-5", title: "El Silmarillion", emoji: "✨", color: "#0891B2", type: "novel" },
  { id: "book-6", title: "Las Batallas de Tolkien (Day)", emoji: "📖", color: "#059669", type: "novel" },
  { id: "book-7", title: "Las Leyendas del Anillo (Day)", emoji: "📖", color: "#047857", type: "novel" },
  { id: "book-8", title: "Lovecraft", emoji: "🐙", color: "#7C2D12", type: "novel" },
  { id: "book-9", title: "Astroboy", emoji: "🤖", color: "#0284C7", type: "manga" },
  { id: "book-10", title: "Slam Dunk", emoji: "🏀", color: "#3B82F6", type: "manga" },
  { id: "book-11", title: "Naruto Gold", emoji: "🍃", color: "#F59E0B", type: "manga" },
  { id: "book-12", title: "Fullmetal Alchemist", emoji: "⚗️", color: "#EF4444", type: "manga" },
  { id: "book-13", title: "Spawn Integral", emoji: "👹", color: "#9CA3AF", type: "manga" },
  { id: "book-14", title: "Vagabond", emoji: "⚔️", color: "#A8956A", type: "manga" }
];

export const INITIAL_PHASES = [
  { id: 1, label: "Fase 1 · El Hobbit", weeks: [1, 4], color: "#16A34A", desc: "El Hobbit + Astroboy + Slam Dunk" },
  { id: 2, label: "Fase 2 · Tierra Media", weeks: [5, 11], color: "#7C3AED", desc: "Trilogía ESDLA + Naruto Gold + Arte companion" },
  { id: 3, label: "Fase 3 · Tolkien Profundo", weeks: [12, 19], color: "#0891B2", desc: "Silmarillion + FMA + David Day" },
  { id: 4, label: "Fase 4 · Oscuridad", weeks: [20, 25], color: "#7C2D12", desc: "Lovecraft + Spawn Integral" },
  { id: 5, label: "Fase 5 · El Maestro", weeks: [26, 28], color: "#A8956A", desc: "Vagabond solo" },
];

export const INITIAL_SCHEDULE = [
  { week: 1, mangaTitle: "Astroboy", mangaVols: "Tomo 1 (caps. 1–4)", novelTitle: "El Hobbit", novelSection: "Caps. 1–5", tip: "Dos clásicos fundacionales arrancan juntos." },
  { week: 2, mangaTitle: "Astroboy", mangaVols: "Tomo 1 (caps. 5–8, fin)", novelTitle: "El Hobbit", novelSection: "Caps. 6–10", tip: "Terminas Astroboy esta semana." },
  { week: 3, mangaTitle: "Slam Dunk", mangaVols: "Vol. 1", novelTitle: "El Hobbit", novelSection: "Caps. 11–15", tip: "Slam Dunk entra con toda su energía." },
  { week: 4, mangaTitle: "Slam Dunk", mangaVols: "Vol. 2 (fin)", novelTitle: "El Hobbit", novelSection: "Caps. 16–19 (fin)", tip: "Terminas El Hobbit y Slam Dunk." },
  { week: 5, mangaTitle: "Naruto Gold", mangaVols: "Vol. 1", novelTitle: "La Comunidad del Anillo", novelSection: "Libro I", companion: "Ilustraciones de La Comarca", tip: "Naruto y Frodo arrancan juntos." },
  { week: 6, mangaTitle: "Naruto Gold", mangaVols: "Vol. 2", novelTitle: "La Comunidad del Anillo", novelSection: "Libro II", companion: "Moria y Lothlórien", tip: "Moria en texto e imagen es doble experiencia." },
  { week: 7, mangaTitle: "Naruto Gold", mangaVols: "Vol. 3", novelTitle: "Las Dos Torres", novelSection: "Libro III", companion: "Rohan, los Ents e Isengard", tip: "Rohan y los Ents mientras Naruto en exámenes Chunin." },
  { week: 8, mangaTitle: "Naruto Gold", mangaVols: "Vol. 4", novelTitle: "Las Dos Torres", novelSection: "Libro IV", companion: "Gollum, Ithilien y Cirith Ungol", tip: "La dualidad Sméagol/Gollum es filosofía pura." },
  { week: 9, mangaTitle: "Naruto Gold", mangaVols: "Vol. 5", novelTitle: "El Retorno del Rey", novelSection: "Libro V", companion: "Minas Tirith y Pelennor", tip: "Pelennor Fields es épico." },
  { week: 10, mangaTitle: "Naruto Gold", mangaVols: "Vol. 6", novelTitle: "El Retorno del Rey", novelSection: "Libro VI", companion: "Los Puertos Grises", tip: "El final de ESDLA es hermoso." },
  { week: 11, mangaTitle: "Naruto Gold", mangaVols: "Vol. 7 (fin)", novelTitle: "El Retorno del Rey", novelSection: "Apéndices (fin)", tip: "Terminas Naruto Gold y ESDLA. 🎉" },
  { week: 12, mangaTitle: "Fullmetal Alchemist", mangaVols: "Vol. 1", novelTitle: "El Silmarillion", novelSection: "Ainulindalë + Valaquenta", tip: "FMA y El Sil exploran el precio de la ambición." },
  { week: 13, mangaTitle: "Fullmetal Alchemist", mangaVols: "Vol. 2", novelTitle: "El Silmarillion", novelSection: "Quenta (caps. 1–7)", tip: "Morgoth paralelo a la alquimia de FMA." },
  { week: 14, mangaTitle: "Fullmetal Alchemist", mangaVols: "Vol. 3", novelTitle: "El Silmarillion", novelSection: "Quenta (caps. 8–15)", tip: "Beren y Lúthien es belleza pura." },
  { week: 15, mangaTitle: "Fullmetal Alchemist", mangaVols: "Vol. 4", novelTitle: "El Silmarillion", novelSection: "Quenta (caps. 16–22)", tip: "Ambos se ponen filosóficamente oscuros." },
  { week: 16, mangaTitle: "Fullmetal Alchemist", mangaVols: "Vol. 5", novelTitle: "El Silmarillion", novelSection: "Akallabêth + Anillos (fin)", tip: "Tolkien completo. Reflexión necesaria." },
  { week: 17, mangaTitle: "Fullmetal Alchemist", mangaVols: "Vol. 6 (fin)", novelTitle: "Las Batallas de Tolkien (Day)", novelSection: "Primera mitad", tip: "David Day entra como enciclopedia." },
  { week: 18, mangaTitle: "— Pausa de manga —", mangaVols: "Descanso", novelTitle: "Las Batallas de Tolkien (Day)", novelSection: "Segunda mitad (fin)", tip: "Day no necesita competencia." },
  { week: 19, mangaTitle: "— Pausa de manga —", mangaVols: "Preparación", novelTitle: "Las Leyendas del Anillo (Day)", novelSection: "Completo", tip: "Cierra el universo Tolkien definitivamente." },
  { week: 20, mangaTitle: "Spawn Integral", mangaVols: "Vol. 1–2", novelTitle: "Lovecraft", novelSection: "Relatos tempranos", tip: "Redención demoníaca y horror cósmico." },
  { week: 21, mangaTitle: "Spawn Integral", mangaVols: "Vol. 3–4", novelTitle: "Lovecraft", novelSection: "Ratas de las paredes + Red Hook", tip: "Relatos cortos, gran atmósfera." },
  { week: 22, mangaTitle: "Spawn Integral", mangaVols: "Vol. 5–6", novelTitle: "Lovecraft", novelSection: "Montañas locura (I–VI)", tip: "La obra maestra de Lovecraft." },
  { week: 23, mangaTitle: "Spawn Integral", mangaVols: "Vol. 7–8", novelTitle: "Lovecraft", novelSection: "Montañas locura (VII–XII)", tip: "El final es inquietante." },
  { week: 24, mangaTitle: "Spawn Integral", mangaVols: "Vol. 9 (fin)", novelTitle: "Lovecraft", novelSection: "Charles Dexter Ward (I–III)", tip: "Terminas Spawn. Lovecraft se vuelve narrativo." },
  { week: 25, mangaTitle: "— Pausa de manga —", mangaVols: "Pre-Vagabond", novelTitle: "Lovecraft", novelSection: "Charles Dexter Ward (IV–V)", tip: "Semana de transición antes del final." },
  { week: 26, mangaTitle: "Vagabond", mangaVols: "Vol. 1", novelTitle: "— Vagabond merece toda la atención —", novelSection: "Sin novela", tip: "El final boss. Tómate tu tiempo." },
  { week: 27, mangaTitle: "Vagabond", mangaVols: "Vol. 2", novelTitle: "— Meditación —", novelSection: "Búsqueda del sentido", tip: "¿A qué te recuerda la búsqueda de Musashi?" },
  { week: 28, mangaTitle: "Vagabond", mangaVols: "Vol. 3 (fin)", novelTitle: "🏁 Fin del Gran Viaje Lector", novelSection: "Fin del viaje", tip: "No se termina Vagabond, se experimenta." }
];

export const INITIAL_ENTRIES = [];

export const MOODS = ["Concentrado 🧠", "Fluído ✨", "Emocionado 🔥", "Cansado 😴", "Distraído 💭"];

export const SECTION_TYPES = [
  { id: "quote", label: "Frases", emoji: "⭐", color: "#D4AF37" },
  { id: "character", label: "Personajes", emoji: "👤", color: "#7C3AED" },
  { id: "place", label: "Lugares", emoji: "📍", color: "#0891B2" },
  { id: "world", label: "Reglas Mundanas", emoji: "📜", color: "#16A34A" },
  { id: "glossary", label: "Glosario / Dudas", emoji: "📖", color: "#DC2626" },
  { id: "connection", label: "Conexiones", emoji: "🔗", color: "#78716C" }
];
