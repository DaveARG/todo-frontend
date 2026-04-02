import { Component, ChangeDetectionStrategy, input, output } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'

import { Task } from '../../../../core/models/task.model'
import { TaskCard } from '../task-card/task-card'

@Component({
  selector: 'app-task-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TaskCard, MatIconModule, MatProgressSpinnerModule],
  host: { class: 'block h-full' },
  template: `
    @if (tasks().length === 0) {
      <div
        class="flex flex-col items-center justify-center gap-4 px-8 py-14 text-center bg-surface rounded-xl border border-dashed border-primary/[0.18] h-full min-h-[280px]"
        role="status"
      >
        @if (hasFiltersActive()) {
          <!-- Estado vacío por filtros -->
          <div class="relative" aria-hidden="true">
            <div
              class="w-16 h-16 bg-gradient-to-br from-primary/[0.1] to-primary/[0.04] rounded-2xl flex items-center justify-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.8)]"
            >
              <mat-icon class="!text-[30px] !w-[30px] !h-[30px] text-primary-light">filter_list_off</mat-icon>
            </div>
          </div>

          <div class="flex flex-col gap-1">
            <p class="text-[0.9375rem] font-bold text-on-surface m-0">No se encontraron tareas con los filtros aplicados</p>
            <p class="text-sm text-on-surface-secondary m-0 leading-relaxed">
              Prueba con otros filtros o limpia la búsqueda
            </p>
          </div>
        } @else {
          <!-- Estado vacío sin tareas -->
          <div class="relative" aria-hidden="true">
            <div
              class="w-16 h-16 bg-gradient-to-br from-primary/[0.1] to-primary/[0.04] rounded-2xl flex items-center justify-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.8)]"
            >
              <mat-icon class="!text-[30px] !w-[30px] !h-[30px] text-primary-light">inbox</mat-icon>
            </div>
            <!-- Punto decorativo -->
            <span
              class="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center shadow-[0_2px_4px_rgba(108,99,255,0.4)]"
            >
              <mat-icon class="!text-[9px] !w-[9px] !h-[9px] text-white">add</mat-icon>
            </span>
          </div>

          <div class="flex flex-col gap-1">
            <p class="text-[0.9375rem] font-bold text-on-surface m-0">Sin tareas por ahora</p>
            <p class="text-sm text-on-surface-secondary m-0 leading-relaxed">
              Usa el botón <span class="font-semibold text-primary">"Agregar tarea"</span><br />para
              comenzar tu lista
            </p>
          </div>
        }
      </div>
    } @else {
      <ul class="list-none p-0 m-0 flex flex-col gap-3" role="list">
        @for (task of tasks(); track task.id) {
          <li role="listitem">
            <app-task-card
              [task]="task"
              (toggleTask)="toggleTask.emit($event)"
              (editTask)="editTask.emit($event)"
              (deleteTask)="deleteTask.emit($event)"
            />
          </li>
        }
      </ul>

      <!-- Botón "Cargar más" -->
      @if (hasMore()) {
        <div class="flex justify-center pt-4 pb-2">
          <button
            type="button"
            class="inline-flex items-center gap-2 h-10 px-6 bg-transparent border border-primary/25 rounded-pill text-sm font-semibold text-primary cursor-pointer transition-all duration-200 hover:bg-primary/[0.06] hover:border-primary/40 hover:shadow-[0_2px_8px_rgba(108,99,255,0.15)] active:bg-primary/[0.1] focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-primary/25 disabled:hover:shadow-none"
            [disabled]="loadingMore()"
            (click)="loadMore.emit()"
            aria-label="Cargar más tareas"
          >
            @if (loadingMore()) {
              <mat-spinner diameter="18" aria-hidden="true" />
              <span>Cargando...</span>
            } @else {
              <mat-icon class="!text-[18px] !w-[18px] !h-[18px]" aria-hidden="true"
                >expand_more</mat-icon
              >
              <span>Cargar más</span>
            }
          </button>
        </div>
      }
    }
  `
})
export class TaskList {
  readonly tasks = input.required<Task[]>()
  readonly loadingMore = input(false)
  readonly hasMore = input(false)
  readonly hasFiltersActive = input(false)
  readonly toggleTask = output<string>()
  readonly editTask = output<Task>()
  readonly deleteTask = output<Task>()
  readonly loadMore = output<void>()
}
