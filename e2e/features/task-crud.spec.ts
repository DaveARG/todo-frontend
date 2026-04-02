import { test, expect } from '@playwright/test'
import {
  registerAndLogin,
  openAddTaskDialog,
  fillTaskForm,
  submitTaskForm,
  createTaskViaUI,
  confirmDestructiveAction,
  getTaskCardByTitle
} from '../fixtures/helpers'

test.describe('CRUD de Tareas', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, 'crud')
    await expect(page).toHaveURL(/\/tasks/)
  })

  // ── Crear tarea ─────────────────────────────────────────────────────────────

  test.describe('Crear tarea', () => {
    test('should_open_add_task_dialog_when_clicking_agregar_tarea', async ({ page }) => {
      // Act
      await openAddTaskDialog(page)

      // Assert
      await expect(page.locator('[role="dialog"]')).toBeVisible()
      await expect(page.getByText('Nueva tarea')).toBeVisible()
    })

    test('should_create_task_with_only_title_and_description', async ({ page }) => {
      // Arrange
      const title = `Tarea simple ${Date.now()}`

      // Act
      await openAddTaskDialog(page)
      await fillTaskForm(page, { title, description: 'Descripción básica de prueba' })
      await submitTaskForm(page)

      // Assert — usar heading para ser precisos
      await expect(page.getByRole('heading', { name: title })).toBeVisible({ timeout: 10_000 })
    })

    test('should_create_task_with_high_priority', async ({ page }) => {
      // Arrange
      const title = `Tarea alta prioridad ${Date.now()}`

      // Act
      await openAddTaskDialog(page)
      await fillTaskForm(page, { title, description: 'Tarea urgente', priority: 'Alta' })
      await submitTaskForm(page)

      // Assert
      await expect(page.getByRole('heading', { name: title })).toBeVisible({ timeout: 10_000 })
    })

    test('should_create_task_with_medium_priority', async ({ page }) => {
      // Arrange
      const title = `Tarea media prioridad ${Date.now()}`

      // Act
      await openAddTaskDialog(page)
      await fillTaskForm(page, { title, description: 'Tarea media', priority: 'Media' })
      await submitTaskForm(page)

      // Assert
      await expect(page.getByRole('heading', { name: title })).toBeVisible({ timeout: 10_000 })
    })

    test('should_create_task_with_low_priority', async ({ page }) => {
      // Arrange
      const title = `Tarea baja prioridad ${Date.now()}`

      // Act
      await openAddTaskDialog(page)
      await fillTaskForm(page, { title, description: 'Tarea de baja urgencia', priority: 'Baja' })
      await submitTaskForm(page)

      // Assert
      await expect(page.getByRole('heading', { name: title })).toBeVisible({ timeout: 10_000 })
    })

    test('should_disable_create_button_when_title_is_empty', async ({ page }) => {
      // Act
      await openAddTaskDialog(page)
      // Solo llenar descripción, sin título
      const descInput = page.locator('[id$="-desc"]').first()
      await descInput.fill('Solo descripción sin título')

      // Assert — el botón "Crear tarea" del dialog debe estar deshabilitado
      await expect(
        page.locator('[role="dialog"]').getByRole('button', { name: 'Crear tarea' })
      ).toBeDisabled()
    })

    test('should_close_dialog_without_creating_when_clicking_cancelar', async ({ page }) => {
      // Arrange
      const title = `Tarea cancelada ${Date.now()}`

      // Act
      await openAddTaskDialog(page)
      await fillTaskForm(page, { title, description: 'No debería crearse' })
      await page.locator('[role="dialog"]').getByRole('button', { name: 'Cancelar' }).click()

      // Assert — dialog cerrado y la tarea no aparece
      await expect(page.locator('[role="dialog"]')).toBeHidden()
      await expect(page.getByRole('heading', { name: title })).toBeHidden()
    })
  })

  // ── Ver tarea ───────────────────────────────────────────────────────────────

  test.describe('Ver tarea en la lista', () => {
    test('should_display_created_task_in_task_list_with_correct_data', async ({ page }) => {
      // Arrange
      const title = `Tarea visible ${Date.now()}`
      const description = 'Esta descripción debe verse en la card'

      // Act
      await openAddTaskDialog(page)
      await fillTaskForm(page, { title, description, priority: 'Alta' })
      await submitTaskForm(page)

      // Assert — usar heading para el título y texto para la descripción
      await expect(page.getByRole('heading', { name: title })).toBeVisible({ timeout: 10_000 })
      await expect(page.getByText(description)).toBeVisible()
    })

    test('should_update_stats_counter_after_creating_a_task', async ({ page }) => {
      // Arrange
      const statsRegion = page.getByRole('list', { name: 'Estadísticas de tareas' })
      await expect(statsRegion).toBeVisible()

      // Act — crear una tarea
      const title = `Tarea stats ${Date.now()}`
      await createTaskViaUI(page, { title, description: 'Para verificar stats' })

      // Assert — la task card aparece en la lista
      await expect(page.getByRole('heading', { name: title })).toBeVisible({ timeout: 10_000 })
    })
  })

  // ── Editar tarea ────────────────────────────────────────────────────────────

  test.describe('Editar tarea', () => {
    test('should_open_edit_dialog_when_clicking_edit_button_on_task_card', async ({ page }) => {
      // Arrange
      const title = `Tarea a editar ${Date.now()}`
      await createTaskViaUI(page, { title })

      // Act — hacer hover sobre la card para que aparezcan los botones de acción
      const taskCard = getTaskCardByTitle(page, title)
      await taskCard.hover()
      await taskCard.getByRole('button', { name: 'Editar tarea' }).click()

      // Assert
      await expect(page.locator('[role="dialog"]')).toBeVisible()
      await expect(page.getByText('Editar tarea')).toBeVisible()
    })

    test('should_edit_task_title_and_see_updated_title_in_list', async ({ page }) => {
      // Arrange
      const originalTitle = `Título original ${Date.now()}`
      const updatedTitle = `Título actualizado ${Date.now()}`
      await createTaskViaUI(page, { title: originalTitle })

      // Act
      const taskCard = getTaskCardByTitle(page, originalTitle)
      await taskCard.hover()
      await taskCard.getByRole('button', { name: 'Editar tarea' }).click()
      await page.waitForSelector('[role="dialog"]', { state: 'visible' })

      // Limpiar el campo título y escribir el nuevo
      const titleInput = page.locator('[id$="-title"]').first()
      await titleInput.clear()
      await titleInput.fill(updatedTitle)

      await page.locator('[role="dialog"]').getByRole('button', { name: 'Guardar cambios' }).click()
      await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 10_000 })

      // Assert
      await expect(page.getByRole('heading', { name: updatedTitle })).toBeVisible({
        timeout: 10_000
      })
      await expect(page.getByRole('heading', { name: originalTitle })).toBeHidden()
    })

    test('should_edit_task_priority_from_low_to_high', async ({ page }) => {
      // Arrange
      const title = `Tarea cambio prioridad ${Date.now()}`
      await createTaskViaUI(page, { title, priority: 'Baja' })

      // Act
      const taskCard = getTaskCardByTitle(page, title)
      await taskCard.hover()
      await taskCard.getByRole('button', { name: 'Editar tarea' }).click()
      await page.waitForSelector('[role="dialog"]', { state: 'visible' })

      await page.locator('#task-priority').selectOption({ label: 'Alta' })
      await page.locator('[role="dialog"]').getByRole('button', { name: 'Guardar cambios' }).click()
      await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 10_000 })

      // Assert — la tarea sigue en la lista
      await expect(page.getByRole('heading', { name: title })).toBeVisible({ timeout: 10_000 })
    })
  })

  // ── Marcar como completada ──────────────────────────────────────────────────

  test.describe('Completar tarea', () => {
    test('should_mark_task_as_completed_when_clicking_checkbox', async ({ page }) => {
      // Arrange
      const title = `Tarea a completar ${Date.now()}`
      await createTaskViaUI(page, { title })

      // Act — hacer click en el checkbox
      const taskCard = getTaskCardByTitle(page, title)
      const checkbox = taskCard.getByRole('checkbox')
      await checkbox.click()

      // Assert — el checkbox queda marcado
      await expect(checkbox).toBeChecked({ timeout: 10_000 })
    })

    test('should_move_completed_task_to_the_bottom_of_the_list', async ({ page }) => {
      // Arrange — crear 2 tareas
      const title1 = `Tarea primera ${Date.now()}`
      const title2 = `Tarea segunda ${Date.now() + 1}`
      await createTaskViaUI(page, { title: title1 })
      await createTaskViaUI(page, { title: title2 })

      // Act — completar la primera
      const card1 = getTaskCardByTitle(page, title1)
      await card1.getByRole('checkbox').click()

      await page.waitForTimeout(1500)

      // Assert — el checkbox queda marcado (el reordenamiento es un efecto secundario del service)
      const checkbox1 = getTaskCardByTitle(page, title1).getByRole('checkbox')
      await expect(checkbox1).toBeChecked({ timeout: 10_000 })
    })

    test('should_toggle_task_back_to_pending_when_unchecking_checkbox', async ({ page }) => {
      // Arrange
      const title = `Tarea toggle ${Date.now()}`
      await createTaskViaUI(page, { title })

      const taskCard = getTaskCardByTitle(page, title)
      const checkbox = taskCard.getByRole('checkbox')

      // Act — completar
      await checkbox.click()
      await expect(checkbox).toBeChecked({ timeout: 8_000 })

      // Act — descompletar
      const toggledCard = getTaskCardByTitle(page, title)
      await toggledCard.getByRole('checkbox').click()

      // Assert
      await expect(getTaskCardByTitle(page, title).getByRole('checkbox')).not.toBeChecked({
        timeout: 8_000
      })
    })

    test('should_update_completed_counter_in_stats_after_completing_a_task', async ({ page }) => {
      // Arrange
      const title = `Tarea para stats ${Date.now()}`
      await createTaskViaUI(page, { title })

      // Act — completar tarea
      const taskCard = getTaskCardByTitle(page, title)
      await taskCard.getByRole('checkbox').click()

      // Assert — el label "Completadas" sigue visible en stats
      const statsRegion = page.getByRole('list', { name: 'Estadísticas de tareas' })
      await expect(statsRegion.getByText('Completadas')).toBeVisible({ timeout: 10_000 })
    })
  })

  // ── Eliminar tarea ──────────────────────────────────────────────────────────

  test.describe('Eliminar tarea', () => {
    test('should_delete_task_when_clicking_delete_button_and_confirming', async ({ page }) => {
      // Arrange
      const title = `Tarea a eliminar ${Date.now()}`
      await createTaskViaUI(page, { title })

      // Act — hover + click eliminar
      const taskCard = getTaskCardByTitle(page, title)
      await taskCard.hover()
      await taskCard.getByRole('button', { name: 'Eliminar tarea' }).click()

      // Confirmar en el dialog de confirmación
      await confirmDestructiveAction(page, 'Eliminar')

      // Assert
      await expect(page.getByRole('heading', { name: title })).toBeHidden({ timeout: 10_000 })
    })

    test('should_cancel_delete_when_clicking_cancelar_in_confirmation_dialog', async ({
      page
    }) => {
      // Arrange
      const title = `Tarea no eliminada ${Date.now()}`
      await createTaskViaUI(page, { title })

      // Act — hover + click eliminar
      const taskCard = getTaskCardByTitle(page, title)
      await taskCard.hover()
      await taskCard.getByRole('button', { name: 'Eliminar tarea' }).click()

      // Cancelar la eliminación
      await page.waitForSelector('[role="dialog"]', { state: 'visible' })
      await page.locator('[role="dialog"]').getByRole('button', { name: 'Cancelar' }).click()
      await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5_000 })

      // Assert — la tarea sigue existiendo
      await expect(page.getByRole('heading', { name: title })).toBeVisible({ timeout: 5_000 })
    })

    test('should_show_delete_completed_button_when_there_are_completed_tasks', async ({ page }) => {
      // Arrange — crear y completar una tarea
      const title = `Tarea completada a eliminar ${Date.now()}`
      await createTaskViaUI(page, { title })

      const taskCard = getTaskCardByTitle(page, title)
      await taskCard.getByRole('checkbox').click()
      await expect(taskCard.getByRole('checkbox')).toBeChecked({ timeout: 8_000 })

      // Assert — el botón "Eliminar completadas" debe aparecer
      await expect(
        page.getByRole('button', { name: 'Eliminar todas las tareas completadas' })
      ).toBeVisible({ timeout: 10_000 })
    })

    test('should_delete_all_completed_tasks_when_clicking_delete_completed', async ({ page }) => {
      // Arrange
      const title1 = `Completada 1 ${Date.now()}`
      const title2 = `Completada 2 ${Date.now() + 1}`
      await createTaskViaUI(page, { title: title1 })
      await createTaskViaUI(page, { title: title2 })

      // Completar ambas
      await getTaskCardByTitle(page, title1).getByRole('checkbox').click()
      await expect(getTaskCardByTitle(page, title1).getByRole('checkbox')).toBeChecked({
        timeout: 8_000
      })

      await getTaskCardByTitle(page, title2).getByRole('checkbox').click()
      await expect(getTaskCardByTitle(page, title2).getByRole('checkbox')).toBeChecked({
        timeout: 8_000
      })

      // Act — eliminar todas las completadas
      await page
        .getByRole('button', { name: 'Eliminar todas las tareas completadas' })
        .click()

      // Confirmar
      await confirmDestructiveAction(page, 'Eliminar')

      // Assert — las tareas desaparecen
      await expect(page.getByRole('heading', { name: title1 })).toBeHidden({ timeout: 10_000 })
      await expect(page.getByRole('heading', { name: title2 })).toBeHidden({ timeout: 10_000 })
    })
  })
})
