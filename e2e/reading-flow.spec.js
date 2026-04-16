import { test, expect } from '@playwright/test'

const TEST_BOOK = { id: 'book-e2e', title: 'Libro de Prueba', emoji: '📚', color: '#f59e0b', type: 'manga' }

async function seedBase(page) {
  await page.addInitScript((book) => {
    localStorage.setItem('lore-onboarding-done', '1')
    localStorage.setItem('lore-books', JSON.stringify([book]))
    localStorage.setItem('reading-entries', JSON.stringify([]))
    localStorage.setItem('completed-weeks', JSON.stringify([]))
  }, TEST_BOOK)
}

test.describe('Flujo de lectura', () => {

  test('app carga y muestra las pestañas de navegación', async ({ page }) => {
    await seedBase(page)
    await page.goto('/')
    await expect(page.getByRole('tab', { name: 'Crónicas' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Archivo' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Oráculo' })).toBeVisible()
  })

  test('crear entrada → aparece en Crónicas', async ({ page }) => {
    await seedBase(page)
    await page.goto('/')

    // Open entry form
    await page.getByRole('button', { name: /nueva|crónica|forjar/i }).first().click()

    // Fill form
    await page.getByLabel(/libro/i).selectOption('Libro de Prueba')
    await page.getByLabel(/capítulo/i).fill('Capítulo 1')
    await page.getByLabel(/resumen/i).fill('Una entrada de prueba creada por Playwright.')

    // Submit
    await page.getByRole('button', { name: /sellar|guardar|forjar/i }).click()

    // Entry visible in log
    await expect(page.getByText('Capítulo 1')).toBeVisible()
    await expect(page.getByText('Libro de Prueba')).toBeVisible()
  })

  test('personaje en entrada aparece en Archivo', async ({ page }) => {
    await page.addInitScript((book) => {
      localStorage.setItem('lore-onboarding-done', '1')
      localStorage.setItem('lore-books', JSON.stringify([book]))
      localStorage.setItem('reading-entries', JSON.stringify([{
        id: 'e2e-entry-1',
        date: new Date().toISOString().split('T')[0],
        book: 'Libro de Prueba',
        chapter: 'Cap 1',
        summary: 'Test E2E.',
        mood: null,
        reingreso: null,
        readingTime: 0,
        quotes: [],
        characters: [{ name: 'Héroe de Prueba', content: 'Protagonista del test', tags: ['héroe'] }],
        places: [],
        glossary: [],
        worldRules: [],
        connections: [],
        mangaPanels: [],
      }]))
      localStorage.setItem('completed-weeks', JSON.stringify([]))
    }, TEST_BOOK)

    await page.goto('/')
    await page.getByRole('tab', { name: 'Archivo' }).click()
    await expect(page.getByText('Héroe de Prueba')).toBeVisible()
  })

})
