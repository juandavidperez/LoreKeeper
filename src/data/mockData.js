// Initial constants to populate empty state
export const INITIAL_BOOKS = [
  { id: "book-1", title: "El Hobbit", emoji: "🧙", color: "#16A34A", type: "novel" },
  { id: "book-2", title: "La Comunidad del Anillo", emoji: "💍", color: "#7C3AED", type: "novel" },
  { id: "book-3", title: "Las Dos Torres", emoji: "🗡️", color: "#B45309", type: "novel" },
  { id: "book-4", title: "El Retorno del Rey", emoji: "👑", color: "#DC2626", type: "novel" },
  { id: "book-5", title: "El Silmarillion", emoji: "✨", color: "#0891B2", type: "novel" },
  { id: "book-6", title: "Las Batallas de Tolkien (Day)", emoji: "📖", color: "#059669", type: "novel" },
  { id: "book-7", title: "Las Leyendas del Anillo (Day)", emoji: "📖", color: "#047857", type: "novel" },
  { id: "book-15", title: "Poderes Oscuros de Tolkien (Day)", emoji: "📖", color: "#065F46", type: "novel" },
  { id: "book-8", title: "Lovecraft", emoji: "🐙", color: "#7C2D12", type: "novel" },
  { id: "book-9", title: "Astroboy", emoji: "🤖", color: "#0284C7", type: "manga" },
  { id: "book-10", title: "Slam Dunk", emoji: "🏀", color: "#3B82F6", type: "manga" },
  { id: "book-11", title: "Naruto Gold", emoji: "🍃", color: "#F59E0B", type: "manga" },
  { id: "book-12", title: "Fullmetal Alchemist", emoji: "⚗️", color: "#EF4444", type: "manga" },
  { id: "book-13", title: "Spawn Integral", emoji: "👹", color: "#9CA3AF", type: "manga" },
  { id: "book-14", title: "Vagabond", emoji: "⚔️", color: "#A8956A", type: "manga" }
];

export const INITIAL_PHASES = [
  { id: 1, label: "Fase 1 · El Hobbit",      weeks: [1,  4],  color: "#16A34A", desc: "El Hobbit + Astroboy + Slam Dunk" },
  { id: 2, label: "Fase 2 · Tierra Media",   weeks: [5,  14], color: "#7C3AED", desc: "Trilogía ESDLA + Naruto Gold + Arte companion (10 semanas)" },
  { id: 3, label: "Fase 3 · Tolkien Profundo", weeks: [15, 24], color: "#0891B2", desc: "Silmarillion + FMA + David Day" },
  { id: 4, label: "Fase 4 · Oscuridad",      weeks: [25, 30], color: "#7C2D12", desc: "Lovecraft + Spawn Integral" },
  { id: 5, label: "Fase 5 · El Maestro",     weeks: [31, 33], color: "#A8956A", desc: "Vagabond solo" },
];

export const INITIAL_SCHEDULE = [
  // ── Fase 1 · El Hobbit ────────────────────────────────────────────────────
  { week: 1,  mangaTitle: "Astroboy",        mangaVols: "Tomo 1 (caps. 1–4)",      novelTitle: "El Hobbit",                 novelSection: "Caps. 1–5",                    tip: "Dos clásicos fundacionales arrancan juntos. Tezuka y Tolkien, misma semana." },
  { week: 2,  mangaTitle: "Astroboy",        mangaVols: "Tomo 1 (caps. 5–8, fin)", novelTitle: "El Hobbit",                 novelSection: "Caps. 6–10",                   tip: "Terminas Astroboy esta semana. La ternura de Tezuka es el antídoto al peligro de Tolkien." },
  { week: 3,  mangaTitle: "Slam Dunk",       mangaVols: "Vol. 1",                  novelTitle: "El Hobbit",                 novelSection: "Caps. 11–15",                  tip: "Slam Dunk entra con energía pura. Sakuragi y Bilbo tienen más en común de lo que parece." },
  { week: 4,  mangaTitle: "Slam Dunk",       mangaVols: "Vol. 2 (fin)",            novelTitle: "El Hobbit",                 novelSection: "Caps. 16–19 (fin)",            tip: "Cierras El Hobbit y Slam Dunk. Bilbo vuelve diferente. Sakuragi apenas empieza." },

  // ── Fase 2 · Tierra Media (10 semanas) ───────────────────────────────────
  { week: 5,  mangaTitle: "Naruto Gold",     mangaVols: "Vol. 1",                  novelTitle: "La Comunidad del Anillo",   novelSection: "Libro I — La Comarca a Weathertop",     companion: "Ilustraciones de La Comarca", tip: "Lee despacio. La Comarca es el jardín que vale perder — Tolkien la pinta para que su abandono duela." },
  { week: 6,  mangaTitle: "Naruto Gold",     mangaVols: "Vol. 2",                  novelTitle: "La Comunidad del Anillo",   novelSection: "Libro I — Weathertop a Rivendell (fin)", companion: "Rivendell y los Elfos",        tip: "Weathertop es el primer golpe real. Tolkien no avisa cuando el cuento de hadas termina." },
  { week: 7,  mangaTitle: "Naruto Gold",     mangaVols: "Vol. 3",                  novelTitle: "La Comunidad del Anillo",   novelSection: "Libro II — Moria y Lothlórien",         companion: "Moria y Lothlórien",          tip: "Moria es catedral de oscuridad. La caída de Gandalf en el puente vale toda la semana." },
  { week: 8,  mangaTitle: "Naruto Gold",     mangaVols: "Vol. 4",                  novelTitle: "Las Dos Torres",            novelSection: "Libro III — Rohan y los Ents",          companion: "Rohan, los Ents e Isengard",  tip: "Rohan huele a anglosajón puro. Los Ents se mueven en tiempo geológico — deja que pasen." },
  { week: 9,  mangaTitle: "Naruto Gold",     mangaVols: "Vol. 5",                  novelTitle: "Las Dos Torres",            novelSection: "Libro IV — Gollum, Frodo y Sam",        companion: "Gollum, Ithilien y Cirith Ungol", tip: "La dualidad Sméagol/Gollum es el corazón de ESDLA. Lee la escena del lago dos veces." },
  { week: 10, mangaTitle: "Naruto Gold",     mangaVols: "Vol. 6",                  novelTitle: "El Retorno del Rey",        novelSection: "Libro V — Minas Tirith y Pelennor",     companion: "Minas Tirith y Pelennor",     tip: "Pelennor Fields. Éowyn. Merry. El loophole que Tolkien escondió desde el principio." },
  { week: 11, mangaTitle: "Naruto Gold",     mangaVols: "Vol. 7 (fin)",            novelTitle: "El Retorno del Rey",        novelSection: "Libro VI — El Monte del Destino",       companion: "Los Puertos Grises",          tip: "Sam carga a Frodo porque Frodo ya no puede. El heroísmo más honesto de la literatura." },
  { week: 12, mangaTitle: "— Pausa —",       mangaVols: "Sin manga",               novelTitle: "El Retorno del Rey",        novelSection: "Apéndices — Cronología + Anillos de Poder", tip: "No tienes que leerlos todos. Cronología y Anillos de Poder bastan para el contexto." },
  { week: 13, mangaTitle: "— Pausa —",       mangaVols: "Sin manga",               novelTitle: "El Retorno del Rey",        novelSection: "Companion — Ilustraciones y mapas",    tip: "Semana visual. Los companion de Day son álbumes de arte — hojea sin presión, sin examen." },
  { week: 14, mangaTitle: "— Pausa —",       mangaVols: "Sin manga",               novelTitle: "— Reflexión y transición —", novelSection: "Releer pasaje favorito de ESDLA",      tip: "Antes de entrar al Silmarillion, cierra ESDLA en tu mente. ¿Quién te marcó más?" },

  // ── Fase 3 · Tolkien Profundo ─────────────────────────────────────────────
  { week: 15, mangaTitle: "Fullmetal Alchemist", mangaVols: "Vol. 1",             novelTitle: "El Silmarillion",           novelSection: "Ainulindalë + Valaquenta",              tip: "FMA y El Sil exploran el precio de la ambición. La Música de Ainur es creación pura." },
  { week: 16, mangaTitle: "Fullmetal Alchemist", mangaVols: "Vol. 2",             novelTitle: "El Silmarillion",           novelSection: "Quenta (caps. 1–7)",                   tip: "Morgoth paralelo a la alquimia de FMA. La corrupción del poder tiene la misma forma." },
  { week: 17, mangaTitle: "Fullmetal Alchemist", mangaVols: "Vol. 3",             novelTitle: "El Silmarillion",           novelSection: "Quenta (caps. 8–15)",                  tip: "Beren y Lúthien es la historia de amor más antigua de Tolkien. Léela como poema." },
  { week: 18, mangaTitle: "Fullmetal Alchemist", mangaVols: "Vol. 4",             novelTitle: "El Silmarillion",           novelSection: "Quenta (caps. 16–22)",                 tip: "Ambos se oscurecen filosóficamente. La caída de Númenor es la más trágica del legendarium." },
  { week: 19, mangaTitle: "Fullmetal Alchemist", mangaVols: "Vol. 5",             novelTitle: "El Silmarillion",           novelSection: "Akallabêth + De los Anillos de Poder (fin)", tip: "Tolkien completo. Reflexiona antes de pasar a Day — el legendarium necesita digestión." },
  { week: 20, mangaTitle: "Fullmetal Alchemist", mangaVols: "Vol. 6",             novelTitle: "Las Batallas de Tolkien (Day)", novelSection: "Primera mitad",              tip: "David Day entra como enciclopedia visual. FMA y el mundo tolkieniano comparten obsesión con la transmutación." },
  { week: 21, mangaTitle: "Fullmetal Alchemist", mangaVols: "Vol. 7 (fin)",       novelTitle: "Las Batallas de Tolkien (Day)", novelSection: "Segunda mitad (fin)",        tip: "FMA cierra aquí. Es uno de los finales más satisfactorios del manga — merece toda tu atención." },
  { week: 22, mangaTitle: "— Pausa —",           mangaVols: "Sin manga",          novelTitle: "Poderes Oscuros de Tolkien (Day)", novelSection: "Completo",               tip: "El lado oscuro del legendarium, en su propio espacio. Morgoth y Sauron como ensayo." },
  { week: 23, mangaTitle: "— Pausa —",           mangaVols: "Sin manga",          novelTitle: "Las Leyendas del Anillo (Day)", novelSection: "Completo",                 tip: "Day no necesita competencia. La historia visual de los Anillos, un artefacto hermoso." },
  { week: 24, mangaTitle: "— Pausa —",           mangaVols: "Sin manga",          novelTitle: "Las Leyendas del Anillo (Day)", novelSection: "Repaso + notas propias",   tip: "Cierra el universo Tolkien. Anota tus conexiones antes de que la oscuridad de Lovecraft llegue." },

  // ── Fase 4 · Oscuridad ────────────────────────────────────────────────────
  { week: 25, mangaTitle: "Spawn Integral",  mangaVols: "Vol. 1–2",               novelTitle: "Lovecraft",                 novelSection: "Relatos tempranos",                    tip: "Redención demoníaca y horror cósmico juntos. Spawn y Lovecraft coinciden en que el universo es indiferente." },
  { week: 26, mangaTitle: "Spawn Integral",  mangaVols: "Vol. 3–4",               novelTitle: "Lovecraft",                 novelSection: "Ratas en las paredes + El horror de Red Hook", tip: "Relatos cortos, atmósfera densa. Lovecraft construye miedo con descripción, no con acción." },
  { week: 27, mangaTitle: "Spawn Integral",  mangaVols: "Vol. 5–6",               novelTitle: "Lovecraft",                 novelSection: "En las montañas de la locura (I–VI)",  tip: "La obra maestra de Lovecraft empieza esta semana. Lee de noche si puedes." },
  { week: 28, mangaTitle: "Spawn Integral",  mangaVols: "Vol. 7–8",               novelTitle: "Lovecraft",                 novelSection: "En las montañas de la locura (VII–XII)", tip: "El final de Montañas es inquietante en el sentido correcto: no resuelve, se expande." },
  { week: 29, mangaTitle: "Spawn Integral",  mangaVols: "Vol. 9 (fin)",           novelTitle: "Lovecraft",                 novelSection: "El caso de Charles Dexter Ward (I–III)", tip: "Terminas Spawn. Lovecraft se vuelve narrativo aquí — Charles es su novela más accesible." },
  { week: 30, mangaTitle: "— Pausa —",       mangaVols: "Pre-Vagabond",           novelTitle: "Lovecraft",                 novelSection: "El caso de Charles Dexter Ward (IV–V, fin)", tip: "Semana de transición. Cierra la oscuridad de Lovecraft antes de entrar al silencio de Vagabond." },

  // ── Fase 5 · El Maestro ───────────────────────────────────────────────────
  { week: 31, mangaTitle: "Vagabond",        mangaVols: "Vol. 1",                 novelTitle: "— Vagabond merece toda la atención —", novelSection: "Sin novela",           tip: "El final boss del viaje. Inoue no se lee — se contempla. Sin prisa, sin calendario." },
  { week: 32, mangaTitle: "Vagabond",        mangaVols: "Vol. 2",                 novelTitle: "— Meditación —",            novelSection: "Búsqueda del sentido",                 tip: "¿A qué te recuerda la búsqueda de Musashi? No es retórico — escríbelo en el grimorio." },
  { week: 33, mangaTitle: "Vagabond",        mangaVols: "Vol. 3 (fin)",           novelTitle: "🏁 Fin del Gran Viaje Lector", novelSection: "Fin del viaje",             tip: "No se termina Vagabond, se experimenta. 33 semanas después, ya eres otro lector." },
];

export const INITIAL_ENTRIES = [];

export const DEMO_DATA = {
  books: INITIAL_BOOKS,
  phases: INITIAL_PHASES,
  schedule: INITIAL_SCHEDULE,
  completedWeeks: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  entries: [
    {
      id: "entry-demo-1",
      date: "2026-01-08",
      book: "El Hobbit",
      chapter: "Caps. 1–5",
      mood: "Fluído ✨",
      reingreso: "Primera inmersión en la Comarca. Tolkien construye el mundo hobbit con una calidez desarmante: la descripción del hogar de Bilbo, la despensa llena de jamones y quesos, el mapa en la chimenea. Thorin y su compañía irrumpen en la vida de Bilbo como el caos irrumpe en el orden. La firma de Bilbo en el contrato se siente como un salto al vacío.",
      summary: "En este primer encuentro con el Archivo de Tolkien, exploramos la reticencia del héroe y la irrupción de lo épico en lo doméstico. Bilbo Bolsón, un hobbit antitético a la aventura, se ve impelido por Gandalf a un viaje que cambiará su percepción del mundo y de sí mismo.",
      quotes: [
        "Es una mañana sin salidas cuando uno tiene prisa, y la mañana siguió a la tarde.",
        "Nunca es demasiado tarde para una aventura, aunque la barba haya crecido demasiado."
      ],
      characters: [
        { id: "c-d1", name: "Bilbo Bolsón", tags: ["hobbit", "protagonista", "inesperado"], content: "Hobbit de mediana edad, respetable y amante del orden. Su firma en el contrato es el primer acto de heroísmo inadvertido. Lleva consigo la incomodidad del que sabe que debería quedarse pero no puede." },
        { id: "c-d2", name: "Gandalf el Gris", tags: ["mago", "istari", "manipulador-benévolo"], content: "Aparece sin avisar y reorganiza la vida de Bilbo con una sonrisa. Su selección de Bilbo como ladrón no es aleatoria: ve algo que Bilbo no ve en sí mismo." },
        { id: "c-d3", name: "Thorin Escudo de Roble", tags: ["enano", "rey-en-exilio", "orgulloso"], content: "Heredero del rey bajo la montaña. El orgullo de su estirpe es visible en cada gesto. Desconfía de Bilbo instintivamente. Carga con el peso de un reino perdido." }
      ],
      places: [
        { id: "p-d1", name: "La Comarca", tags: ["hobbiton", "lugar-seguro", "punto-de-partida"], content: "La Comarca es la definición de lo cómodo. Tolkien la pinta con detalle doméstico para que su abandono duela. Las colinas verdes son todo lo que Bilbo perderá al salir." },
        { id: "p-d2", name: "Hogar Bolsón", tags: ["hogar", "símbolo"], content: "La madriguera hobbit como imagen del yo estable antes del viaje. Las habitaciones redondas, la chimenea, la despensa: arquitectura del confort que se rompe con la llegada de los enanos." }
      ],
      glossary: [
        { id: "g-d1", name: "Hobbit", tags: ["raza", "definición"], content: "Pequeños seres de pies peludos y temperamento apacible. Viven en madrigueras-casa. No tienen magia pero sí una resiliencia callada que el narrador deja caer casi sin querer." },
        { id: "g-d2", name: "El Contrato", tags: ["plot-device"], content: "Thorin hace firmar a Bilbo un contrato lleno de cláusulas inquietantes. El gesto es cómico pero marca el punto de no retorno del personaje." }
      ],
      worldRules: [
        { id: "w-d1", name: "Los hobbits detestan las aventuras", content: "Regla social y casi filosófica: la aventura es indecorosa, peligrosa y mal vista. Esto hace que la decisión de Bilbo sea subversiva desde la primera página." }
      ],
      connections: [],
      mangaPanels: []
    },
    {
      id: "entry-demo-2",
      date: "2026-01-10",
      book: "Astroboy",
      chapter: "Tomo 1, caps. 1–4",
      mood: "Emocionado 🔥",
      reingreso: "Tezuka construye a Astroboy con una ternura que duele. El abandono del Dr. Tenma —vender a su propio hijo robot por no ser suficientemente humano— en las primeras páginas es un golpe emocional que no se anuncia. El circo como metáfora de la explotación es brutalista y directo.",
      quotes: [
        "Un robot no puede elegir nacer, pero sí puede elegir qué hace con su existencia.",
        "El poder no sirve de nada si no hay corazón para guiarlo."
      ],
      characters: [
        { id: "c-d4", name: "Astroboy (Atom)", tags: ["robot", "protagonista", "inocente"], content: "Robot con 100.000 caballos de vapor y corazón humano. La tensión entre su poder físico y su inocencia emocional es el motor de la serie. Quiere pertenecer a ambos mundos sin conseguirlo del todo." },
        { id: "c-d5", name: "Dr. Tenma", tags: ["científico", "padre-ausente", "tragedia"], content: "Crea a Astroboy para reemplazar a su hijo muerto. Lo abandona cuando el robot no crece. La frialdad de Tenma es más inquietante que cualquier villano: es el horror de lo cotidiano." }
      ],
      places: [
        { id: "p-d3", name: "Metro City", tags: ["futuro", "japón", "tecnología"], content: "Ciudad futurista donde robots y humanos coexisten con tensión. El diseño de Tezuka mezcla optimismo tecnológico con miedo al futuro." }
      ],
      glossary: [],
      worldRules: [
        { id: "w-d2", name: "Los robots no pueden matar humanos", content: "Ley fundamental del mundo de Astroboy, análoga a las Tres Leyes de Asimov. La serie la rompe y la prueba constantemente para explorar qué significa ser libre." }
      ],
      connections: [],
      mangaPanels: []
    },
    {
      id: "entry-demo-3",
      date: "2026-01-15",
      book: "El Hobbit",
      chapter: "Caps. 6–10",
      mood: "Concentrado 🧠",
      reingreso: "La escena de los acertijos con Gollum es el corazón filosófico del libro. Gollum no es simplemente un monstruo: es una advertencia. La conversación en la oscuridad, las reglas autoimpuestas de los acertijos, la apuesta con la vida como moneda. El anillo aparece casi de casualidad, pero su peso ya se siente.",
      quotes: [
        "¿Qué tengo en el bolsillo? No es un acertijo justo, no es justo.",
        "Mi tesoro... mi precioso..."
      ],
      characters: [
        { id: "c-d6", name: "Gollum / Sméagol", tags: ["criatura", "anillo", "dualidad", "tragedia"], content: "Criatura consumida por el Anillo durante siglos. En El Hobbit aún conserva fragmentos de humanidad en el juego de acertijos. Su furia al perder el anillo es comprensible, casi patética. No es malvado: es lo que el Anillo hace de alguien." }
      ],
      places: [
        { id: "p-d4", name: "Las Montañas Nubladas", tags: ["peligro", "orcos", "oscuridad"], content: "Las cavernas bajo las montañas son un laberinto sin luz. La oscuridad total como escenario de la escena más tensa del libro. El lago subterráneo donde vive Gollum tiene una quietud inquietante." }
      ],
      glossary: [
        { id: "g-d3", name: "El Juego de Acertijos", tags: ["tradición", "reglas", "vida-o-muerte"], content: "Tradición antigua que incluso las criaturas malignas respetan. Los acertijos como contrato moral en la oscuridad: quizás la única ley que Gollum todavía obedece." }
      ],
      worldRules: [
        { id: "w-d3", name: "El Anillo es un agente de corrupción pasiva", content: "El Anillo no hace nada en El Hobbit, pero ya transforma a quien lo toca. Bilbo lo usa para escapar, no para dominar. Aún así, su primer impulso al regresar es matar a Gollum, y se detiene. Esa pausa vale todo." }
      ],
      connections: [],
      mangaPanels: []
    },
    {
      id: "entry-demo-4",
      date: "2026-01-22",
      book: "El Hobbit",
      chapter: "Caps. 11–15",
      mood: "Emocionado 🔥",
      reingreso: "El Bosque Negro es Tolkien en modo pesadilla: las arañas, la sed, la desorientación de los enanos. La prisión de los elfos del bosque tiene su propio código de honor extraño. Bilbo como héroe invisible es una metáfora de la modestia como superpoder. La descripción de Smaug sobre la Montaña Solitaria desde el exterior es épica.",
      quotes: [
        "Las arañas del Bosque Negro tejían sus redes con la paciencia de quienes nunca han tenido prisa.",
        "Smaug se movió. Un ojo, grande como un lago, se abrió lentamente."
      ],
      characters: [
        { id: "c-d7", name: "Thranduil", tags: ["elfo", "rey", "pragmático", "orgulloso"], content: "Rey elfo del Bosque Negro. No es malvado, solo indiferente a causas que no son las suyas. Su hospitalidad es una trampa elegante. Tolkien evita el cliché del elfo sabio y benevolente." },
        { id: "c-d8", name: "Smaug", tags: ["dragón", "antagonista", "inteligente", "vanidad"], content: "Dragón que duerme sobre oro durante décadas. Su inteligencia es más amenazante que su fuego. La conversación con Bilbo invisible es una danza de egos y mentiras. Smaug sabe más de lo que aparenta." }
      ],
      places: [
        { id: "p-d5", name: "El Bosque Negro", tags: ["oscuridad", "peligro", "perderse"], content: "Bosque que absorbe la luz y el sentido de la dirección. Tolkien usa la desorientación como herramienta narrativa: el lector también se pierde junto a los enanos." },
        { id: "p-d6", name: "La Montaña Solitaria (Erebor)", tags: ["objetivo", "reino-perdido", "tesoro"], content: "El punto final del mapa. Su silencio desde el exterior contrasta con el calor de Smaug dentro. Erebor es la promesa y la trampa." }
      ],
      glossary: [],
      worldRules: [
        { id: "w-d4", name: "Los dragones identifican el olor de la codicia", content: "Smaug puede detectar cambios en el tesoro aunque no haya visto la pieza específica. La posesión como sentido animal." }
      ],
      connections: [],
      mangaPanels: []
    },
    {
      id: "entry-demo-5",
      date: "2026-01-25",
      book: "Slam Dunk",
      chapter: "Vol. 1",
      mood: "Emocionado 🔥",
      reingreso: "Inoue arranca con energía pura. Hanamichi es el antihéroe perfecto: completamente inútil en el baloncesto pero con la arrogancia de un campeón. La dinámica con Haruko funciona porque ella ve el potencial antes que él. Los primeros entrenamientos son humillantes pero honestos sobre lo que cuesta aprender algo desde cero.",
      quotes: [
        "Soy un genio. Sakuragi Hanamichi.",
        "El baloncesto me encontró a mí, no al revés."
      ],
      characters: [
        { id: "c-d9", name: "Hanamichi Sakuragi", tags: ["protagonista", "deporte", "orgullo", "crecimiento"], content: "50 rechazos en 3 años. Pelirrojo. Violento. Terco. Y sin embargo Inoue lo hace querible desde la primera página. Su arrogancia es una armadura sobre una fragilidad enorme." },
        { id: "c-d10", name: "Haruko Akagi", tags: ["baloncesto", "motivación"], content: "La razón por la que Hanamichi entra al club. Su admiración genuina por el baloncesto es contagiosa. No es un simple interés amoroso: es la catalizadora de una transformación real." }
      ],
      places: [
        { id: "p-d7", name: "Instituto Shohoku", tags: ["club", "cancha", "crecimiento"], content: "La cancha de Shohoku como espacio de prueba. Inoue la dibuja con detalle deportivo real: la textura del tablero, la distancia de los tiros libres." }
      ],
      glossary: [],
      worldRules: [
        { id: "w-d5", name: "El talento sin técnica es ruido", content: "La premisa física de Sakuragi —altura, atletismo, reflejos— sin fundamentos técnicos es inútil. Slam Dunk es honesto sobre el trabajo que requiere el deporte." }
      ],
      connections: [],
      mangaPanels: []
    },
    {
      id: "entry-demo-6",
      date: "2026-01-29",
      book: "El Hobbit",
      chapter: "Caps. 16–19 (fin)",
      mood: "Fluído ✨",
      reingreso: "La Batalla de los Cinco Ejércitos llega casi como consecuencia inevitable de todos los orgullos acumulados. La muerte de Thorin es el golpe emocional real: después de tanta distancia y desconfianza, la reconciliación con Bilbo al final es dolorosa precisamente por su tardanza. Bilbo regresa a la Comarca diferente, y la Comarca no lo sabe.",
      quotes: [
        "Si más valoraran comida, alegría y canciones sobre el oro, serían una compañía más brillante.",
        "Voy de regreso a casa. Y los caminos de regreso siempre parecen más cortos."
      ],
      characters: [
        { id: "c-d11", name: "Bard el Arquero", tags: ["héroe", "linaje"], content: "Descendiente de Girion de Valle. Mata a Smaug con la flecha negra heredada de su padre." }
      ],
      places: [
        { id: "p-d8", name: "Ciudad del Lago (Esgaroth)", tags: ["pueblo", "humano"], content: "Ciudad sobre el agua gobernada por un Maestro codicioso." }
      ],
      glossary: [
        { id: "g-d4", name: "La Piedra del Arca (Arkenstone)", tags: ["símbolo", "tesoro"], content: "El corazón de la Montaña. Para Thorin es legítimamente suya." }
      ],
      worldRules: [
        { id: "w-d6", name: "El oro de los dragones envenenana el corazón de quien lo posee", content: "Enfermedad del dragón: la riqueza acumulada pudre la voluntad." }
      ],
      connections: [],
      mangaPanels: []
    },
    {
      id: "entry-demo-7",
      date: "2026-02-05",
      book: "La Comunidad del Anillo",
      chapter: "Libro I",
      mood: "Concentrado 🧠",
      reingreso: "La apertura de ESDLA tiene un ritmo completamente diferente a El Hobbit. Tolkien tarda en poner el mundo en movimiento pero el peso de lo que viene se siente desde la fiesta de Bilbo. Frodo como heredero forzado de una responsabilidad que no pidió.",
      quotes: [
        "No todo el que vaga está perdido.",
        "El Anillo no puede permanecer oculto para siempre."
      ],
      characters: [
        { id: "c-d12", name: "Frodo Bolsón", tags: ["hobbit", "portador"], content: "Heredero del Anillo por accidente de parentesco. Más reflexivo que Bilbo." },
        { id: "c-d13", name: "Aragorn / Trancos", tags: ["ranger", "human"], content: "Aparece en Bree como mendigo sucio. La brecha entre lo que parece y lo que es define al personaje." }
      ],
      places: [
        { id: "p-d9", name: "Bree", tags: ["pueblo", "punto-de-interés"], content: "Primera ciudad humana que ven los hobbits. El Poney Pisador como espacio de transición." }
      ],
      glossary: [],
      worldRules: [],
      connections: [
        { id: "conn-d1", bookTitles: ["El Hobbit"], description: "Gollum en El Hobbit aparece como una criatura patética pero con humanidad residual. Al llegar a ESDLA ya es rastreador activo de Sauron. La misma criatura, décadas después, completamente consumida. La progresión es aterradora." }
      ],
      mangaPanels: []
    },
    {
      id: "entry-demo-8",
      date: "2026-02-07",
      book: "Naruto Gold",
      chapter: "Vol. 1",
      mood: "Fluído ✨",
      reingreso: "Kishimoto arranca con un protagonista que quiere ser visto. El gag de la clonación fallida en el examen es simple, pero la imagen de Naruto solo en el columpio mientras el resto del pueblo celebra lo dice todo sin diálogo. El sistema ninja tiene una lógica interna sólida desde el primer capítulo.",
      quotes: [
        "¡Creeré en mí mismo cuando nadie más lo haga!",
        "El camino del ninja es el camino de superar tus límites, aunque te partan en dos."
      ],
      characters: [
        { id: "c-d15", name: "Naruto Uzumaki", tags: ["protagonista", "jinchuriki", "reconocimiento", "determinación"], content: "Huérfano portador del Zorro de Nueve Colas. Todo el mundo lo evita pero él quiere que todo el mundo lo vea. La motivación de ser Hokage no es ambición de poder: es hambre de respeto." },
        { id: "c-d16", name: "Sasuke Uchiha", tags: ["rival", "venganza", "genio", "trauma"], content: "El único sobreviviente de la masacre Uchiha. Genio natural que vive para la venganza. La frialdad de Sasuke es una máscara sobre un dolor que Kishimoto muestra solo en destellos." },
        { id: "c-d17", name: "Kakashi Hatake", tags: ["sensei", "copiador", "complejo", "sharingan"], content: "El sensei que llega tarde y lee Icha Icha Paradise durante los exámenes. Pero debajo hay alguien que ha perdido todo lo que amaba y sigue de pie. Un héroe roto funcionando a plena capacidad." }
      ],
      places: [
        { id: "p-d11", name: "Konoha (Aldea Oculta de la Hoja)", tags: ["aldea", "hogar", "shinobi"], content: "La aldea como entidad con memoria y trauma propios. El monte Hokage, los murales, la academia ninja: Kishimoto construye una ciudad con historia visible en su arquitectura." }
      ],
      glossary: [
        { id: "g-d6", name: "Chakra", tags: ["energía", "sistema-ninja", "naturaleza"], content: "Energía que fluye del espíritu y el cuerpo mezclados. El chakra como sistema de magia con reglas físicas reales: se agota, se entrena, tiene naturalezas elementales. Más riguroso que la mayoría de los sistemas mágicos del género." }
      ],
      worldRules: [
        { id: "w-d8", name: "El Jinchuriki es arma antes que persona", content: "Los contenedores de bestias con cola son tratados por sus aldeas como armas vivas. Naruto es la ilustración más clara: el pueblo lo teme y lo necesita al mismo tiempo. La contradicción define su existencia entera." }
      ],
      connections: [],
      mangaPanels: []
    },
    {
      id: "entry-demo-9",
      date: "2026-02-12",
      book: "La Comunidad del Anillo",
      chapter: "Libro II — Moria y Lothlórien",
      mood: "Emocionado 🔥",
      reingreso: "Moria es Tolkien en modo catedral oscura. La escena del tambor, el puente de Khazad-dûm, la caída de Gandalf: todo tiene peso arquitectónico. Lothlórien como inversión total: luz inmóvil, tiempo detenido, Galadriel como espejo que muestra lo que temes saber. La despedida de la Comunidad en el Anduin es perfecta.",
      quotes: [
        "No pasarás.",
        "Incluso los muy sabios no pueden ver todos los finales."
      ],
      characters: [
        { id: "c-d18", name: "Galadriel", tags: ["élfa", "sabia", "portadora-de-Nenya", "tentación"], content: "Señora de Lothlórien. Rechaza el Anillo cuando Frodo se lo ofrece. Su tentación es explícita y aterradora: sabe exactamente qué haría con él. Esa auto-consciencia es lo que la salva." },
        { id: "c-d19", name: "Boromir", tags: ["humano", "Gondor", "debilidad", "redención"], content: "El único miembro mortal de la Comunidad sin poderes especiales. Su deseo del Anillo es completamente comprensible: quiere salvar a su pueblo. La tentación de Boromir es la tentación humana por excelencia." }
      ],
      places: [
        { id: "p-d12", name: "Moria (Khazad-dûm)", tags: ["enanos", "oscuridad", "caída", "gloria-perdida"], content: "Las minas de Moria como ruina de una civilización. Los enanos excavaron demasiado profundo y encontraron algo que no debían. La oscuridad de Moria no es metafórica: es concreta, fría y habitada." },
        { id: "p-d13", name: "Lothlórien", tags: ["elfo", "tiempo-detenido", "luz", "despedida"], content: "Bosque donde el tiempo no pasa igual. Los árboles mallorn, la plataforma de los Galadrim: Tolkien describe Lothlórien como un sueño que sabe que terminará." }
      ],
      glossary: [
        { id: "g-d7", name: "El Balrog de Moria", tags: ["maiar", "fuego", "sombra"], content: "Durin's Bane. Un Maiar corrupto, igual en naturaleza a Gandalf pero del lado opuesto. Su batalla con Gandalf no es solo física: es una guerra de voluntades entre seres de la misma especie." }
      ],
      worldRules: [
        { id: "w-d9", name: "Los Istari no pueden dominar por la fuerza", content: "Los magos fueron enviados para guiar y aconsejar, no para gobernar. Saruman rompe esta regla y Gandalf la respeta. La caída de Saruman empieza cuando decide que él sabe mejor que los demás." }
      ],
      connections: [
        { id: "conn-d2", bookTitles: ["Naruto Gold"], description: "Boromir intenta tomar el Anillo de Frodo convencido de que lo usaría para el bien. Gaara en Naruto demuestra el mismo patrón: el poder concentrado en uno solo, incluso con buenas intenciones, destruye. El Anillo y el chakra de la bestia de cola son análogos como corruptores." }
      ],
      mangaPanels: []
    },
    {
      id: "entry-demo-10",
      date: "2026-02-14",
      book: "Naruto Gold",
      chapter: "Vol. 2 — Exámenes Chunin",
      mood: "Concentrado 🧠",
      reingreso: "Los exámenes chunin son el arco de diseño de mundo más denso hasta ahora. El Bosque de la Muerte como terreno de prueba diseñado para matar: la crueldad institucionalizada de los ninja se vuelve visible. La aparición de Orochimaru cambia el tono de la serie. Ya no es una historia de adolescentes en academia.",
      quotes: [
        "El miedo es necesario. Sin miedo no hay valentía.",
        "Orochimaru no tiene ojos para la compasión. Solo tiene ojos para el poder."
      ],
      characters: [
        { id: "c-d20", name: "Orochimaru", tags: ["villano", "conocimiento", "inmortalidad", "serpiente"], content: "Científico ninja obsesionado con dominar todas las técnicas y vivir eternamente. Es el anti-Sandaime: mismo origen, decisiones opuestas. La comparación hace al villano más interesante que la mayoría." },
        { id: "c-d21", name: "Gaara", tags: ["jinchuriki", "arena", "soledad", "trauma"], content: "Jinchuriki de Shukaku. No conoce el amor, solo el miedo de los demás. En este arco todavía es puro terror. La historia de su infancia no se cuenta aún pero se intuye en cada expresión." }
      ],
      places: [
        { id: "p-d14", name: "El Bosque de la Muerte", tags: ["examen", "peligro", "selección"], content: "Zona de entrenamiento del examen chunin. 44 arenas diseñadas para que los candidatos se eliminen entre sí. La violencia institucionalizada como parte del curriculum ninja." }
      ],
      glossary: [
        { id: "g-d8", name: "Cursed Seal (Sello Maldito)", tags: ["orochimaru", "poder", "corrupción"], content: "Sello que Orochimaru implanta en Sasuke. Da poder a cambio de autonomía. La metáfora del pacto faustiano en formato ninja." }
      ],
      worldRules: [
        { id: "w-d10", name: "Los chunin evalúan liderazgo, no solo fuerza", content: "El examen no es solo de combate: evalúa quién sobrevive bajo presión, quién toma decisiones por su equipo. Esta capa táctica separa Naruto de otros shonens contemporáneos." }
      ],
      connections: [],
      mangaPanels: []
    },
    {
      id: "entry-demo-11",
      date: "2026-02-19",
      book: "Las Dos Torres",
      chapter: "Libro III — Rohan y los Ents",
      mood: "Fluído ✨",
      reingreso: "Tolkien divide la narrativa y el experimento funciona. Rohan tiene una textura diferente a Gondor o la Comarca: más anglosajona, más de poema épico. Bárbol y los Ents son la imagen más hermosa del libro: seres que piensan en siglos, hablan en días. El Entmoot como proceso democrático de los más lentos posible. La toma de Isengard es catártica.",
      quotes: [
        "No seas precipitado. Esa es la primera y última enseñanza de los Ents.",
        "Rohan ha sangrado por el mundo libre más de lo que el mundo libre sabe."
      ],
      characters: [
        { id: "c-d22", name: "Bárbol (Treebeard)", tags: ["ent", "guardián", "memoria", "lento"], content: "El ser más viejo de la Tierra Media aún con nombre. Su rabia final contra Saruman es más poderosa por lo que tardó en llegar: los Ents no se apresuran, pero cuando actúan, son inevitables." },
        { id: "c-d23", name: "Théoden", tags: ["rey", "Rohan", "envenenado", "redención"], content: "Rey de Rohan bajo el hechizo de Gríma y Saruman. Su despertar con Gandalf es uno de los momentos más satisfactorios de la trilogía. Un rey que recupera su voluntad." }
      ],
      places: [
        { id: "p-d15", name: "Fangorn (Bosque de Fangorn)", tags: ["ents", "antiguo", "peligro"], content: "El bosque más viejo de la Tierra Media. Oscuro, vivo, con memoria. Tolkien lo usa para mostrar que la naturaleza no es neutral: puede cansarse de ser ignorada." },
        { id: "p-d16", name: "Edoras", tags: ["Rohan", "mead-hall", "viento"], content: "Capital de Rohan. La sala dorada de Meduseld en la cima de la colina. Todo en Edoras evoca la cultura anglosajona que Tolkien amaba: el mead, la poesía oral, la lealtad al señor de guerra." }
      ],
      glossary: [
        { id: "g-d9", name: "El Entmoot", tags: ["democracia", "ents", "decisión"], content: "Reunión de Ents para decidir si actúan contra Isengard. Dura tres días porque los Ents no dicen en una palabra lo que puede decirse en tres. La ironía tolkieniana en estado puro." }
      ],
      worldRules: [
        { id: "w-d11", name: "Los Ents son guardianes, no guerreros", content: "Los Ents protegen el bosque, no hacen guerras. Solo cuando Saruman destruye Fangorn se convierten en ejército. La diferencia entre defensa y agresión en el mundo de Tolkien tiene peso moral." }
      ],
      connections: [],
      mangaPanels: []
    },
    {
      id: "entry-demo-12",
      date: "2026-02-22",
      book: "Naruto Gold",
      chapter: "Vol. 3 — Finales de los Exámenes",
      mood: "Emocionado 🔥",
      reingreso: "El combate de Lee contra Gaara es el mejor del manga hasta este punto. Kishimoto tiene el coraje de hacer perder al personaje más querible del arco. El sacrificio de los pesos de Lee y su derrota hacen lo que ninguna victoria hubiera logrado: hacen al lector entender qué cuesta ser ninja cuando no tienes chakra especial.",
      quotes: [
        "Si no puedo ganar con el trabajo duro, entonces no merezco ganar.",
        "Gaara no llora. Gaara no puede llorar. Eso es lo más triste de todo."
      ],
      characters: [
        { id: "c-d24", name: "Rock Lee", tags: ["esfuerzo", "sin-ninjutsu", "determinación"], content: "Ninja que no puede usar ninjutsu ni genjutsu. Solo taijutsu. La imposibilidad de su premisa es la fuente de toda su motivación. Perder contra Gaara después de todo su esfuerzo es un golpe narrativo real." }
      ],
      places: [],
      glossary: [
        { id: "g-d10", name: "Los Ocho Portones (Hachimon Tonkō)", tags: ["taijutsu", "límite", "cuerpo"], content: "Técnica que elimina los limitadores fisiológicos del cuerpo a cambio de daño permanente. Rock Lee la usa para tener una oportunidad contra Gaara. El precio es su carrera como ninja." }
      ],
      worldRules: [
        { id: "w-d12", name: "En el mundo ninja, el resultado importa más que el método", content: "Gaara gana. Lee pierde. El esfuerzo no es garantía de victoria. Kishimoto se niega al final feliz fácil y hace a la serie más honesta sobre el mundo real." }
      ],
      connections: [
        { id: "conn-d3", bookTitles: ["La Comunidad del Anillo"], description: "Gaara y Boromir comparten el mismo arco de corrupción por aislamiento. Boromir busca el Anillo porque nadie más defenderá Gondor. Gaara mata porque nadie en su infancia le enseñó otra forma de existir. El daño hecho en soledad se convierte en daño extendido a los demás." }
      ],
      mangaPanels: []
    },
    {
      id: "entry-demo-13",
      date: "2026-03-05",
      book: "Las Dos Torres",
      chapter: "Libro IV — Gollum, Frodo y Sam",
      mood: "Concentrado 🧠",
      reingreso: "La narrativa de Gollum como guía es lo mejor de Las Dos Torres. La dualidad Sméagol/Gollum se hace explícita por primera vez. Sam desconfía absolutamente de Gollum, Frodo tiene compasión. Los dos tienen razón. La escena de Gollum mirando a Frodo dormir, casi recuperando algo de sí mismo, antes de escuchar a Sam insultarle es devastadoramente trágica.",
      quotes: [
        "La compasión de Bilbo puede ser lo que salve al mundo.",
        "Sméagol quiere ayudar al amo bueno. Sí, sí."
      ],
      characters: [],
      places: [
        { id: "p-d17", name: "Las Ciénagas de los Muertos", tags: ["horror", "muertos", "espejo"], content: "Pantano donde los rostros de los caídos en la batalla del Gladden aparecen bajo el agua. Gollum sabe navegar por él. El horror de Tolkien aquí es arqueológico: los muertos no desaparecen, persisten como imágenes." },
        { id: "p-d18", name: "Cirith Ungol", tags: ["araña", "traición", "oscuridad"], content: "El paso que Gollum guía a Frodo. No es el camino más corto: es el más peligroso y Gollum lo sabe. La traición ya está en movimiento pero el lector la ve antes que los personajes." }
      ],
      glossary: [],
      worldRules: [
        { id: "w-d13", name: "El Anillo personaliza la tentación", content: "El Anillo no ofrece lo mismo a todos: a Gollum le ofrece recuperar lo perdido, a Boromir le ofrece poder para proteger, a Frodo le ofrece una salida fácil. Es una trampa diseñada para cada debilidad específica." }
      ],
      connections: [
        { id: "conn-d4", bookTitles: ["El Hobbit"], description: "Gollum en El Hobbit es un adversario en una partida de acertijos. En Las Dos Torres es guía, traidor y espejo moral. El mismo personaje, cincuenta años después, completamente diferente y completamente igual. La tragedia de Sméagol es que la semilla de su perdición ya estaba en el Bilbo del primer libro." }
      ],
      mangaPanels: []
    },
    {
      id: "entry-demo-14",
      date: "2026-03-14",
      book: "Naruto Gold",
      chapter: "Vol. 4 — Invasión de Konoha",
      mood: "Emocionado 🔥",
      reingreso: "La invasión de Konoha por Orochimaru cambia la escala de la serie. Ya no es sobre hacerse chunin: es sobre la supervivencia de la aldea. La muerte del Sandaime Hokage es el primer momento en que Naruto toma conciencia de la mortalidad real. Orochimaru como némesis gana sentido: no es malvado por placer, es malvado por terror a morir.",
      quotes: [
        "El Hokage protege la aldea con su vida. Siempre fue así y siempre lo será.",
        "¿Por qué seguir viviendo si no hay nadie que te quiera? —Gaara."
      ],
      characters: [
        { id: "c-d25", name: "Sandaime Hokage (Hiruzen Sarutobi)", tags: ["sacrificio", "maestro", "vejez", "voluntad"], content: "El Profesor. El único que puede combatir a Orochimaru de igual a igual. Su muerte es la primera de peso real en la serie: Kishimoto cierra el arco del mentor con dignidad y sin trampa." }
      ],
      places: [],
      glossary: [
        { id: "g-d11", name: "Fūin Jutsu: Shiki Fūjin (Sellado del Rey Demonio)", tags: ["jutsu-sellado", "sacrificio", "muerte"], content: "Técnica que invoca al Rey Demonio para sellar el alma del objetivo a cambio del alma del usuario. El Sandaime la usa para sellar los brazos de Orochimaru. El costo es absoluto." }
      ],
      worldRules: [],
      connections: [],
      mangaPanels: []
    },
    {
      id: "entry-demo-15",
      date: "2026-03-15",
      book: "El Retorno del Rey",
      chapter: "Libro V — Minas Tirith y Pelennor",
      mood: "Emocionado 🔥",
      reingreso: "La escala de Pelennor es Tolkien llevando lo épico a su límite. Pero lo que me queda no es la batalla: es Éowyn y Merry. Dos personajes que no deberían estar ahí según las reglas del mundo. El Nazgûl diciendo que ningún hombre puede matarle y la respuesta de Éowyn es uno de los momentos más satisfactorios de la literatura fantástica. El detalle: fue un hobbit quien lo hizo posible.",
      quotes: [
        "Soy ningún hombre.",
        "El Señor de los Nazgûl no conoce el miedo. Pero no conoció a Merry Brandybuck."
      ],
      characters: [
        { id: "c-d26", name: "Éowyn", tags: ["Rohan", "mujer-guerrera", "disfraz", "valentía"], content: "Sobrina de Théoden. Va a la batalla disfrazada porque ningún hombre la llevaría. Su encuentro con el Nazgûl es el momento más preciso de la trilogía: la profecía encuentra su loophole exacto en la persona exacta." }
      ],
      places: [
        { id: "p-d19", name: "Minas Tirith", tags: ["Gondor", "ciudad-blanca", "resistencia"], content: "La ciudad de siete niveles. El asedio de Minas Tirith es arquitectura y guerra al mismo tiempo. Tolkien describe el ataque con detalle militar que hace honor a su experiencia en la Primera Guerra Mundial." }
      ],
      glossary: [],
      worldRules: [],
      connections: [],
      mangaPanels: []
    },
    {
      id: "entry-demo-16",
      date: "2026-03-16",
      book: "Naruto Gold",
      chapter: "Vol. 5 — Entrenamiento con Jiraiya",
      mood: "Fluído ✨",
      reingreso: "Jiraiya entra como el sensei ideal: gamberro, impredecible, pero profundamente capaz. El entrenamiento de Naruto con el Rasengan durante un mes condensa todo el arco de Naruto en miniatura: imposible al principio, conquistado por terquedad pura. La dinámica padre-hijo entre Jiraiya y Naruto funciona porque Jiraiya no lo dice pero lo hace evidente.",
      quotes: [
        "Un ninja que abandona a sus compañeros es peor que basura. Pero un ninja que abandona la misión para salvar a sus compañeros es aún peor... o no. No lo sé.",
        "Rasengan. La forma perfecta del chakra. La cima del Yondaime. Y yo la aprenderé."
      ],
      characters: [
        { id: "c-d27", name: "Jiraiya (el Sapo Ermitaño)", tags: ["sensei", "ermitaño", "escritor", "padre-sustituto"], content: "Discípulo del Sandaime y maestro del Yondaime. Escribe novelas de adultos y entrena al protagonista del próximo ciclo. Su alegría de vivir contrasta con una tristeza profunda que aparece en momentos clave." }
      ],
      places: [],
      glossary: [
        { id: "g-d12", name: "Rasengan", tags: ["jutsu", "rotación-de-chakra", "Yondaime"], content: "Esfera de chakra giratoria que Minato Namikaze perfeccionó en tres años. Jiraiya entrena a Naruto para aprenderla en un mes. La técnica como herencia del padre que Naruto no sabe que tiene." }
      ],
      worldRules: [],
      connections: [],
      mangaPanels: []
    },
    {
      id: "entry-demo-17",
      date: "2026-03-17",
      book: "El Retorno del Rey",
      chapter: "Libro VI — El Monte del Destino",
      mood: "Concentrado 🧠",
      reingreso: "El final del viaje de Frodo y Sam es agotamiento puro. Tolkien no romantiza el heroísmo aquí: Sam carga a Frodo porque Frodo ya no puede cargar nada. La decisión de Gollum de intentar recuperar el Anillo en el Monte del Destino no es accidente: es el resultado inevitable de todo lo que ocurrió antes. El bien se hace a veces sin intención.",
      quotes: [
        "Voy a llevarte, Sr. Frodo. Aunque no sepa el camino.",
        "No lo haré. No lo haré. Pero el Anillo mío, sí, nuestro, sí, ¡precioso!"
      ],
      characters: [
        { id: "c-d28", name: "Samwise Gamgee", tags: ["hobbit", "lealtad", "héroe-real", "jardín"], content: "Sam es el héroe de la historia. Tolkien lo sabía. Gandalf lo sabía. Sam no. Esa ignorancia de su propio heroísmo es su rasgo más hermoso. La lealtad sin condición como fuerza más pura que el poder." }
      ],
      places: [
        { id: "p-d20", name: "Monte del Destino (Orodruin)", tags: ["destrucción", "anillo", "final", "Mordor"], content: "El único lugar donde el Anillo puede destruirse. Tolkien hace que el viaje sea tan difícil que cuando llegan, el lector también está agotado. La geografía como personaje." }
      ],
      glossary: [],
      worldRules: [
        { id: "w-d14", name: "El Anillo no puede destruirse por voluntad propia del portador", content: "Frodo no puede arrojar el Anillo. Nadie que lo haya portado puede. La redención llega por Gollum, que actúa por codicia y hace el bien sin quererlo. Tolkien sobre el Providence: el bien puede usar instrumentos que no lo merecen." }
      ],
      connections: [
        { id: "conn-d5", bookTitles: ["El Hobbit", "Naruto Gold"], description: "Gollum como agente involuntario del bien en El Retorno del Rey conecta con la idea de Naruto de que la redención es posible incluso para los más dañados. Gollum no se redime, pero su acción redime el mundo. Naruto busca redimir activamente a los que el sistema descartó (Gaara, Nagato, Obito). Filosofías opuestas sobre si el pasado puede perdonarse." }
      ],
      mangaPanels: []
    },
    {
      id: "entry-demo-18",
      date: "2026-03-18",
      book: "Naruto Gold",
      chapter: "Vol. 6 — Sasuke vs Itachi (preparación)",
      mood: "Concentrado 🧠",
      reingreso: "Kishimoto lleva toda la serie hasta este punto hacia Sasuke. El arco de recuperación de Sasuke después de la batalla con Gaara es un respiro necesario. Pero la sombra de Itachi lo cubre todo. Cada escena de Sasuke entrenando es en realidad una escena sobre lo que Itachi hizo y por qué. El flashback de la masacre es inminente y el manga lo demora magistralmente.",
      quotes: [
        "Itachi. Ese nombre es mi razón de existir.",
        "El odio que no tiene destino se convierte en fuego que quema al que lo porta."
      ],
      characters: [
        { id: "c-d29", name: "Itachi Uchiha", tags: ["ausente", "misterio", "Akatsuki", "hermano"], content: "Solo aparece en flashbacks y menciones hasta ahora, pero su presencia lo domina todo. El crimen de Itachi contra el clan es la herida central de Sasuke. La audiencia sabe menos que Sasuke sobre los motivos, y esa asimetría de información es pura tensión." }
      ],
      places: [],
      glossary: [],
      worldRules: [],
      connections: [],
      mangaPanels: []
    }
  ]
};

export const MOODS = ["Concentrado 🧠", "Fluído ✨", "Emocionado 🔥", "Cansado 😴", "Distraído 💭"];

export const SECTION_TYPES = [
  { id: "quote", label: "Frases", emoji: "⭐", color: "#D4AF37" },
  { id: "character", label: "Personajes", emoji: "👤", color: "#7C3AED" },
  { id: "place", label: "Lugares", emoji: "📍", color: "#0891B2" },
  { id: "world", label: "Reglas Mundanas", emoji: "📜", color: "#16A34A" },
  { id: "glossary", label: "Glosario / Dudas", emoji: "📖", color: "#DC2626" },
  { id: "connection", label: "Conexiones", emoji: "🔗", color: "#78716C" }
];
