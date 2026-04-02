import { Page } from '@playwright/test'

// ── Generación de datos únicos ──────────────────────────────────────────────

export function generateUniqueEmail(prefix = 'test'): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 9999)
  return `${prefix}_${timestamp}_${random}@e2e.test`
}

export const DEFAULT_PASSWORD = 'TestPass@123'

// ── Helpers de fecha ────────────────────────────────────────────────────────

export function formatDateForApi(date: Date): string {
  return date.toISOString()
}

export function getTodayDate(): Date {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  return d
}

export function getTomorrowDate(): Date {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(12, 0, 0, 0)
  return d
}

export function getNextWeekDate(): Date {
  const d = new Date()
  d.setDate(d.getDate() + 8)
  d.setHours(12, 0, 0, 0)
  return d
}

export function getPastDate(daysAgo = 5): Date {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(12, 0, 0, 0)
  return d
}

export function getEndOfMonthDate(): Date {
  const d = new Date()
  // Last day of current month
  d.setMonth(d.getMonth() + 1, 0)
  // If today is already the last day, use a day closer to end but not past
  const today = new Date()
  if (d.getDate() === today.getDate()) {
    d.setDate(d.getDate() - 1)
  }
  d.setHours(12, 0, 0, 0)
  return d
}

// ── Flujo de autenticación ──────────────────────────────────────────────────

/**
 * Registra un usuario nuevo via el dialog "Crear cuenta".
 * Al terminar, el usuario ya está autenticado y la app navega a /tasks.
 */
export async function registerUser(
  page: Page,
  email: string,
  password: string,
  name: string
): Promise<void> {
  await page.goto('/')
  await page.waitForURL('**/login')

  // Click "Crear cuenta nueva"
  await page.getByRole('button', { name: 'Crear cuenta nueva' }).click()

  // Esperar que aparezca el dialog de creación
  await page.waitForSelector('[role="dialog"]', { state: 'visible' })

  // Llenar el formulario dentro del dialog
  await page.locator('#register-email').fill(email)
  await page.locator('#register-name').fill(name)
  await page.locator('#register-password').fill(password)
  await page.locator('#register-confirm-password').fill(password)

  // Enviar — usar exact:true para no confundir con el botón "Crear cuenta nueva" del fondo
  await page
    .locator('[role="dialog"]')
    .getByRole('button', { name: 'Crear cuenta', exact: true })
    .click()

  // Después de crear el usuario, la app hace login automáticamente y navega a /tasks
  await page.waitForURL('**/tasks', { timeout: 20_000 })
}

/**
 * Hace login con credenciales existentes.
 * Debe llamarse cuando ya estamos en la página de login (NO autenticados).
 */
export async function loginUser(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/')
  await page.waitForURL('**/login')

  await page.locator('#login-email').fill(email)
  await page.locator('#login-password').fill(password)
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()

  await page.waitForURL('**/tasks', { timeout: 15_000 })
}

/**
 * Registra un usuario y deja la sesión iniciada en /tasks.
 * El registro ya hace login automáticamente — no necesita llamar a loginUser.
 */
export async function registerAndLogin(
  page: Page,
  emailPrefix = 'test'
): Promise<{ email: string; password: string; name: string }> {
  const email = generateUniqueEmail(emailPrefix)
  const password = DEFAULT_PASSWORD
  const name = 'Usuario Test'

  // registerUser ya termina en /tasks (login automático post-creación)
  await registerUser(page, email, password, name)

  return { email, password, name }
}

/**
 * Cierra sesión del usuario actual.
 * Debe llamarse cuando ya estamos en /tasks.
 */
export async function logoutUser(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  await page.waitForURL('**/login', { timeout: 10_000 })
}

// ── Flujo de creación de tarea via API directa (más rápido) ────────────────

export interface ApiTask {
  title: string
  description: string
  priority?: 'low' | 'medium' | 'high'
  dueDate?: string
  completed?: boolean
}

export async function createTaskViaApi(
  page: Page,
  task: ApiTask,
  authToken: string
): Promise<string> {
  const response = await page.request.post(
    'http://127.0.0.1:5001/demo-todo-api/us-central1/api/v1/tasks',
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: task
    }
  )
  const body = await response.json()
  return body.id || body.data?.id || ''
}

// ── Helpers de UI para crear tareas ────────────────────────────────────────

export async function openAddTaskDialog(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Agregar nueva tarea' }).click()
  await page.waitForSelector('[role="dialog"]', { state: 'visible' })
}

export async function fillTaskForm(
  page: Page,
  options: {
    title: string
    description?: string
    priority?: 'Baja' | 'Media' | 'Alta' | 'Sin prioridad'
    openDatepicker?: boolean
  }
): Promise<void> {
  // El formId en modo "add" es "add-task-form", el input title es "add-task-form-title"
  const titleInput = page.locator('[id$="-title"]').first()
  await titleInput.fill(options.title)

  if (options.description !== undefined) {
    const descInput = page.locator('[id$="-desc"]').first()
    await descInput.fill(options.description)
  }

  if (options.priority && options.priority !== 'Sin prioridad') {
    await page.locator('#task-priority').selectOption({ label: options.priority })
  }
}

export async function submitTaskForm(page: Page): Promise<void> {
  // Click el botón "Crear tarea" del dialog (exact para no confundir con otros)
  await page.locator('[role="dialog"]').getByRole('button', { name: 'Crear tarea' }).click()
  // Esperar que cierre el dialog
  await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 10_000 })
}

/**
 * Confirma un dialog de acción destructiva (Eliminar, etc.).
 * Espera que aparezca un dialog con el botón de confirmación y lo pulsa.
 */
export async function confirmDestructiveAction(
  page: Page,
  confirmButtonLabel = 'Eliminar'
): Promise<void> {
  // Esperar que el dialog de confirmación aparezca
  await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 5_000 })
  await page.locator('[role="dialog"]').getByRole('button', { name: confirmButtonLabel }).click()
  await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 10_000 })
}

/**
 * Obtiene el locator de una tarea en la lista por su título (heading de la task card).
 * Evita ambigüedades con el sidebar/widgets que también pueden mostrar el título.
 */
export function getTaskCardByTitle(page: import('@playwright/test').Page, title: string) {
  return page.locator('mat-card').filter({ has: page.getByRole('heading', { name: title }) })
}

// ── Helper para crear tarea completa via UI ─────────────────────────────────

export async function createTaskViaUI(
  page: Page,
  options: {
    title: string
    description?: string
    priority?: 'Baja' | 'Media' | 'Alta'
  }
): Promise<void> {
  await openAddTaskDialog(page)
  await fillTaskForm(page, {
    title: options.title,
    description: options.description ?? 'Descripción de prueba',
    priority: options.priority
  })
  await submitTaskForm(page)
  // Esperar que la tarea aparezca en la lista (usando el heading h3 de la task card)
  await page
    .locator('mat-card')
    .filter({ has: page.getByRole('heading', { name: options.title }) })
    .waitFor({ state: 'visible', timeout: 10_000 })
}

// ── Obtener el token de auth del localStorage ───────────────────────────────

export async function getAuthToken(page: Page): Promise<string> {
  const token = await page.evaluate(() => {
    // Busca en todas las keys del localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key) continue
      const val = localStorage.getItem(key) ?? ''
      // Busca un JWT (empieza con "ey")
      if (val.startsWith('ey') && val.includes('.')) {
        return val
      }
      // Firebase puede guardar el token en un objeto JSON
      try {
        const obj = JSON.parse(val)
        if (obj?.stsTokenManager?.accessToken) {
          return obj.stsTokenManager.accessToken as string
        }
      } catch {
        // no es JSON
      }
    }
    return ''
  })
  return token
}

// ── Abrir panel de filtros ──────────────────────────────────────────────────

export async function openFilterPanel(page: Page): Promise<void> {
  await page.getByRole('button', { name: /Filtrar tareas/ }).click()
  await page.waitForSelector('[role="dialog"][aria-label="Panel de filtros de tareas"]', {
    state: 'visible'
  })
}

export async function applyFilters(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Aplicar filtros seleccionados' }).click()
  await page.waitForSelector('[role="dialog"][aria-label="Panel de filtros de tareas"]', {
    state: 'hidden'
  })
}

export async function clearAndCloseFilterPanel(page: Page): Promise<void> {
  const clearBtn = page.getByRole('button', { name: 'Limpiar todos los filtros' })
  if (await clearBtn.isEnabled()) {
    await clearBtn.click()
  }
  await applyFilters(page)
}
