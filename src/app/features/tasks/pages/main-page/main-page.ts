import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { NgOptimizedImage } from '@angular/common'

import { Subject, debounceTime } from 'rxjs'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatIconModule } from '@angular/material/icon'

import { TaskService } from '../../services/task.service'
import { AuthService } from '../../../../core/services/auth.service'
import { StatsCards } from '../../components/stats-cards/stats-cards'
import { TaskList } from '../../components/task-list/task-list'
import { TaskProgressRing } from '../../components/task-progress-ring/task-progress-ring'
import { UpcomingDeadlines } from '../../components/upcoming-deadlines/upcoming-deadlines'
import { TopPriorityTasks } from '../../components/top-priority-tasks/top-priority-tasks'
import { TaskFilterPanel } from '../../components/task-filters/task-filters'
import { AddTaskDialog } from '../../components/add-task-dialog/add-task-dialog'
import { EditTaskDialog } from '../../components/edit-task-dialog/edit-task-dialog'
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog'
import {
  Task,
  TaskFilters,
  EMPTY_TASK_FILTERS,
  CreateTaskRequest,
  UpdateTaskRequest
} from '../../../../core/models/task.model'
import { filterTasks } from '../../utils/task-filter.utils'
import { TopNav } from '../../../../shared/components/top-nav/top-nav'

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-h-screen bg-background' },
  styles: [
    `
      .tasks-list-scroll {
        scrollbar-width: thin;
        scrollbar-color: rgba(108, 99, 255, 0.25) transparent;
      }
      .tasks-list-scroll::-webkit-scrollbar {
        width: 4px;
      }
      .tasks-list-scroll::-webkit-scrollbar-track {
        background: transparent;
      }
      .tasks-list-scroll::-webkit-scrollbar-thumb {
        background: rgba(108, 99, 255, 0.25);
        border-radius: 2px;
      }
      .tasks-list-scroll::-webkit-scrollbar-thumb:hover {
        background: rgba(108, 99, 255, 0.45);
      }
    `
  ],
  imports: [
    MatProgressSpinnerModule,
    MatIconModule,
    NgOptimizedImage,
    StatsCards,
    TaskList,
    TaskProgressRing,
    UpcomingDeadlines,
    TopPriorityTasks,
    TaskFilterPanel,
    TopNav
  ]
})
export class MainPage implements OnInit {
  private readonly taskService = inject(TaskService)
  private readonly authService = inject(AuthService)
  private readonly dialog = inject(MatDialog)
  private readonly snackBar = inject(MatSnackBar)
  readonly tasks = this.taskService.tasks
  readonly loading = this.taskService.loading
  readonly loadingMore = this.taskService.loadingMore
  readonly hasMore = this.taskService.hasMore
  readonly totalTasks = this.taskService.totalTasks
  readonly completedTasks = this.taskService.completedTasks
  readonly pendingTasks = this.taskService.pendingTasks

  readonly creating = signal(false)

  /** Texto ingresado en la barra de búsqueda (valor con debounce aplicado) */
  readonly searchQuery = signal('')

  /** Valor actual del input (sin debounce, para mantener el binding visual) */
  readonly searchInputValue = signal('')

  /** Subject que recibe cada keystroke del input de búsqueda */
  private readonly searchInput$ = new Subject<string>()

  constructor() {
    this.searchInput$
      .pipe(debounceTime(300), takeUntilDestroyed())
      .subscribe((value) => this.searchQuery.set(value))
  }

  /** Filtros activos emitidos por TaskFilterPanel al hacer clic en "Aplicar" */
  readonly activeFilters = signal<TaskFilters>({ ...EMPTY_TASK_FILTERS, priorities: [] })

  /**
   * True cuando hay al menos un filtro de panel activo (prioridad o fecha).
   * Usado en el template para mostrar el indicador de filtros activos
   * junto al contador de resultados.
   */
  readonly hasActiveFilters = computed(() => {
    const f = this.activeFilters()
    return f.priorities.length > 0 || f.dueDateRange !== null
  })

  /**
   * Lista de tareas filtrada por texto de búsqueda + filtros del panel.
   *
   * Orden de aplicación:
   *   1. Texto de búsqueda (título y descripción, case-insensitive)
   *   2. Prioridades seleccionadas (OR entre las opciones marcadas)
   *   3. Rango de fecha de vencimiento
   */
  readonly filteredTasks = computed(() =>
    filterTasks(
      this.tasks(),
      {
        search: this.searchQuery(),
        priorities: this.activeFilters().priorities,
        dueDateRange: this.activeFilters().dueDateRange
      },
      new Date()
    )
  )

  /**
   * Nombre del usuario actual obtenido del perfil.
   * Fallback al email si no hay nombre disponible.
   */
  readonly userName = computed(() => {
    const user = this.authService.currentUser()
    if (user?.name) return user.name
    const email = user?.email ?? ''
    if (!email) return 'Atom'
    const namePart = email.split('@')[0]
    return namePart.charAt(0).toUpperCase() + namePart.slice(1)
  })

  /**
   * Inicial del usuario para mostrar en el avatar.
   */
  readonly userInitial = computed(() => this.userName().charAt(0).toUpperCase())

  ngOnInit(): void {
    this.taskService.loadTasks()
  }

  /** Maneja el evento input de la barra de búsqueda con debounce */
  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value
    this.searchInputValue.set(value)
    this.searchInput$.next(value)
  }

  /** Recibe los filtros confirmados desde TaskFilterPanel */
  onFiltersChange(filters: TaskFilters): void {
    this.activeFilters.set(filters)
  }

  openAddTaskDialog(): void {
    const dialogRef = this.dialog.open(AddTaskDialog, {
      disableClose: true,
      width: '500px'
    })

    dialogRef.afterClosed().subscribe((payload: CreateTaskRequest | undefined) => {
      if (!payload) return

      this.creating.set(true)
      this.taskService.createTask(payload).subscribe({
        next: () => {
          this.creating.set(false)
          this.snackBar.open('Tarea creada exitosamente', 'Cerrar', { duration: 3000 })
        },
        error: () => {
          this.creating.set(false)
        }
      })
    })
  }

  onToggle(taskId: string): void {
    this.taskService.toggleTask(taskId).subscribe({ error: (err: unknown) => console.error('Toggle failed', err) })
  }

  onEdit(task: Task): void {
    const dialogRef = this.dialog.open(EditTaskDialog, {
      data: { task },
      disableClose: true,
      width: '500px'
    })

    dialogRef.afterClosed().subscribe((changes: UpdateTaskRequest | undefined) => {
      if (changes) {
        this.taskService.updateTask(task.id, changes).subscribe({
          next: () => this.snackBar.open('Tarea actualizada', 'Cerrar', { duration: 3000 }),
          error: (err: unknown) => console.error('Update failed', err)
        })
      }
    })
  }

  onDeleteCompleted(): void {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      data: {
        title: 'Eliminar completadas',
        message: this.completedTasks() === 1
          ? '¿Estás seguro de que deseas eliminar la tarea completada?'
          : `¿Estás seguro de que deseas eliminar las ${this.completedTasks()} tareas completadas?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      },
      disableClose: true
    })

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.taskService.deleteCompletedTasks().subscribe({
          next: (deletedCount) =>
            this.snackBar.open(
              `${deletedCount} tarea${deletedCount !== 1 ? 's' : ''} completada${deletedCount !== 1 ? 's' : ''} eliminada${deletedCount !== 1 ? 's' : ''}`,
              'Cerrar',
              { duration: 3000 }
            ),
          error: (err: unknown) => console.error('Delete completed failed', err)
        })
      }
    })
  }

  onDelete(task: Task): void {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      data: {
        title: 'Eliminar tarea',
        message: `¿Estás seguro de que deseas eliminar "${task.title}"?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      },
      disableClose: true
    })

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.taskService.deleteTask(task.id).subscribe({
          next: () => this.snackBar.open('Tarea eliminada exitosamente', 'Cerrar', { duration: 3000 }),
          error: (err: unknown) => console.error('Delete failed', err)
        })
      }
    })
  }

  loadMore(): void {
    this.taskService.loadMore()
  }
}
