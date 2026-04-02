import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core'

/**
 * Donut chart SVG puro que muestra el porcentaje de tareas completadas.
 * Usa stroke-dasharray / stroke-dashoffset para el arco de progreso.
 * La animación de entrada se maneja con una clase CSS que se aplica
 * al montar el componente (animation: drawRing sobre stroke-dashoffset).
 */
@Component({
  selector: 'app-task-progress-ring',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex justify-center' },
  template: `
    <div
      class="relative inline-flex items-center justify-center"
      aria-label="{{ percentage() }}% de tareas completadas, {{ completed() }} de {{
        total()
      }} tareas"
    >
      <svg
        class="block -rotate-90"
        viewBox="0 0 120 120"
        width="140"
        height="140"
        role="img"
        aria-hidden="true"
      >
        <!-- Pista de fondo (track) -->
        <circle class="ring-track" cx="60" cy="60" r="50" fill="none" stroke-width="10" />

        <!-- Arco de progreso -->
        <circle
          class="ring-progress"
          cx="60"
          cy="60"
          r="50"
          fill="none"
          stroke-width="10"
          stroke-linecap="round"
          [style.stroke-dasharray]="circumference"
          [style.stroke-dashoffset]="dashOffset()"
        />
      </svg>

      <!-- Contenido central superpuesto -->
      <div
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5"
        aria-hidden="true"
      >
        <span class="text-[1.625rem] font-extrabold text-on-surface leading-none tracking-tight"
          >{{ percentage() }}%</span
        >
        <span
          class="text-[0.6875rem] font-medium text-on-surface-secondary uppercase tracking-wider whitespace-nowrap"
          >{{ total() }} Tareas</span
        >
      </div>
    </div>
  `,
  styles: `
    .ring-track {
      stroke: rgba(108, 99, 255, 0.12);
    }

    .ring-progress {
      stroke: var(--color-primary);
      animation: drawRing 900ms cubic-bezier(0.4, 0, 0.2, 1) both;
    }

    @keyframes drawRing {
      from {
        stroke-dashoffset: 314.16;
      }
    }
  `
})
export class TaskProgressRing {
  readonly completed = input.required<number>()
  readonly total = input.required<number>()

  /** Circunferencia del círculo: 2 * π * r = 2 * π * 50 ≈ 314.16 */
  readonly circumference = 314.16

  readonly percentage = computed(() => {
    const t = this.total()
    if (t === 0) return 0
    return Math.round((this.completed() / t) * 100)
  })

  readonly dashOffset = computed(() => {
    // dashOffset = circumference * (1 - ratio)
    // 0 offset → arco completo; circumference offset → arco vacío
    const ratio = this.total() === 0 ? 0 : this.completed() / this.total()
    return this.circumference * (1 - ratio)
  })
}
