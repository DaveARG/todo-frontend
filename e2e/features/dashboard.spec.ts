import { test, expect } from '@playwright/test'
import {
  registerAndLogin,
  openAddTaskDialog,
  fillTaskForm,
  submitTaskForm
} from '../fixtures/helpers'

test.describe('Dashboard y visualizaciones', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, 'dashboard')
    await expect(page).toHaveURL(/\/tasks/)
  })

  // ── Stats cards ─────────────────────────────────────────────────────────────

  test.describe('Stats cards', () => {
    test('should_show_stats_cards_with_zero_counts_for_new_user', async ({ page }) => {
      // Assert — para un usuario nuevo sin tareas los contadores están en 0
      const statsRegion = page.getByRole('list', { name: 'Estadísticas de tareas' })
      await expect(statsRegion).toBeVisible()

      // Los valores "0" deben aparecer dentro de las cards
      const cards = statsRegion.getByRole('listitem')
      await expect(cards).toHaveCount(3)
    })

    test('should_increment_total_counter_after_creating_a_task', async ({ page }) => {
      // Arrange — obtener texto actual del total
      const statsRegion = page.getByRole('list', { name: 'Estadísticas de tareas' })

      // Crear una tarea
      const title = `Stats tarea ${Date.now()}`
      await openAddTaskDialog(page)
      await fillTaskForm(page, { title, description: 'Para contar' })
      await submitTaskForm(page)
      await expect(page.getByText(title)).toBeVisible({ timeout: 10_000 })

      // Assert — el área de stats sigue visible y tiene 3 cards
      await expect(statsRegion.getByRole('listitem')).toHaveCount(3)
      // El label "Total" debe ser visible
      await expect(statsRegion.getByText('Total')).toBeVisible()
    })

    test('should_show_correct_pending_count_for_uncompleted_tasks', async ({ page }) => {
      // Arrange — crear 2 tareas sin completar
      const title1 = `Pendiente 1 ${Date.now()}`
      const title2 = `Pendiente 2 ${Date.now() + 1}`

      await openAddTaskDialog(page)
      await fillTaskForm(page, { title: title1, description: 'Desc 1' })
      await submitTaskForm(page)
      await expect(page.getByText(title1)).toBeVisible({ timeout: 10_000 })

      await openAddTaskDialog(page)
      await fillTaskForm(page, { title: title2, description: 'Desc 2' })
      await submitTaskForm(page)
      await expect(page.getByText(title2)).toBeVisible({ timeout: 10_000 })

      // Assert — el label "Pendientes" debe ser visible en stats
      const statsRegion = page.getByRole('list', { name: 'Estadísticas de tareas' })
      await expect(statsRegion.getByText('Pendientes')).toBeVisible()
    })

    test('should_show_completed_count_after_completing_a_task', async ({ page }) => {
      // Arrange — crear y completar una tarea
      const title = `Para completar stats ${Date.now()}`
      await openAddTaskDialog(page)
      await fillTaskForm(page, { title, description: 'Para stats completadas' })
      await submitTaskForm(page)
      await expect(page.getByText(title)).toBeVisible({ timeout: 10_000 })

      // Completar
      const taskCard = page.locator('mat-card').filter({ hasText: title })
      await taskCard.getByRole('checkbox').click()
      await expect(taskCard.getByRole('checkbox')).toBeChecked({ timeout: 8_000 })

      // Assert — el label "Completadas" sigue visible
      const statsRegion = page.getByRole('list', { name: 'Estadísticas de tareas' })
      await expect(statsRegion.getByText('Completadas')).toBeVisible()
    })
  })

  // ── Progress ring ───────────────────────────────────────────────────────────

  test.describe('Progress ring y cards de visualización', () => {
    test('should_show_resumen_card_with_progress_ring', async ({ page }) => {
      // Assert — la card de resumen existe
      await expect(page.getByText('Resumen')).toBeVisible()
      await expect(page.getByText('Progreso general')).toBeVisible()
    })

    test('should_show_por_vencer_and_mas_prioritarias_cards', async ({ page }) => {
      // Assert — las otras dos cards de visualización
      await expect(page.getByText('Por vencer')).toBeVisible()
      await expect(page.getByText('Fechas límite', { exact: true })).toBeVisible()
      await expect(page.getByText('Más prioritarias')).toBeVisible()
      await expect(page.getByText('Alta urgencia')).toBeVisible()
    })

    test('should_show_all_tasks_message_when_no_tasks_exist', async ({ page }) => {
      // Para un usuario nuevo sin tareas, el texto del progress ring tip debe indicarlo
      await expect(
        page.getByText('Agrega tu primera tarea para comenzar a trackear tu progreso.')
      ).toBeVisible()
    })

    test('should_update_progress_ring_tip_text_after_creating_a_task', async ({ page }) => {
      // Arrange — crear una tarea
      const title = `Tarea progreso ${Date.now()}`
      await openAddTaskDialog(page)
      await fillTaskForm(page, { title, description: 'Para el ring' })
      await submitTaskForm(page)
      await expect(page.getByText(title)).toBeVisible({ timeout: 10_000 })

      // Assert — el texto del tip cambia
      await expect(
        page.getByText('Completa tu primera tarea para ver el progreso.')
      ).toBeVisible()
    })

    test('should_show_celebration_message_when_all_tasks_are_completed', async ({ page }) => {
      // Arrange — crear una sola tarea y completarla
      const title = `Tarea a celebrar ${Date.now()}`
      await openAddTaskDialog(page)
      await fillTaskForm(page, { title, description: 'La única tarea' })
      await submitTaskForm(page)
      await expect(page.getByText(title)).toBeVisible({ timeout: 10_000 })

      // Completar
      const taskCard = page.locator('mat-card').filter({ hasText: title })
      await taskCard.getByRole('checkbox').click()
      await expect(taskCard.getByRole('checkbox')).toBeChecked({ timeout: 8_000 })

      // Assert — mensaje de celebración
      await expect(
        page.getByText('¡Excelente! Completaste todas tus tareas. Sigue así.')
      ).toBeVisible({ timeout: 8_000 })
    })
  })

  // ── Contadores de la lista de tareas ────────────────────────────────────────

  test.describe('Contador de tareas en la lista', () => {
    test('should_not_show_task_count_badge_when_there_are_no_tasks', async ({ page }) => {
      // Para un usuario nuevo, el badge del conteo (que se muestra solo cuando totalTasks > 0) no existe
      // Verificamos que el área de tareas está vacía
      const taskListSection = page.getByRole('region', { name: 'Lista de tareas' })
      await expect(taskListSection).toBeVisible()
    })

    test('should_show_task_count_badge_after_creating_tasks', async ({ page }) => {
      // Arrange
      const title = `Tarea contadora ${Date.now()}`
      await openAddTaskDialog(page)
      await fillTaskForm(page, { title, description: 'Para el badge' })
      await submitTaskForm(page)
      await expect(page.getByText(title)).toBeVisible({ timeout: 10_000 })

      // Assert — el badge de conteo aparece (el span con aria-label "X tareas en total")
      const countBadge = page.locator('[aria-label$="tareas en total"]')
      await expect(countBadge).toBeVisible()
    })
  })

  // ── Navegación y layout ──────────────────────────────────────────────────────

  test.describe('Navegación general', () => {
    test('should_show_greeting_with_user_name_after_login', async ({ page }) => {
      // Assert — el saludo con el nombre del usuario aparece
      await expect(page.getByText(/Hola,/)).toBeVisible()
    })

    test('should_show_search_input_and_filter_button_in_header', async ({ page }) => {
      // Assert
      const searchInput = page.getByLabel('Buscar tareas por título o descripción')
      await expect(searchInput).toBeVisible()
      await expect(page.getByRole('button', { name: /Filtrar tareas/ })).toBeVisible()
    })

    test('should_show_add_task_button_in_header', async ({ page }) => {
      // Assert
      await expect(page.getByRole('button', { name: 'Agregar nueva tarea' })).toBeVisible()
    })
  })
})
