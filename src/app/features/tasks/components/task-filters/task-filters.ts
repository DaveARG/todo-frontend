import {
  Component,
  ChangeDetectionStrategy,
  output,
  signal,
  computed,
  viewChild,
  ElementRef
} from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition } from '@angular/cdk/overlay'
import { A11yModule } from '@angular/cdk/a11y'

import { TaskFilters, DueDateRange, EMPTY_TASK_FILTERS } from '../../../../core/models/task.model'

/** Option shape for priority checkboxes */
interface PriorityOption {
  value: 'low' | 'medium' | 'high'
  label: string
  color: string
}

/** Option shape for due-date radio buttons */
interface DueDateOption {
  value: DueDateRange
  label: string
  icon: string
}

/**
 * TaskFilterPanel — Organismo
 *
 * Renders a filter toggle button with an active-count badge.
 * Opens a CDK-connected overlay panel with:
 *   - Priority multi-select (checkboxes)
 *   - Due-date range single-select (radio buttons)
 *   - Clear / Apply action buttons
 *
 * Emits `filtersChange` only when the user clicks "Aplicar",
 * keeping draft state internal until confirmed.
 */
@Component({
  selector: 'app-task-filters',
  templateUrl: './task-filters.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      /* Entry animation for the filter panel */
      @keyframes filterPanelIn {
        from {
          opacity: 0;
          transform: translateY(-6px) scale(0.97);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      .animate-filter-panel {
        animation: filterPanelIn 160ms cubic-bezier(0.16, 1, 0.3, 1) both;
      }
    `
  ],
  imports: [MatIconModule, CdkConnectedOverlay, CdkOverlayOrigin, A11yModule]
})
export class TaskFilterPanel {
  /** Emitted when the user clicks "Aplicar" — carries the confirmed filters */
  readonly filtersChange = output<TaskFilters>()

  // ── Query the CdkOverlayOrigin directive placed on the trigger button ─────
  readonly triggerOrigin = viewChild.required(CdkOverlayOrigin)
  /** Reference to the trigger button element for focus restoration */
  readonly triggerBtn = viewChild<ElementRef<HTMLButtonElement>>('triggerBtn')

  // ── Panel open/close state ────────────────────────────────────────────────

  readonly isOpen = signal(false)

  // ── Filter state ──────────────────────────────────────────────────────────

  /**
   * Draft: uncommitted in-panel selection.
   * Committed to `applied` only on "Aplicar".
   */
  readonly draft = signal<TaskFilters>({ priorities: [], dueDateRange: null })

  /** Last applied (committed) filter state — drives the badge counter */
  private readonly applied = signal<TaskFilters>({ ...EMPTY_TASK_FILTERS, priorities: [] })

  /**
   * Number of active filter dimensions.
   * Each non-empty dimension (priorities, dueDateRange) counts as 1.
   * This drives the numeric badge on the trigger button.
   */
  readonly activeCount = computed(() => {
    const f = this.applied()
    let count = 0
    if (f.priorities.length > 0) count++
    if (f.dueDateRange !== null) count++
    return count
  })

  /** True when the draft panel has at least one filter option selected */
  readonly hasDraftFilters = computed(() => {
    const d = this.draft()
    return d.priorities.length > 0 || d.dueDateRange !== null
  })

  // ── Static option lists ───────────────────────────────────────────────────

  readonly priorityOptions: PriorityOption[] = [
    { value: 'high', label: 'Alta', color: 'var(--color-priority-high-text)' },
    { value: 'medium', label: 'Media', color: 'var(--color-priority-medium-text)' },
    { value: 'low', label: 'Baja', color: 'var(--color-priority-low-text)' }
  ]

  readonly dueDateOptions: DueDateOption[] = [
    { value: 'today', label: 'Hoy', icon: 'today' },
    { value: 'this-week', label: 'Esta semana', icon: 'date_range' },
    { value: 'this-month', label: 'Este mes', icon: 'calendar_month' },
    { value: 'overdue', label: 'Vencidas', icon: 'event_busy' }
  ]

  // ── Overlay positioning ───────────────────────────────────────────────────

  /**
   * Preferred: panel opens below the trigger, aligned to its end (right) edge.
   * Fallback: above the trigger when close to the bottom of the viewport.
   */
  readonly overlayPositions: ConnectedPosition[] = [
    {
      originX: 'end',
      originY: 'bottom',
      overlayX: 'end',
      overlayY: 'top',
      offsetY: 4
    },
    {
      originX: 'end',
      originY: 'top',
      overlayX: 'end',
      overlayY: 'bottom',
      offsetY: -4
    }
  ]

  // ── Panel lifecycle ───────────────────────────────────────────────────────

  togglePanel(): void {
    if (this.isOpen()) {
      this.closePanel()
    } else {
      this.openPanel()
    }
  }

  openPanel(): void {
    // Sync draft with last applied state so the panel reflects current filters.
    const current = this.applied()
    this.draft.set({ priorities: [...current.priorities], dueDateRange: current.dueDateRange })
    this.isOpen.set(true)
  }

  closePanel(): void {
    this.isOpen.set(false)
    // Restore focus to trigger button — essential for keyboard navigation.
    this.triggerBtn()?.nativeElement.focus()
  }

  // ── Draft mutations ───────────────────────────────────────────────────────

  togglePriority(value: 'low' | 'medium' | 'high'): void {
    this.draft.update((current) => {
      const alreadySelected = current.priorities.includes(value)
      return {
        ...current,
        priorities: alreadySelected
          ? current.priorities.filter((p) => p !== value)
          : [...current.priorities, value]
      }
    })
  }

  setDueDateRange(value: DueDateRange): void {
    this.draft.update((current) => ({
      ...current,
      // Clicking the already-selected radio clears it (acts as a toggle).
      dueDateRange: current.dueDateRange === value ? null : value
    }))
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  clearFilters(): void {
    this.draft.set({ priorities: [], dueDateRange: null })
  }

  applyFilters(): void {
    const confirmed: TaskFilters = {
      priorities: [...this.draft().priorities],
      dueDateRange: this.draft().dueDateRange
    }
    this.applied.set(confirmed)
    this.filtersChange.emit(confirmed)
    this.closePanel()
  }
}
