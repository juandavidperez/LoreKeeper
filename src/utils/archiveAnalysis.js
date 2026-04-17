/**
 * Analyzes the archive to find "gaps" or "loose threads".
 * @param {object} archive - Collected entities from the state
 * @returns {object} - Categorized gaps
 */
export function analyzeArchive(archive) {
  const gaps = {
    forgotten: [], // Entities with very few mentions
    mystery: [],   // Entities with no tags or description context
    orphan: [],    // Entities that don't appear in entries with others (harder to detect here, but we'll try)
  };

  const categories = ['personajes', 'lugares', 'reglas', 'glosario'];

  categories.forEach(cat => {
    (archive[cat] || []).forEach(entity => {
      // check for "forgotten" (1 or fewer mentions)
      if (!entity.mentions || entity.mentions.length <= 1) {
        gaps.forgotten.push({ name: entity.name, type: cat });
      }

      // check for "mystery" (no tags)
      if (!entity.tags || entity.tags.length === 0) {
        gaps.mystery.push({ name: entity.name, type: cat });
      }
    });
  });

  return gaps;
}

/**
 * Formats gaps into a textual context for the AI prompt.
 */
export function getAnalysisPrompt(archive) {
  const gaps = analyzeArchive(archive);
  
  let context = "He analizado los anales y he encontrado los siguientes hilos sueltos:\n";
  
  if (gaps.forgotten.length > 0) {
    context += `- Entidades casi olvidadas (pocas menciones): ${gaps.forgotten.slice(0, 5).map(e => e.name).join(', ')}\n`;
  }
  
  if (gaps.mystery.length > 0) {
    context += `- Entidades envueltas en misterio (sin etiquetas descriptivas): ${gaps.mystery.slice(0, 5).map(e => e.name).join(', ')}\n`;
  }

  if (gaps.forgotten.length === 0 && gaps.mystery.length === 0) {
    context = "El archivo parece estar en perfecto equilibrio, pero siempre hay nuevas historias por forjar.";
  }

  return context;
}
