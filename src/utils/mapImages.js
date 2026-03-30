const CHARACTER_ASSETS = {
  monster:  '/assets/map/characters/primal_monster.png',
  antihero: '/assets/map/characters/primal_antihero.png',
  master:   '/assets/map/characters/primal_master.png',
  scholar:  '/assets/map/characters/primal_scholar.png',
  hero:     '/assets/map/characters/primal_hero.png',
  warrior:  '/assets/map/characters/primal_warrior.png',
  creature: '/assets/map/characters/primal_creature.png',
  person:   '/assets/map/characters/primal_person.png',
}

const LANDMARK_ASSETS = {
  castle:  '/assets/map/landmarks/primal_castle.png',
  forest:  '/assets/map/landmarks/primal_forest.png',
  mountain:'/assets/map/landmarks/primal_mountain.png',
  ruins:   '/assets/map/landmarks/primal_ruins.png',
  village: '/assets/map/landmarks/primal_village.png',
  town:    '/assets/map/landmarks/primal_town.png',
  city:    '/assets/map/landmarks/primal_city_modern.png',
  shinobi: '/assets/map/landmarks/primal_village_shinobi.png',
  school:  '/assets/map/landmarks/primal_school.png',
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(src)
    img.onerror = () => reject(new Error(`No se pudo cargar: ${src}`))
    img.src = src
  })
}

let cache = null

/** Preloads all map images into the browser cache. */
export async function loadMapAssets() {
  if (cache) return cache

  await Promise.all([
    ...Object.values(CHARACTER_ASSETS),
    ...Object.values(LANDMARK_ASSETS),
  ].map(loadImage))

  cache = { characters: CHARACTER_ASSETS, landmarks: LANDMARK_ASSETS }
  return cache
}

// ─── Archetype detection ───────────────────────────────────────────────────

// ── Tag-based detection (primary) ─────────────────────────────────────────
// Order matters: more specific archetypes checked first

const ARCHETYPES_BY_TAG = [
  { keywords: ['jefe', 'deidad', 'terror', 'colosal', 'entidad', 'dios', 'bijuu'],               archetype: 'monster'  },
  { keywords: ['oscuro', 'venganza', 'solitario', 'gris', 'renegado', 'mercenario'],              archetype: 'antihero' },
  { keywords: ['mentor', 'sensei', 'guía', 'autoridad', 'leyenda', 'capitán'],                    archetype: 'master'   },
  { keywords: ['intelecto', 'estrategia', 'investigador', 'conocimiento', 'bibliotecario'],        archetype: 'scholar'  },
  { keywords: ['protagonista', 'elegido', 'viajero', 'esperanza', 'aventurero'],                  archetype: 'hero'     },
  { keywords: ['tanque', 'combate', 'soldado', 'escudero', 'caballero', 'defensor'],              archetype: 'warrior'  },
  { keywords: ['bestia', 'animal', 'esbirro', 'horda', 'invocación', 'mascota'],                  archetype: 'creature' },
  { keywords: ['civil', 'npc', 'soporte', 'humano', 'aldeano', 'víctima'],                        archetype: 'person'   },
]

// ── Name-based detection (fallback when no matching tags) ─────────────────
// Partial match — "smaug" matches "Smaug el Dorado", etc.

const ARCHETYPES_BY_NAME = [
  { names: ['kyubi', 'kyuubi', 'kurama', 'smaug', 'cthulhu', 'envidia', 'fafnir', 'leviatán'],   archetype: 'monster'  },
  { names: ['sasuke', 'scar', 'spawn', 'codicia', 'vegeta', 'zuko'],                              archetype: 'antihero' },
  { names: ['gandalf', 'kakashi', 'jiraiya', 'mustang', 'dumbledore', 'iroh', 'yoda'],            archetype: 'master'   },
  { names: ['shikamaru', 'elrond', 'hermione', 'near', 'light yagami'],                           archetype: 'scholar'  },
  { names: ['frodo', 'naruto', 'edward', 'astroboy', 'goku', 'luffy', 'ichigo'],                  archetype: 'hero'     },
  { names: ['thorin', 'bard', 'boromir', 'itachi', 'alphonse', 'erza', 'levi', 'guts'],           archetype: 'warrior'  },
  { names: ['gollum', 'sméagol', 'pakkun', 'huargo', 'toothless'],                                archetype: 'creature' },
]

export function getCharacterArchetype(tags = [], name = '') {
  const lowerTags = tags.map(t => t.toLowerCase().replace('#', ''))
  const lowerName = name.toLowerCase()

  // 1. Tags first
  for (const { keywords, archetype } of ARCHETYPES_BY_TAG) {
    if (keywords.some(k => lowerTags.some(t => t.includes(k)))) return archetype
  }

  // 2. Name fallback
  for (const { names, archetype } of ARCHETYPES_BY_NAME) {
    if (names.some(n => lowerName.includes(n))) return archetype
  }

  return 'person'
}

// ─── Landmark type detection ───────────────────────────────────────────────

const LANDMARK_TYPES = [
  { keywords: ['castillo', 'fortaleza', 'ciudadela', 'palacio', 'castle', 'fortress'], type: 'castle' },
  { keywords: ['bosque', 'selva', 'arboleda', 'floresta', 'forest', 'jungle'], type: 'forest' },
  { keywords: ['montaña', 'cumbre', 'pico', 'cordillera', 'mountain', 'peak'], type: 'mountain' },
  { keywords: ['ruinas', 'antiguo', 'abandonado', 'templo', 'ruins', 'temple'], type: 'ruins' },
  { keywords: ['ciudad', 'metrópolis', 'capital', 'city'], type: 'city' },
  { keywords: ['escuela', 'academia', 'instituto', 'gimnasio', 'school', 'academy'], type: 'school' },
  { keywords: ['konoha', 'shinobi', 'ninja', 'aldea ninja'], type: 'shinobi' },
  { keywords: ['pueblo', 'villa', 'town', 'barrio'], type: 'town' },
]

export function getLandmarkType(name = '', tags = []) {
  const lowerTags = tags.map(t => t.toLowerCase())
  const lowerName = name.toLowerCase()
  for (const { keywords, type } of LANDMARK_TYPES) {
    if (keywords.some(k => lowerTags.some(t => t.includes(k)) || lowerName.includes(k))) return type
  }
  return 'village'
}
