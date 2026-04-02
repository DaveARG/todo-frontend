import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core'
import { DatePipe } from '@angular/common'
import { MatCardModule } from '@angular/material/card'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatIconModule } from '@angular/material/icon'
import { MatButtonModule } from '@angular/material/button'
import { MatChipsModule } from '@angular/material/chips'

import { Task } from '../../../../core/models/task.model'

@Component({
  selector: 'app-task-card',
  templateUrl: './task-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  styles: [
    `
      /* MDC chip overrides — cannot be done with Tailwind utility classes */
      .task-card__priority--low {
        --mdc-chip-elevated-container-color: var(--color-priority-low-bg);
        --mdc-chip-label-text-color: var(--color-priority-low-text);
        --mdc-chip-label-text-size: 0.6875rem;
        --mdc-chip-label-text-weight: 600;
      }
      .task-card__priority--medium {
        --mdc-chip-elevated-container-color: var(--color-priority-medium-bg);
        --mdc-chip-label-text-color: var(--color-priority-medium-text);
        --mdc-chip-label-text-size: 0.6875rem;
        --mdc-chip-label-text-weight: 600;
      }
      .task-card__priority--high {
        --mdc-chip-elevated-container-color: var(--color-priority-high-bg);
        --mdc-chip-label-text-color: var(--color-priority-high-text);
        --mdc-chip-label-text-size: 0.6875rem;
        --mdc-chip-label-text-weight: 600;
      }

      /* Completed state — left border */
      .task-card--completed mat-card {
        border-left: 3px solid var(--color-success) !important;
      }
      .task-card--completed {
        opacity: 0.65;
      }

      /* Action buttons sizing */
      .task-card__actions button {
        min-width: 36px;
        min-height: 36px;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        border-radius: var(--radius-sm) !important;
      }
      .task-card__actions button mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        line-height: 1;
      }

      /* Touch devices — always show actions */
      @media (pointer: coarse) {
        .task-card__actions {
          opacity: 1 !important;
          flex-direction: row;
        }
      }
    `
  ],
  imports: [
    DatePipe,
    MatCardModule,
    MatCheckboxModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule
  ]
})
export class TaskCard {
  readonly task = input.required<Task>()
  readonly toggleTask = output<string>()
  readonly editTask = output<Task>()
  readonly deleteTask = output<Task>()

  readonly priorityLabel = computed(() => {
    const labels: Record<string, string> = {
      low: 'Baja',
      medium: 'Media',
      high: 'Alta'
    }
    return labels[this.task().priority ?? ''] ?? ''
  })

  onToggle(): void {
    this.toggleTask.emit(this.task().id)
  }

  onEdit(): void {
    this.editTask.emit(this.task())
  }

  onDelete(): void {
    this.deleteTask.emit(this.task())
  }
}
