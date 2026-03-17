import { describe, it, expect } from 'vitest';

// Extract validation logic from EntryForm.handleSave for unit testing
function validateEntry(formData) {
  const errors = [];

  if (!formData.book) {
    errors.push('Selecciona un libro antes de guardar.');
    return errors;
  }

  const emptyChar = formData.characters?.find(c => !c.name?.trim());
  if (emptyChar) errors.push('Todos los personajes deben tener un nombre.');

  const emptyPlace = formData.places?.find(p => !p.name?.trim());
  if (emptyPlace) errors.push('Todos los lugares deben tener un nombre.');

  const emptyGlossary = formData.glossary?.find(g => !g.name?.trim());
  if (emptyGlossary) errors.push('Todos los términos del glosario deben tener un nombre.');

  const emptyRule = formData.worldRules?.find(r => !r.name?.trim());
  if (emptyRule) errors.push('Todas las reglas del mundo deben tener un nombre o concepto.');

  const hasEmptyQuote = formData.quotes?.some(q => !q?.trim());
  if (hasEmptyQuote) errors.push('No puedes guardar citas vacías.');

  if (errors.length > 0) return errors;

  if (!formData.reingreso?.trim() &&
      !formData.characters?.length &&
      !formData.places?.length &&
      !formData.glossary?.length &&
      !formData.worldRules?.length &&
      !formData.quotes?.length) {
    errors.push('Escribe un resumen o añade al menos un conocimiento.');
  }

  return errors;
}

describe('EntryForm validation', () => {
  const base = { book: 'El Hobbit', reingreso: 'Test', characters: [], places: [], glossary: [], worldRules: [], quotes: [] };

  it('accepts valid entry with summary', () => {
    expect(validateEntry(base)).toEqual([]);
  });

  it('rejects missing book', () => {
    const errors = validateEntry({ ...base, book: '' });
    expect(errors).toContain('Selecciona un libro antes de guardar.');
  });

  it('rejects character without name', () => {
    const errors = validateEntry({ ...base, characters: [{ name: '', content: 'x' }] });
    expect(errors).toContain('Todos los personajes deben tener un nombre.');
  });

  it('rejects character with whitespace-only name', () => {
    const errors = validateEntry({ ...base, characters: [{ name: '   ', content: 'x' }] });
    expect(errors).toContain('Todos los personajes deben tener un nombre.');
  });

  it('accepts character with valid name', () => {
    const errors = validateEntry({ ...base, characters: [{ name: 'Bilbo', content: 'x' }] });
    expect(errors).toEqual([]);
  });

  it('rejects place without name', () => {
    const errors = validateEntry({ ...base, places: [{ name: '' }] });
    expect(errors).toContain('Todos los lugares deben tener un nombre.');
  });

  it('rejects glossary term without name', () => {
    const errors = validateEntry({ ...base, glossary: [{ name: '' }] });
    expect(errors).toContain('Todos los términos del glosario deben tener un nombre.');
  });

  it('rejects world rule without name', () => {
    const errors = validateEntry({ ...base, worldRules: [{ name: '' }] });
    expect(errors).toContain('Todas las reglas del mundo deben tener un nombre o concepto.');
  });

  it('rejects empty quote', () => {
    const errors = validateEntry({ ...base, quotes: ['good quote', ''] });
    expect(errors).toContain('No puedes guardar citas vacías.');
  });

  it('rejects whitespace-only quote', () => {
    const errors = validateEntry({ ...base, quotes: ['  '] });
    expect(errors).toContain('No puedes guardar citas vacías.');
  });

  it('rejects entry with no content at all', () => {
    const empty = { book: 'El Hobbit', reingreso: '', characters: [], places: [], glossary: [], worldRules: [], quotes: [] };
    const errors = validateEntry(empty);
    expect(errors).toContain('Escribe un resumen o añade al menos un conocimiento.');
  });

  it('accepts entry with only characters (no summary)', () => {
    const data = { ...base, reingreso: '', characters: [{ name: 'Gandalf' }] };
    expect(validateEntry(data)).toEqual([]);
  });

  it('accepts entry with only quotes (no summary)', () => {
    const data = { ...base, reingreso: '', quotes: ['A quote'] };
    expect(validateEntry(data)).toEqual([]);
  });

  it('accepts entry with only worldRules (no summary)', () => {
    const data = { ...base, reingreso: '', worldRules: [{ name: 'Magic', content: 'Works' }] };
    expect(validateEntry(data)).toEqual([]);
  });
});
