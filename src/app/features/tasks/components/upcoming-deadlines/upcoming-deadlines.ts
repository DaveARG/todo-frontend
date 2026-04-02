import { Component, ChangeDetectionStrategy, input, computed, signal, OnDestroy } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'

import { Task } from '../../../../core/models/task.model'

interface DeadlineItem {
  id: string
  title: string
  daysLeft: number
  /** 'overdue' | 'today' | 'tomorrow' | 'soon' */
  status: 'overdue' | 'today' | 'tomorrow' | 'soon'
  label: string
}

/**
 * Muestra las 4 tareas pendientes con fecha de vencimiento más próximas.
 * Las tareas vencidas aparecen primero, luego las más urgentes.
 */
@Component({
  selector: 'app-upcoming-deadlines',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  host: { class: 'block' },
  template: `
    @if (items().length === 0) {
      <div
        class="flex flex-col items-center justify-center py-6 px-4 gap-2 text-center"
        role="status"
        aria-label="Sin tareas con fecha límite"
      >
        <div
          class="w-11 h-11 rounded-full bg-[rgba(244,162,97,0.1)] flex items-center justify-center mb-0.5"
          aria-hidden="true"
        >
          <mat-icon class="!text-[1.375rem] !w-[22px] !h-[22px] text-[#f4a261]"
            >event_available</mat-icon
          >
        </div>
        <p class="text-[0.8125rem] font-semibold text-on-surface m-0 leading-snug">
          Sin fechas límite
        </p>
        <p class="text-[0.75rem] text-on-surface-muted m-0 leading-snug">
          Las tareas con fecha límite<br />aparecerán aquí
        </p>
      </div>
    } @else {
      <ul class="list-none p-0 m-0 flex flex-col" aria-label="Tareas próximas a vencer">
        @for (item of items(); track item.id; let i = $index) {
          <li
            class="deadline-item flex items-center gap-2.5 py-2 border-b border-black/5 last:border-b-0 rounded-xs transition-colors duration-150 ease-in-out hover:bg-primary/[0.03]"
            [class.deadline-item--overdue]="item.status === 'overdue'"
            [style.animation-delay.ms]="i * 60"
          >
            <span
              class="shrink-0 w-[30px] h-[30px] rounded-full bg-primary/[0.07] flex items-center justify-center"
              aria-hidden="true"
            >
              <mat-icon class="deadline-icon !text-[16px] !w-4 !h-4 text-[#f4a261]">
                {{ item.status === 'overdue' ? 'warning' : 'schedule' }}
              </mat-icon>
            </span>
            <span
              class="flex-1 min-w-0 text-[0.8125rem] font-medium text-on-surface whitespace-nowrap overflow-hidden text-ellipsis leading-snug"
              [title]="item.title"
              >{{ item.title }}</span
            >
            <span
              class="shrink-0 inline-flex items-center py-[3px] px-2 rounded-pill text-[0.6875rem] font-semibold leading-none whitespace-nowrap"
              [class]="
                item.status === 'overdue'
                  ? 'bg-[rgba(239,71,111,0.12)] text-[#ef476f]'
                  : item.status === 'today'
                    ? 'bg-[rgba(244,162,97,0.15)] text-[#e8820a]'
                    : item.status === 'tomorrow'
                      ? 'bg-[rgba(255,209,102,0.2)] text-[#b8860b]'
                      : 'bg-primary/10 text-primary-dark'
              "
              [attr.aria-label]="item.status === 'overdue' ? 'Vencida' : item.label"
            >
              {{ item.label }}
            </span>
          </li>
        }
      </ul>
    }
  `,
  styles: `
    .deadline-item {
      animation: fadeSlideIn 250ms ease both;
    }

    .deadline-item--overdue .deadline-icon {
      color: var(--color-error) !important;
    }

    @keyframes fadeSlideIn {
      from {
        opacity: 0;
        transform: translateX(-6px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `
})
export class UpcomingDeadlines implements OnDestroy {
  readonly tasks = input.required<Task[]>()

  /** Signal that ticks every 60 s so the computed re-evaluates periodically */
  private readonly now = signal(new Date())
  private readonly timerHandle = setInterval(() => this.now.set(new Date()), 60_000)

  ngOnDestroy(): void {
    clearInterval(this.timerHandle)
  }

  /**
   * Tareas no completadas con dueDate, ordenadas por urgencia.
   * Las vencidas van primero, luego las más próximas. Máximo 4.
   */
  readonly items = computed<DeadlineItem[]>(() => {
    const today = new Date(this.now())
    // Normalizamos a medianoche para comparar solo fechas
    today.setHours(0, 0, 0, 0)

    const withDate = this.tasks()
      .filter((t) => !t.completed && !!t.dueDate)
      .map((t) => {
        const due = new Date(t.dueDate!)
        due.setHours(0, 0, 0, 0)
        const diffMs = due.getTime() - today.getTime()
        const daysLeft = Math.round(diffMs / (1000 * 60 * 60 * 24))

        let status: DeadlineItem['status']
        let label: string

        if (daysLeft < 0) {
          status = 'overdue'
          label = 'Vencida'
        } else if (daysLeft === 0) {
          status = 'today'
          label = 'Hoy'
        } else if (daysLeft === 1) {
          status = 'tomorrow'
          label = 'Mañana'
        } else {
          status = 'soon'
          label = `En ${daysLeft} días`
        }

        return { id: t.id, title: t.title, daysLeft, status, label } as DeadlineItem
      })

    // Vencidas primero (más atrasadas al frente), luego las más próximas
    withDate.sort((a, b) => a.daysLeft - b.daysLeft)

    return withDate.slice(0, 4)
  })
}
