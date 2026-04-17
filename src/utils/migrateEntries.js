/**
 * migrates plain text entries to markdown by bolding detected entities.
 * @param {object} entry - The journal entry
 * @param {object} archive - Collected entities from the entire state
 * @returns {object} - The migrated entry
 */
export function migrateEntry(entry, archive) {
  if (entry.migrated) return entry; // Already processed

  const allEntities = [
    ...(archive.personajes || []),
    ...(archive.lugares || []),
    ...(archive.glosario || []),
    ...(archive.reglas || [])
  ];

  if (allEntities.length === 0) return entry;

  // Sort by length descending to match "Hokage de Konoha" before "Konoha"
  const sortedEntities = [...allEntities].sort((a, b) => b.name.length - a.name.length);

  const processText = (text) => {
    if (!text || typeof text !== 'string') return text;
    let result = text;
    sortedEntities.forEach(entity => {
      const escapedName = entity.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?<!\\*\\*)(^|[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ])(${escapedName})($|[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ])(?!\\*\\*)`, 'gi');
      result = result.replace(regex, (match, p1, p2, p3) => `${p1}**${p2}**${p3}`);
    });
    return result;
  };

  const migrated = { ...entry, migrated: true };

  // Migrate main text fields
  if (migrated.reingreso) migrated.reingreso = processText(migrated.reingreso);
  if (migrated.summary)   migrated.summary   = processText(migrated.summary);
  
  // Migrate quotes
  if (migrated.quotes) {
    migrated.quotes = migrated.quotes.map(q => processText(q));
  }

  // Migrate entity contents
  const entityFields = ['characters', 'places', 'glossary', 'worldRules'];
  entityFields.forEach(field => {
    if (migrated[field]) {
      migrated[field] = migrated[field].map(item => ({
        ...item,
        content: processText(item.content)
      }));
    }
  });

  return migrated;
}

export function migrateAllEntries(entries, archive) {
  if (!entries || !archive) return entries;
  return entries.map(e => migrateEntry(e, archive));
}
