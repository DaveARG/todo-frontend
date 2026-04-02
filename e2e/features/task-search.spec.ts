import { test, expect } from '@playwright/test'
import {
  registerAndLogin,
  openAddTaskDialog,
  fillTaskForm,
  submitTaskForm,
  openFilterPanel,
  applyFilters
} from '../fixtures/helpers'

function getFilterPanel(page: import('@playwright/test').Page) {
  return page.locator('[role="dialog"][aria-label="Panel de filtros de tareas"]')
}

test.describe('Búsqueda de tareas', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, 'search')
    await expect(page).toHaveURL(/\/tasks/)

    // Crear 3 tareas con títulos/descripciones distinguibles
    await openAddTaskDialog(page)
    await fillTaskForm(page, {
      title: 'Comprar víveres en el supermercado',
      description: 'Lista: leche, pan, huevos'
    })
    await submitTaskForm(page)

    await openAddTaskDialog(page)
    await fillTaskForm(page, {
      title: 'Revisar correos pendientes',
      description: 'Responder al cliente sobre el proyecto Angular'
    })
    await submitTaskForm(page)

    await openAddTaskDialog(page)
    await fillTaskForm(page, {
      title: 'Llamar al médico para cita',
      description: 'Cita de control mensual'
    })
    await submitTaskForm(page)

    // Esperar que las 3 tareas carguen
    await expect(page.getByText('Comprar víveres en el supermercado')).toBeVisible()
    await expect(page.getByText('Revisar correos pendientes')).toBeVisible()
    await expect(page.getByText('Llamar al médico para cita')).toBeVisible()
  })

  test('should_filter_tasks_by_title_when_typing_in_search_field', async ({ page }) => {
    // Act
    const searchInput = page.getByLabel('Buscar tareas por título o descripción')
    await searchInput.fill('Comprar')

    // Assert — solo la tarea con "Comprar" en el título debe verse
    await expect(page.getByText('Comprar víveres en el supermercado')).toBeVisible()
    // Las otras deben estar ocultas o filtradas
    await expect(page.getByText('Revisar correos pendientes')).toBeHidden()
    await expect(page.getByText('Llamar al médico para cita')).toBeHidden()
  })

  test('should_filter_tasks_by_description_content', async ({ page }) => {
    // Act
    const searchInput = page.getByLabel('Buscar tareas por título o descripción')
    await searchInput.fill('Angular')

    // Assert — la tarea cuya descripción contiene "Angular" debe aparecer
    await expect(page.getByText('Revisar correos pendientes')).toBeVisible()
    await expect(page.getByText('Comprar víveres en el supermercado')).toBeHidden()
    await expect(page.getByText('Llamar al médico para cita')).toBeHidden()
  })

  test('should_show_search_term_in_task_section_header', async ({ page }) => {
    // Act
    const searchInput = page.getByLabel('Buscar tareas por título o descripción')
    await searchInput.fill('médico')

    // Assert — el encabezado de la sección "Tareas" muestra el término buscado
    await expect(page.getByText('— "médico"')).toBeVisible()
  })

  test('should_clear_search_and_show_all_tasks_when_input_is_emptied', async ({ page }) => {
    // Arrange — buscar algo
    const searchInput = page.getByLabel('Buscar tareas por título o descripción')
    await searchInput.fill('Comprar')
    await expect(page.getByText('Revisar correos pendientes')).toBeHidden()

    // Act — limpiar búsqueda
    await searchInput.clear()

    // Assert — vuelven a aparecer todas las tareas
    await expect(page.getByText('Comprar víveres en el supermercado')).toBeVisible()
    await expect(page.getByText('Revisar correos pendientes')).toBeVisible()
    await expect(page.getByText('Llamar al médico para cita')).toBeVisible()
  })

  test('should_show_empty_state_when_no_tasks_match_search', async ({ page }) => {
    // Act
    const searchInput = page.getByLabel('Buscar tareas por título o descripción')
    await searchInput.fill('zzzzXXXX_nada_deberia_coincidir')

    // Assert — no hay tareas visibles con ese texto
    await expect(page.getByText('Comprar víveres en el supermercado')).toBeHidden()
    await expect(page.getByText('Revisar correos pendientes')).toBeHidden()
    await expect(page.getByText('Llamar al médico para cita')).toBeHidden()
  })

  test('should_search_case_insensitively', async ({ page }) => {
    // Act — buscar en mayúsculas
    const searchInput = page.getByLabel('Buscar tareas por título o descripción')
    await searchInput.fill('COMPRAR')

    // Assert — la tarea con "Comprar" (minúsculas) sigue apareciendo
    await expect(page.getByText('Comprar víveres en el supermercado')).toBeVisible()
  })

  test('should_combine_search_with_priority_filter', async ({ page }) => {
    // Arrange — crear una tarea alta prioridad con título específico
    await openAddTaskDialog(page)
    await fillTaskForm(page, {
      title: 'Informe anual urgente',
      description: 'Reporte para la junta directiva',
      priority: 'Alta'
    })
    await submitTaskForm(page)
    await expect(page.getByRole('heading', { name: 'Informe anual urgente' })).toBeVisible()

    // Act — buscar por texto Y aplicar filtro de prioridad Alta
    const searchInput = page.getByLabel('Buscar tareas por título o descripción')
    await searchInput.fill('Informe')

    await openFilterPanel(page)
    await getFilterPanel(page).getByRole('checkbox', { name: 'Alta' }).click()
    await applyFilters(page)

    // Assert — solo aparece la tarea que cumple ambas condiciones
    await expect(page.getByRole('heading', { name: 'Informe anual urgente' })).toBeVisible()
    // Las otras tareas (que no tienen prioridad alta) no deben aparecer aunque antes sí
    await expect(page.getByRole('heading', { name: 'Comprar víveres en el supermercado' })).toBeHidden()
  })
})
