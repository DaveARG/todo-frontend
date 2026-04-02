# SDD Plan: Todo App Frontend

## Estado del Flujo SDD

| Fase SDD | Estado | Engram ID |
|----------|--------|-----------|
| Explore | COMPLETE | #335 |
| Proposal | COMPLETE | #336 |
| Spec | COMPLETE | #337 |
| Design | COMPLETE | #339 |
| Tasks | COMPLETE | #340 |
| Apply | PENDING | - |
| Verify | PENDING | - |
| Archive | PENDING | - |

**Siguiente accion**: `/sdd-apply` comenzando por Fase 1 (Infrastructure Setup)

---

## Decisiones Clave

- **Stack**: Angular 21.2.0 + Angular Material + Tailwind CSS (NO SCSS)
- **Estilos**: CSS custom properties para consistencia, Tailwind theme referencia las variables
- **Auth**: JWT con access + refresh tokens, login solo por email
- **API**: REST en otro repo (Cloud Functions), URL en environment variable
- **Deploy**: Firebase Hosting (frontend)
- **UI**: Texto en espanol, codigo en ingles
- **Testing**: E2E/integracion por features, evitar unitarios salvo necesario
- **CI/CD**: GitHub Actions

---

## Estructura de Directorios

```
src/
  app/
    core/
      models/          (user, task, auth, api)
      interceptors/    (auth.interceptor.ts - funcional, con refresh queue)
      guards/          (auth.guard.ts - funcional)
      services/        (token-storage.service.ts)
    features/
      auth/
        auth.routes.ts
        pages/login-page/
        components/login-form/, create-user-dialog/
        services/auth.service.ts
      tasks/
        tasks.routes.ts
        pages/main-page/
        components/add-task-form/, task-list/, task-card/,
                   edit-task-dialog/, stats-cards/
        services/task.service.ts
    shared/components/  (top-nav/, confirm-dialog/)
    app.config.ts, app.routes.ts, app.ts
  environments/        (environment.ts, environment.development.ts)
  styles.css           (Tailwind directives + CSS vars + Material theme)
```

---

## API Endpoints

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | /auth/login | Login con email, retorna JWT |
| POST | /auth/refresh | Refresh token |
| POST | /users | Crear usuario |
| GET | /tasks | Listar tareas del usuario |
| POST | /tasks | Crear tarea |
| PUT | /tasks/:id | Editar tarea |
| DELETE | /tasks/:id | Eliminar tarea |
| PATCH | /tasks/:id/toggle | Toggle completado |

---

## Task Breakdown: 34 Tareas en 6 Fases

### Fase 1: Infrastructure Setup (7 tareas)

#### 1.1 - Instalar dependencias de produccion
- `npm install @angular/material @angular/cdk @angular/animations`
- Sin dependencias previas

#### 1.2 - Instalar dependencias de desarrollo (Tailwind)
- `npm install -D tailwindcss @tailwindcss/postcss`
- Tailwind v4 usa `@theme` directive nativo en CSS
- Sin dependencias previas

#### 1.3 - Cambiar de SCSS a CSS y configurar estilos globales
- Cambiar `angular.json`: style scss -> css, inlineStyleLanguage -> css
- Renombrar .scss -> .css
- Configurar `styles.css` con: `@import "tailwindcss"`, Material theme, CSS custom properties en `:root`, Tailwind `@theme` block
- **Nota**: El `@use/@include` de Material puede requerir que el archivo sea .scss como contenedor, pero sin syntax SCSS custom
- Depende de: 1.1, 1.2

#### 1.4 - Crear archivos de environment
- `src/environments/environment.ts` (produccion con apiUrl)
- `src/environments/environment.development.ts` (desarrollo con localhost)
- Sin dependencias previas

#### 1.5 - Configurar fileReplacements en angular.json
- Agregar `fileReplacements` en `configurations.production`
- Depende de: 1.4

#### 1.6 - Configurar app.config.ts
- provideRouter, provideHttpClient(withInterceptors), provideAnimationsAsync
- Registrar locale espanol (LOCALE_ID: 'es')
- Interceptor puede ser stub hasta Fase 2
- Depende de: 1.3

#### 1.7 - Limpiar root component y template
- app.html -> solo `<router-outlet />`
- app.ts -> minimal con OnPush
- Depende de: 1.3

---

### Fase 2: Core Layer (5 tareas)

#### 2.1 - Crear interfaces/modelos
- User, Task, CreateTaskRequest, UpdateTaskRequest
- LoginRequest, AuthResponse, RefreshRequest, RefreshResponse
- ApiErrorResponse
- Sin dependencias

#### 2.2 - Crear TokenStorageService
- Wrapper de localStorage para access/refresh tokens
- Metodos: getAccessToken, getRefreshToken, setTokens, clearTokens, hasToken
- Sin dependencias

#### 2.3 - Crear auth interceptor (funcional, con refresh queue)
- HttpInterceptorFn con BehaviorSubject para queue de refresh
- Solo inyecta token en requests al apiUrl
- 401 -> refresh -> retry (queue concurrentes)
- Refresh fallido -> logout
- Depende de: 2.1, 2.2

#### 2.4 - Crear auth guard (funcional)
- authGuard: tiene token -> permite, no tiene -> redirect /login
- guestGuard: no tiene token -> permite, tiene -> redirect /tasks
- Retornan UrlTree para redirects
- Depende de: 2.2

#### 2.5 - Conectar interceptor y guard en app.config
- Reemplazar stub del interceptor con import real
- Depende de: 1.6, 2.3, 2.4

---

### Fase 3: Auth Feature (7 tareas)

#### 3.1 - Crear AuthService
- Signals: currentUser, isAuthenticated (computed), loading
- Metodos: login, createUser, refreshToken, logout, restoreSession
- Mensajes de error en espanol
- Depende de: 2.1, 2.2

#### 3.2 - Crear LoginPage (container)
- Orquesta flujo: login -> 404 -> CreateUserDialog -> createUser
- Errores via MatSnackBar
- Layout centrado con min-h-screen
- Depende de: 3.1, 3.3, 3.4

#### 3.3 - Crear LoginForm (presentational)
- Reactive form con email (required + Validators.email)
- input(loading), output(emailSubmitted)
- Mensajes de validacion en espanol
- Depende de: 1.3

#### 3.4 - Crear CreateUserDialog
- Material dialog con MAT_DIALOG_DATA { email }
- "Crear cuenta" -> true, "Cancelar" -> false
- disableClose: true, aria-labelledby
- Depende de: 1.1

#### 3.5 - Crear auth routes
- AUTH_ROUTES con LoginPage como ruta default
- Depende de: 3.2

#### 3.6 - Conectar auth en app.routes.ts
- path 'login' con loadChildren + guestGuard
- Redirect default y wildcard
- Depende de: 2.4, 3.5

#### 3.7 - Test de integracion del flujo auth
- Verificar todos los escenarios de login/creacion/logout
- Depende de: 3.1-3.6

---

### Fase 4: Tasks Feature (10 tareas)

#### 4.1 - Crear TaskService
- Signals: tasks, loading. Computed: totalTasks, completedTasks, pendingTasks
- Metodos: loadTasks (sort createdAt desc), createTask, updateTask, deleteTask, toggleTask (optimistic)
- Depende de: 2.1

#### 4.2 - Crear MainPage (container)
- Orquesta CRUD: onCreate, onToggle, onEdit (dialog), onDelete (confirm dialog)
- Layout: TopNav + main con max-w-4xl
- Depende de: 4.1, 4.3-4.8, 5.1

#### 4.3 - Crear StatsCards
- 3 MatCard: Total, Completadas, Pendientes (computed signals)
- Grid responsive: 1 col mobile, 3 cols tablet+
- Depende de: 4.1, 1.1

#### 4.4 - Crear AddTaskForm
- Reactive form: title (req, max 100), description (req, max 500), priority? (select), dueDate? (datepicker)
- input(loading), output(taskCreated)
- Depende de: 1.1, 2.1

#### 4.5 - Crear TaskList
- input.required(tasks), outputs: toggle, edit, delete
- @for con track task.id, empty state "No tienes tareas pendientes"
- Depende de: 4.6

#### 4.6 - Crear TaskCard
- MatCard con checkbox, titulo (strikethrough si completed), descripcion (line-clamp-2), fecha (DatePipe es), priority chip, botones edit/delete
- Tab order: checkbox -> edit -> delete
- Depende de: 1.1, 2.1

#### 4.7 - Crear EditTaskDialog
- Form pre-populated con datos de tarea
- Solo retorna campos que cambiaron
- Misma validacion que AddTaskForm
- Depende de: 1.1, 2.1

#### 4.8 - Crear tasks routes
- TASKS_ROUTES con MainPage como ruta default
- Depende de: 4.2

#### 4.9 - Conectar tasks en app.routes.ts
- path 'tasks' con loadChildren + authGuard
- Depende de: 2.4, 4.8

#### 4.10 - Test de integracion del flujo tasks
- CRUD completo, toggle, empty state, errores
- Depende de: 4.1-4.9

---

### Fase 5: Shared & Integration (4 tareas)

#### 5.1 - Crear TopNav
- MatToolbar sticky con titulo, email del usuario, boton logout
- aria-label="Cerrar sesion"
- Depende de: 3.1, 1.1

#### 5.2 - Crear ConfirmDialog (shared)
- MAT_DIALOG_DATA { title, message, confirmText, cancelText }
- Generico y reutilizable
- Depende de: 1.1

#### 5.3 - Finalizar app.routes.ts
- Verificar todas las rutas, guards, lazy loading, redirects
- Depende de: 3.6, 4.9

#### 5.4 - Test de integracion completo
- Flujo end-to-end: login -> CRUD tasks -> logout -> re-login
- Token persistence, 401 refresh flow
- Depende de: todas las anteriores

---

### Fase 6: Polish & Quality (4 tareas)

#### 6.1 - Verificacion responsive
- Mobile (375px, 390px), Tablet (768px), Desktop (1024px, 1440px)
- Touch targets >= 44x44px
- Sin scroll horizontal

#### 6.2 - Auditoria WCAG AA
- AXE DevTools en ambas paginas
- Focus management, ARIA, keyboard nav, color contrast
- Zero violaciones criticas/serias

#### 6.3 - Loading states y error handling
- Spinners en carga inicial, botones de submit, toggles
- MatSnackBar para errores (5s, boton "Cerrar")
- Mensajes en espanol

#### 6.4 - Polish visual final
- Consistencia de spacing, sombras, border radius
- Tipografia jerarquica, empty states
- Animaciones suaves

---

## Grafo de Dependencias

```
Fase 1 (Infra)
  1.1, 1.2, 1.4 --- sin deps (paralelo)
  1.3 ------------- depende de 1.1, 1.2
  1.5 ------------- depende de 1.4
  1.6 ------------- depende de 1.3
  1.7 ------------- depende de 1.3

Fase 2 (Core)
  2.1, 2.2 -------- sin deps (paralelo)
  2.3 ------------- depende de 2.1, 2.2
  2.4 ------------- depende de 2.2
  2.5 ------------- depende de 1.6, 2.3, 2.4

Fase 3 (Auth)
  3.1 ------------- depende de 2.1, 2.2
  3.3, 3.4 -------- depende de 1.1 (paralelo)
  3.2 ------------- depende de 3.1, 3.3, 3.4
  3.5 ------------- depende de 3.2
  3.6 ------------- depende de 2.4, 3.5

Fase 4 (Tasks)
  4.1 ------------- depende de 2.1
  4.3, 4.4, 4.6 --- depende de 1.1, 2.1 (paralelo)
  4.5 ------------- depende de 4.6
  4.7 ------------- depende de 1.1, 2.1
  4.2 ------------- depende de 4.1, 4.3-4.7, 5.1
  4.8 ------------- depende de 4.2
  4.9 ------------- depende de 2.4, 4.8

Fase 5 (Shared)
  5.1 ------------- depende de 3.1, 1.1
  5.2 ------------- depende de 1.1
  5.3 ------------- depende de 3.6, 4.9
  5.4 ------------- depende de todo

Fase 6 (Polish)
  6.1, 6.2, 6.3 --- depende de 5.4 (paralelo)
  6.4 ------------- depende de 6.1, 6.2, 6.3
```

## Ruta Critica

1.1+1.2 -> 1.3 -> 1.6 -> 2.1+2.2 -> 2.3 -> 2.5 -> 3.1 -> 3.2 -> 3.5 -> 3.6 -> 4.1 -> 4.2 -> 4.8 -> 4.9 -> 5.3 -> 5.4 -> 6.4

---

## Riesgos

| Riesgo | Prob. | Mitigacion |
|--------|-------|------------|
| Tailwind + Material conflicto | Media | Tailwind para layout, Material para componentes. Preflight cuidadoso |
| Race condition refresh token | Media-Alta | Queue en interceptor con BehaviorSubject |
| ng2-charts incompatible Angular 21 | Media | Fallback: wrapper directo de chart.js |
| localStorage XSS | Baja | Angular sanitiza. Futuro: HttpOnly cookies |
| Bundle size excede budget | Media | Lazy loading, tree-shaking, ajustar budgets |

---

## Para continuar en la proxima sesion

1. Ejecutar `mem_search(query: "sdd/todo-app/tasks", project: "todo-frontend")` y `mem_get_observation(id: 340)` para obtener las tareas completas
2. Iniciar con `/sdd-apply` desde la Fase 1
3. Las tareas 1.1, 1.2 y 1.4 pueden ejecutarse en paralelo
4. Despues de cada fase, hacer commit
