import { test, expect } from '@playwright/test'
import {
  registerAndLogin,
  openAddTaskDialog,
  fillTaskForm,
  submitTaskForm,
  openFilterPanel,
  applyFilters,
  getTaskCardByTitle
} from '../fixtures/helpers'

// ── Helpers locales ──────────────────────────────────────────────────────────

/**
 * Helper para scoping de interacciones dentro del panel de filtros.
 * El panel es un [role="dialog"] con aria-label específico.
 */
function getFilterPanel(page: import('@playwright/test').Page) {
  return page.locator('[role="dialog"][aria-label="Panel de filtros de tareas"]')
}

// ── Suite de filtros ─────────────────────────────────────────────────────────

test.describe('Filtros de fecha', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, 'filters')
    await expect(page).toHaveURL(/\/tasks/)
  })

  test('should_show_filter_panel_when_clicking_filter_button', async ({ page }) => {
    // Act
    await openFilterPanel(page)

    // Assert
    await expect(getFilterPanel(page)).toBeVisible()
    await expect(getFilterPanel(page).getByText('Filtros')).toBeVisible()
  })

  test('should_show_priority_and_date_sections_in_filter_panel', async ({ page }) => {
    // Act
    await openFilterPanel(page)

    const panel = getFilterPanel(page)

    // Assert — buscar dentro del panel para evitar ambigüedades con el sidebar
    await expect(panel.getByText('Prioridad', { exact: true })).toBeVisible()
    await expect(panel.getByText('Fecha de vencimiento')).toBeVisible()
    // Los radio buttons están dentro del panel
    await expect(panel.getByRole('radio', { name: 'Hoy' })).toBeVisible()
    await expect(panel.getByRole('radio', { name: 'Esta semana' })).toBeVisible()
    await expect(panel.getByRole('radio', { name: 'Este mes' })).toBeVisible()
    await expect(panel.getByRole('radio', { name: 'Vencidas' })).toBeVisible()
  })

  test('should_filter_by_today_and_show_badge', async ({ page }) => {
    // Act — aplicar filtro Hoy (sin crear tareas, solo verificar que el filtro se aplica)
    await openFilterPanel(page)
    await getFilterPanel(page).getByRole('radio', { name: 'Hoy' }).click()
    await applyFilters(page)

    // Assert — aparece el badge "Filtrado"
    await expect(page.getByText('Filtrado')).toBeVisible({ timeout: 8_000 })
  })

  test('should_toggle_off_date_filter_when_clicking_selected_radio_again', async ({ page }) => {
    // Arrange — activar un filtro
    await openFilterPanel(page)
    await getFilterPanel(page).getByRole('radio', { name: 'Esta semana' }).click()
    await applyFilters(page)
    await expect(page.getByText('Filtrado')).toBeVisible()

    // Act — volver a abrir y hacer click en el mismo radio para desactivar
    await openFilterPanel(page)
    await getFilterPanel(page).getByRole('radio', { name: 'Esta semana' }).click()
    await applyFilters(page)

    // Assert — el badge "Filtrado" desaparece (filtro desactivado)
    await expect(page.getByText('Filtrado')).toBeHidden({ timeout: 8_000 })
  })

  test('should_show_active_filter_count_badge_on_filter_button', async ({ page }) => {
    // Act — activar 1 filtro de fecha
    await openFilterPanel(page)
    await getFilterPanel(page).getByRole('radio', { name: 'Vencidas' }).click()
    await applyFilters(page)

    // Assert — el aria-label del botón de filtro muestra "1 activo"
    const filterButton = page.getByRole('button', { name: /Filtrar tareas/ })
    await expect(filterButton).toHaveAttribute('aria-label', /1 activo/)
  })

  test('should_clear_all_filters_when_clicking_limpiar', async ({ page }) => {
    // Arrange — aplicar un filtro
    await openFilterPanel(page)
    await getFilterPanel(page).getByRole('radio', { name: 'Este mes' }).click()
    await applyFilters(page)
    await expect(page.getByText('Filtrado')).toBeVisible()

    // Act — abrir panel y limpiar
    await openFilterPanel(page)
    await getFilterPanel(page).getByRole('button', { name: 'Limpiar todos los filtros' }).click()
    await applyFilters(page)

    // Assert
    await expect(page.getByText('Filtrado')).toBeHidden({ timeout: 8_000 })
  })

  test('should_close_filter_panel_when_clicking_outside_backdrop', async ({ page }) => {
    // Arrange
    await openFilterPanel(page)
    await expect(getFilterPanel(page)).toBeVisible()

    // Esperar que el backdrop esté presente antes de hacer click
    const backdrop = page.locator('.cdk-overlay-transparent-backdrop')
    await backdrop.waitFor({ state: 'visible', timeout: 5_000 })

    // Act — hacer click en el backdrop (fuera del panel)
    await backdrop.click({ force: true })

    // Assert
    await expect(getFilterPanel(page)).toBeHidden({ timeout: 5_000 })
  })

  test('should_close_filter_panel_when_pressing_escape', async ({ page }) => {
    // Arrange
    await openFilterPanel(page)

    // Act
    await page.keyboard.press('Escape')

    // Assert
    await expect(getFilterPanel(page)).toBeHidden()
  })
})

test.describe('Filtros de prioridad', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, 'prio')
    await expect(page).toHaveURL(/\/tasks/)
  })

  test('should_filter_by_high_priority_and_show_badge', async ({ page }) => {
    // Arrange — crear tareas con distintas prioridades
    await openAddTaskDialog(page)
    await fillTaskForm(page, {
      title: `Alta ${Date.now()}`,
      description: 'Alta prio',
      priority: 'Alta'
    })
    await submitTaskForm(page)

    await openAddTaskDialog(page)
    await fillTaskForm(page, {
      title: `Baja ${Date.now()}`,
      description: 'Baja prio',
      priority: 'Baja'
    })
    await submitTaskForm(page)

    // Act — scope al panel de filtros para evitar ambigüedad con checkboxes de tareas
    await openFilterPanel(page)
    await getFilterPanel(page).getByRole('checkbox', { name: 'Alta' }).click()
    await applyFilters(page)

    // Assert
    await expect(page.getByText('Filtrado')).toBeVisible({ timeout: 8_000 })
  })

  test('should_select_multiple_priorities_simultaneously', async ({ page }) => {
    // Act
    await openFilterPanel(page)
    const panel = getFilterPanel(page)
    await panel.getByRole('checkbox', { name: 'Alta' }).click()
    await panel.getByRole('checkbox', { name: 'Media' }).click()

    // Assert — ambos checkboxes están marcados
    await expect(panel.getByRole('checkbox', { name: 'Alta' })).toBeChecked()
    await expect(panel.getByRole('checkbox', { name: 'Media' })).toBeChecked()

    // Aplicar
    await applyFilters(page)
    await expect(page.getByText('Filtrado')).toBeVisible({ timeout: 8_000 })
  })

  test('should_uncheck_priority_checkbox_when_clicked_again', async ({ page }) => {
    // Act
    await openFilterPanel(page)
    const panel = getFilterPanel(page)
    const checkbox = panel.getByRole('checkbox', { name: 'Baja' })
    await checkbox.click()
    await expect(checkbox).toBeChecked()

    // Desmarcar
    await checkbox.click()
    await expect(checkbox).not.toBeChecked()
  })

  test('should_show_count_2_on_badge_when_both_priority_and_date_filters_active', async ({
    page
  }) => {
    // Act — combinar filtro de prioridad + fecha
    await openFilterPanel(page)
    const panel = getFilterPanel(page)
    await panel.getByRole('checkbox', { name: 'Alta' }).click()
    await panel.getByRole('radio', { name: 'Este mes' }).click()
    await applyFilters(page)

    // Assert — badge muestra 2
    const filterButton = page.getByRole('button', { name: /Filtrar tareas/ })
    await expect(filterButton).toHaveAttribute('aria-label', /2 activos/)
  })

  test('should_only_show_high_priority_tasks_when_filter_high_is_applied', async ({ page }) => {
    // Arrange — crear tareas con prioridades distintas
    const highTitle = `Tarea alta ${Date.now()}`
    const lowTitle = `Tarea baja ${Date.now() + 1}`
    const medTitle = `Tarea media ${Date.now() + 2}`

    await openAddTaskDialog(page)
    await fillTaskForm(page, { title: highTitle, description: 'alta', priority: 'Alta' })
    await submitTaskForm(page)

    await openAddTaskDialog(page)
    await fillTaskForm(page, { title: lowTitle, description: 'baja', priority: 'Baja' })
    await submitTaskForm(page)

    await openAddTaskDialog(page)
    await fillTaskForm(page, { title: medTitle, description: 'media', priority: 'Media' })
    await submitTaskForm(page)

    // Act — filtrar por Alta
    await openFilterPanel(page)
    await getFilterPanel(page).getByRole('checkbox', { name: 'Alta' }).click()
    await applyFilters(page)

    // Assert — solo la tarea alta es visible
    await expect(page.getByRole('heading', { name: highTitle })).toBeVisible()
    await expect(page.getByRole('heading', { name: lowTitle })).toBeHidden()
    await expect(page.getByRole('heading', { name: medTitle })).toBeHidden()
  })
})
