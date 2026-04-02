import { Injectable, inject, signal, computed } from '@angular/core'
import { HttpClient, HttpErrorResponse } from '@angular/common/http'
import { MatSnackBar } from '@angular/material/snack-bar'
import { Observable, Subscription, throwError } from 'rxjs'
import { catchError, map, tap } from 'rxjs/operators'

import {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskListResponse,
  TaskResponse,
  DeleteCompletedResponse
} from '../../../core/models/task.model'
import { environment } from '../../../../environments/environment'

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient)
  private readonly snackBar = inject(MatSnackBar)

  private readonly _tasks = signal<Task[]>([])
  private readonly _loading = signal(false)
  private readonly _loadingMore = signal(false)
  private readonly _nextCursor = signal<string | null>(null)
  private loadTasksSub?: Subscription

  readonly tasks = this._tasks.asReadonly()
  readonly loading = this._loading.asReadonly()
  readonly loadingMore = this._loadingMore.asReadonly()
  readonly nextCursor = this._nextCursor.asReadonly()

  readonly hasMore = computed(() => this._nextCursor() !== null)
  readonly totalTasks = computed(() => this._tasks().length)
  readonly completedTasks = computed(() => this._tasks().filter((t) => t.completed).length)
  readonly pendingTasks = computed(() => this._tasks().filter((t) => !t.completed).length)
  loadTasks(): void {
    this.loadTasksSub?.unsubscribe()
    this._loading.set(true)
    this._nextCursor.set(null)

    this.loadTasksSub = this.http
      .get<TaskListResponse>(`${environment.apiUrl}/tasks`, {
        params: { limit: '20', sortBy: 'createdAt', sortOrder: 'desc' }
      })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          this._loading.set(false)
          this.showError(error)
          return throwError(() => error)
        })
      )
      .subscribe((response) => {
        this._tasks.set(response.data.items)
        this._nextCursor.set(response.data.nextCursor)
        this._loading.set(false)
      })
  }

  loadMore(): void {
    const cursor = this._nextCursor()
    if (!cursor || this._loadingMore()) return

    this._loadingMore.set(true)

    this.http
      .get<TaskListResponse>(`${environment.apiUrl}/tasks`, {
        params: { limit: '20', cursor, sortBy: 'createdAt', sortOrder: 'desc' }
      })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          this._loadingMore.set(false)
          this.showError(error)
          return throwError(() => error)
        })
      )
      .subscribe((response) => {
        this._tasks.update((existing) => [...existing, ...response.data.items])
        this._nextCursor.set(response.data.nextCursor)
        this._loadingMore.set(false)
      })
  }

  createTask(payload: CreateTaskRequest): Observable<Task> {
    return this.http.post<TaskResponse>(`${environment.apiUrl}/tasks`, payload).pipe(
      map((response) => response.data),
      tap((task) => {
        this._tasks.update((tasks) => [task, ...tasks])
      }),
      catchError((error: HttpErrorResponse) => {
        this.showError(error)
        return throwError(() => error)
      })
    )
  }

  updateTask(id: string, payload: UpdateTaskRequest): Observable<Task> {
    return this.http.put<TaskResponse>(`${environment.apiUrl}/tasks/${id}`, payload).pipe(
      map((response) => response.data),
      tap((updated) => {
        this._tasks.update((tasks) => tasks.map((t) => (t.id === id ? updated : t)))
      }),
      catchError((error: HttpErrorResponse) => {
        this.showError(error)
        return throwError(() => error)
      })
    )
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/tasks/${id}`).pipe(
      tap(() => {
        this._tasks.update((tasks) => tasks.filter((t) => t.id !== id))
      }),
      catchError((error: HttpErrorResponse) => {
        this.showError(error)
        return throwError(() => error)
      })
    )
  }

  deleteCompletedTasks(): Observable<number> {
    return this.http
      .delete<DeleteCompletedResponse>(`${environment.apiUrl}/tasks/completed`)
      .pipe(
        map((response) => response.data.deletedCount),
        tap(() => {
          this._tasks.update((tasks) => tasks.filter((t) => !t.completed))
        }),
        catchError((error: HttpErrorResponse) => {
          this.showError(error)
          return throwError(() => error)
        })
      )
  }

  toggleTask(id: string): Observable<Task> {
    const previous = this._tasks()
    const current = previous.find((t) => t.id === id)
    if (!current) return throwError(() => new Error(`Task ${id} not found`))

    // Optimistic update
    this._tasks.update((tasks) =>
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    )

    return this.http
      .put<TaskResponse>(`${environment.apiUrl}/tasks/${id}`, {
        completed: !current.completed
      })
      .pipe(
        map((response) => response.data),
        tap((updated) => {
          this._tasks.update((tasks) => tasks.map((t) => (t.id === id ? updated : t)))
        }),
        catchError((error: HttpErrorResponse) => {
          // Revert optimistic update
          this._tasks.set(previous)
          this.showError(error)
          return throwError(() => error)
        })
      )
  }

  private showError(error: HttpErrorResponse): void {
    const message =
      error.status === 0
        ? 'Sin conexión. Verifique su red e intente de nuevo.'
        : (error.error?.error ?? 'Ha ocurrido un error inesperado')
    this.snackBar.open(message, 'Cerrar', { duration: 5000 })
  }
}
