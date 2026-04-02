import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'

import { Task } from '../../../../core/models/task.model'

interface PriorityItem {
  id: string
  title: string
}

@Component({
  selector: 'app-top-priority-tasks',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  host: { class: 'block' },
  template: `
    @if (items().length === 0) {
      <div
        class="flex flex-col items-center justify-center py-6 px-4 gap-2 text-center"
        role="status"
        aria-label="Sin tareas prioritarias pendientes"
      >
        <div
          class="w-11 h-11 rounded-full bg-[rgba(6,214,160,0.1)] flex items-center justify-center mb-0.5"
          aria-hidden="true"
        >
          <mat-icon class="!text-[1.375rem] !w-[22px] !h-[22px] text-accent">check_circle</mat-icon>
        </div>
        <p class="text-[0.8125rem] font-semibold text-on-surface m-0 leading-snug">Todo en orden</p>
        <p class="text-[0.75rem] text-on-surface-muted m-0 leading-snug">
          No hay tareas con prioridad<br />pendientes por ahora
        </p>
      </div>
    } @else {
      <ul class="list-none p-0 m-0 flex flex-col" aria-label="Tareas de mayor prioridad">
        @for (item of items(); track item.id; let i = $index) {
          <li
            class="priority-item flex items-center gap-2.5 py-2 border-b border-black/5 last:border-b-0 rounded-xs transition-colors duration-150 ease-in-out hover:bg-primary/[0.03]"
            [style.animation-delay.ms]="i * 60"
          >
            <span
              class="shrink-0 w-[30px] h-[30px] rounded-full flex items-center justify-center bg-[rgba(239,71,111,0.1)]"
              aria-hidden="true"
            >
              <mat-icon class="!text-[16px] !w-4 !h-4 text-[#ef476f]">flag</mat-icon>
            </span>
            <span
              class="flex-1 min-w-0 text-[0.8125rem] font-medium text-on-surface whitespace-nowrap overflow-hidden text-ellipsis leading-snug"
              [title]="item.title"
              >{{ item.title }}</span
            >
            <span
              class="shrink-0 inline-flex items-center py-[3px] px-2 rounded-pill text-[0.6875rem] font-semibold leading-none whitespace-nowrap bg-[rgba(239,71,111,0.12)] text-[#ef476f]"
              aria-label="Prioridad Alta"
            >
              Alta
            </span>
          </li>
        }
      </ul>
    }
  `,
  styles: `
    .priority-item {
      animation: fadeSlideIn 250ms ease both;
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
export class TopPriorityTasks {
  readonly tasks = input.required<Task[]>()

  readonly items = computed<PriorityItem[]>(() =>
    this.tasks()
      .filter((t) => !t.completed && t.priority === 'high')
      .slice(0, 4)
      .map((t) => ({
        id: t.id,
        title: t.title
      }))
  )
}
