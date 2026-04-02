# ✅ Atom Todo

> Gestor de tareas moderno, rapido y elegante construido con Angular 21 y desplegado en Firebase.

<p align="center">
  <img src="https://img.shields.io/badge/Angular-21-DD0031?logo=angular&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.2-06B6D4?logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Angular_Material-21-757575?logo=angular&logoColor=white" />
  <img src="https://img.shields.io/badge/Firebase-Hosting-FFCA28?logo=firebase&logoColor=black" />
</p>

---

## 📋 Que es Atom Todo?

Atom Todo es una aplicacion de gestion de tareas con autenticacion JWT, filtrado inteligente, estadisticas en tiempo real y una interfaz completamente responsiva. Toda la UI esta en espanol.

### Funcionalidades principales

| Funcionalidad | Descripcion |
|---|---|
| 🔐 **Autenticacion JWT** | Login, registro, refresh automatico de tokens y restauracion de sesion |
| 📝 **CRUD de tareas** | Crear, editar, eliminar y marcar como completadas |
| 🎯 **Prioridades** | Baja, media y alta con badges visuales de color |
| 🔍 **Busqueda y filtrado** | Por titulo, prioridad y rango de fecha de vencimiento |
| 📊 **Estadisticas en vivo** | Total, completadas, pendientes y anillo de progreso |
| ⚡ **Updates optimistas** | Toggle de completado instantaneo con rollback si falla |
| 📱 **Responsivo** | Grid adaptativo para desktop y movil |
| ♿ **Accesible** | WCAG AA, ARIA labels, focus-visible, roles semanticos |

---

## 🏗️ Stack Tecnologico

```
Frontend       Angular 21 (Standalone components, Signals, OnPush)
Estilos        Tailwind CSS v4 + Angular Material (violet theme)
Estado         Angular Signals + RxJS (sin Redux/NgRx)
Autenticacion  JWT con access + refresh tokens
Testing        Playwright (E2E) + Vitest (unitarios)
Deploy         Firebase Hosting
Lenguaje       TypeScript 5.9 (strict mode)
```

---

## 📁 Estructura del Proyecto

```
src/app/
├── core/                    # Infraestructura compartida
│   ├── guards/              #   Auth guard y guest guard
│   ├── interceptors/        #   JWT injection + refresh queue
│   ├── models/              #   Interfaces (Task, User, Auth, API)
│   └── services/            #   AuthService, TokenStorage, TokenRefresh
│
├── features/                # Features con lazy loading
│   ├── auth/                #   Login + registro (dialog modal)
│   ├── tasks/               #   Dashboard principal de tareas
│   │   ├── components/      #     11 componentes especializados
│   │   ├── services/        #     TaskService (CRUD + signals)
│   │   └── utils/           #     Logica de filtrado
│   └── profile/             #   Perfil de usuario
│
├── shared/                  # Componentes reutilizables
│   └── components/          #   TopNav, ConfirmDialog
│
├── app.routes.ts            # Rutas con lazy loading
└── app.config.ts            # Providers (Zoneless, Router, HTTP, Material)
```

---

## 🚀 Inicio Rapido

### Prerrequisitos

- **Node.js** >= 20
- **Angular CLI** >= 21

### Instalacion

```bash
# Clonar el repositorio
git clone https://github.com/Atom/todo-frontend.git
cd todo-frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start
```

La app estara disponible en `http://localhost:4200/`

### Scripts disponibles

| Comando | Descripcion |
|---|---|
| `npm start` | Servidor de desarrollo |
| `npm run build` | Build de produccion |
| `npm run lint` | Linting con ESLint |
| `npm run format` | Formateo con Prettier |
| `npm test` | Tests unitarios (Vitest) |
| `npm run e2e` | Tests E2E (Playwright) |
| `npm run e2e:ui` | Tests E2E con interfaz grafica |

---

## 🔐 Flujo de Autenticacion

```
┌─────────────┐    POST /auth/login     ┌───────────┐
│  Login Form │ ──────────────────────── │    API    │
└──────┬──────┘                          └─────┬─────┘
       │                                       │
       │  Si 404 (usuario no existe)           │  AccessToken + RefreshToken
       │                                       │
       ▼                                       ▼
┌──────────────────┐               ┌────────────────────┐
│ CreateUserDialog │               │  localStorage      │
│ (registro modal) │               │  + redirect /tasks │
└──────────────────┘               └────────────────────┘

Al recargar la app:
  restoreSession() → GET /users/me → restaura sesion desde token almacenado

Ante un 401:
  TokenRefreshService → POST /auth/refresh → retry con nuevo token
  (requests en cola esperan al refresh)
```

---

## 🎨 Tema y Estilos

El proyecto usa un tema **violet** personalizado con Tailwind CSS v4 y Angular Material:

```css
/* Design tokens principales */
--color-primary:       #6c63ff    /* Violeta principal */
--color-primary-light: #a29bfe    /* Violeta claro */
--color-accent:        #06d6a0    /* Verde accent */
--color-success:       #00b894    /* Exito */
--color-error:         #e17055    /* Error */
--color-warning:       #fdcb6e    /* Advertencia */
```

---

## 🌐 API

La app se conecta a un backend en Cloud Functions de Firebase:

| Metodo | Endpoint | Descripcion |
|---|---|---|
| `POST` | `/auth/login` | Iniciar sesion |
| `POST` | `/auth/refresh` | Renovar tokens |
| `POST` | `/auth/logout` | Cerrar sesion |
| `POST` | `/users` | Crear usuario |
| `GET` | `/users/me` | Perfil del usuario actual |
| `GET` | `/tasks` | Listar tareas (paginacion por cursor) |
| `POST` | `/tasks` | Crear tarea |
| `PUT` | `/tasks/:id` | Actualizar tarea |
| `DELETE` | `/tasks/:id` | Eliminar tarea |
| `DELETE` | `/tasks/completed` | Eliminar completadas |

**Entornos:**
- Desarrollo: `http://127.0.0.1:5001/demo-todo-api/us-central1/api/v1`
- Produccion: `https://us-central1-atom-todo-9da7d.cloudfunctions.net/api/v1`

---

## 🧩 Componentes Principales

```
MainPage
├── StatsCards              Metricas: total, completadas, pendientes
├── TaskProgressRing        Anillo visual de progreso
├── TopPriorityTasks        Top 3 tareas de alta prioridad
├── UpcomingDeadlines       Proximas fechas de vencimiento
├── TaskFilters             Filtros por prioridad y fecha
├── TaskList                Lista paginada con "cargar mas"
│   └── TaskCard            Tarjeta individual con acciones
├── AddTaskDialog           Modal para crear tarea
└── EditTaskDialog          Modal para editar tarea
```

---

## ⚙️ Decisiones Tecnicas

| Decision | Eleccion | Razon |
|---|---|---|
| Estado | Signals | Reactivo, sin boilerplate, nativo de Angular |
| Deteccion de cambios | OnPush + Zoneless | Maximo rendimiento |
| Modulos | Standalone-first | Sin NgModules, imports directos |
| Estilos | Tailwind v4 + Material | Utilidades CSS + componentes Material maduros |
| Paginacion | Cursor-based | Mas eficiente que offset para listas dinamicas |
| Testing | E2E primero | Prioridad en flujos completos sobre unitarios aislados |