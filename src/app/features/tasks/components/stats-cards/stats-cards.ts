import { Component, ChangeDetectionStrategy, inject } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'

import { TaskService } from '../../services/task.service'

@Component({
  selector: 'app-stats-cards',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  host: { class: 'block' },
  template: `
    <div
      class="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4 max-[480px]:grid-cols-2 max-[480px]:gap-3"
      role="list"
      aria-label="Estadísticas de tareas"
    >
      <!-- Total -->
      <article
        class="relative flex items-center gap-4 bg-background rounded-xl px-6 py-5 shadow-neu border-none transition-all duration-200 ease-in-out hover:shadow-neu-hover hover:-translate-y-0.5 active:shadow-neu-inset active:translate-y-0 max-[480px]:p-4 max-[480px]:gap-3 overflow-hidden"
        role="listitem"
      >
        <!-- Fondo decorativo sutil -->
        <div
          class="absolute -right-3 -bottom-3 w-16 h-16 rounded-full bg-primary/[0.05] pointer-events-none"
          aria-hidden="true"
        ></div>

        <div
          class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-primary/15 to-primary/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] max-[480px]:w-10 max-[480px]:h-10"
          aria-hidden="true"
        >
          <mat-icon class="!text-[22px] !w-[22px] !h-[22px] text-primary">task_alt</mat-icon>
        </div>
        <div class="min-w-0 relative">
          <div
            class="text-[1.875rem] font-extrabold leading-none text-primary tracking-tight max-[480px]:text-2xl"
            aria-hidden="true"
          >
            {{ totalTasks() }}
          </div>
          <div
            class="text-xs font-semibold text-on-surface-secondary mt-1.5 uppercase tracking-wider"
            aria-hidden="true"
          >
            Total
          </div>
        </div>
      </article>

      <!-- Pendientes -->
      <article
        class="relative flex items-center gap-4 bg-background rounded-xl px-6 py-5 shadow-neu border-none transition-all duration-200 ease-in-out hover:shadow-neu-hover hover:-translate-y-0.5 active:shadow-neu-inset active:translate-y-0 max-[480px]:p-4 max-[480px]:gap-3 overflow-hidden"
        role="listitem"
      >
        <div
          class="absolute -right-3 -bottom-3 w-16 h-16 rounded-full bg-[rgba(217,119,6,0.05)] pointer-events-none"
          aria-hidden="true"
        ></div>

        <div
          class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-[rgba(255,209,102,0.25)] to-[rgba(255,209,102,0.08)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] max-[480px]:w-10 max-[480px]:h-10"
          aria-hidden="true"
        >
          <mat-icon class="!text-[22px] !w-[22px] !h-[22px] text-[#D97706]"
            >pending_actions</mat-icon
          >
        </div>
        <div class="min-w-0 relative">
          <div
            class="text-[1.875rem] font-extrabold leading-none text-[#D97706] tracking-tight max-[480px]:text-2xl"
            aria-hidden="true"
          >
            {{ pendingTasks() }}
          </div>
          <div
            class="text-xs font-semibold text-on-surface-secondary mt-1.5 uppercase tracking-wider"
            aria-hidden="true"
          >
            Pendientes
          </div>
        </div>
      </article>

      <!-- Completadas -->
      <article
        class="relative flex items-center gap-4 bg-background rounded-xl px-6 py-5 shadow-neu border-none transition-all duration-200 ease-in-out hover:shadow-neu-hover hover:-translate-y-0.5 active:shadow-neu-inset active:translate-y-0 max-[480px]:p-4 max-[480px]:gap-3 overflow-hidden"
        role="listitem"
      >
        <div
          class="absolute -right-3 -bottom-3 w-16 h-16 rounded-full bg-[rgba(6,214,160,0.06)] pointer-events-none"
          aria-hidden="true"
        ></div>

        <div
          class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-[rgba(6,214,160,0.18)] to-[rgba(6,214,160,0.06)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] max-[480px]:w-10 max-[480px]:h-10"
          aria-hidden="true"
        >
          <mat-icon class="!text-[22px] !w-[22px] !h-[22px] text-[#059669]">check_circle</mat-icon>
        </div>
        <div class="min-w-0 relative">
          <div
            class="text-[1.875rem] font-extrabold leading-none text-[#059669] tracking-tight max-[480px]:text-2xl"
            aria-hidden="true"
          >
            {{ completedTasks() }}
          </div>
          <div
            class="text-xs font-semibold text-on-surface-secondary mt-1.5 uppercase tracking-wider"
            aria-hidden="true"
          >
            Completadas
          </div>
        </div>
      </article>
    </div>
  `
})
export class StatsCards {
  private readonly taskService = inject(TaskService)
  readonly totalTasks = this.taskService.totalTasks
  readonly completedTasks = this.taskService.completedTasks
  readonly pendingTasks = this.taskService.pendingTasks
}
