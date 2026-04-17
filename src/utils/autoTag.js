/**
 * Scans text to detect mentions of existing entities from the archive.
 * @param {string} htmlContent - The content from TipTap (HTML)
 * @param {object} archive - The archive object containing personnages, lugares, etc.
 * @returns {object} - Lists of detected entities categories.
 */
export function autoTag(htmlContent, archive) {
  const detected = {
    characters: [],
    places: [],
    glossary: [],
    worldRules: []
  };

  if (!htmlContent || !archive) return detected;

  // Strip HTML tags for cleaner text matching
  const cleanText = htmlContent.replace(/<[^>]*>/g, ' ');

  // Mapping from Archive categories to Form categories
  const categories = [
    { archiveKey: 'personajes', formKey: 'characters' },
    { archiveKey: 'lugares', formKey: 'places' },
    { archiveKey: 'glosario', formKey: 'glossary' },
    { archiveKey: 'reglas', formKey: 'worldRules' }
  ];

  categories.forEach(({ archiveKey, formKey }) => {
    const entities = archive[archiveKey] || [];
    
    entities.forEach(entity => {
      // Escaping special characters in entity name for Regex
      const escapedName = entity.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // We look for the name with word boundaries. 
      // Note: \b doesn't always work well with non-ASCII characters (acentos).
      // We'll use a safer boundary check: (start|space|punctuation) name (end|space|punctuation)
      const regex = new RegExp(`(^|[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ])(${escapedName})($|[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ])`, 'gi');
      
      if (regex.test(cleanText)) {
        detected[formKey].push({
          name: entity.name,
          // We can carry over tags if they exist in the archive
          tags: entity.tags || [],
          source: 'autotag'
        });
      }
    });
  });

  return detected;
}
