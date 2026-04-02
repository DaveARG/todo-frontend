import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  OnInit
} from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { MatIconModule } from '@angular/material/icon'

function futureDateValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const selected = new Date(control.value)
  selected.setHours(0, 0, 0, 0)
  return selected < today ? { pastDate: true } : null
}

export interface TaskFormValue {
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | ''
  dueDate: Date | null
}

const INPUT_BASE =
  'w-full h-12 pl-10 pr-4 rounded-xl text-sm text-on-surface outline-none transition-all duration-200 placeholder:text-on-surface-muted border-[1.5px]'
const INPUT_NORMAL =
  'border-[rgba(108,99,255,0.2)] bg-[rgba(108,99,255,0.03)] hover:border-[rgba(108,99,255,0.5)] hover:bg-[rgba(108,99,255,0.05)]'
const INPUT_FOCUS = 'border-primary bg-white shadow-[0_0_0_4px_rgba(108,99,255,0.12)]'
const INPUT_ERROR = 'border-error bg-[rgba(239,71,111,0.03)]'

@Component({
  selector: 'app-task-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatDatepickerModule, MatIconModule],
  host: { class: 'block' },
  template: `
    <form
      [formGroup]="form"
      class="flex flex-col gap-4 w-full pb-1"
      novalidate
      [id]="formId()"
      (ngSubmit)="onSubmit()"
    >
      <!-- Título -->
      <div class="flex flex-col gap-1.5">
        <label
          [for]="formId() + '-title'"
          class="text-sm font-semibold text-on-surface flex items-center gap-1.5"
        >
          <mat-icon
            class="!text-[14px] !w-[14px] !h-[14px] text-on-surface-muted"
            aria-hidden="true"
            >title</mat-icon
          >
          Título
        </label>
        <div class="relative">
          <mat-icon
            class="absolute left-3.5 top-1/2 -translate-y-1/2 !text-[18px] !w-[18px] !h-[18px] pointer-events-none transition-colors duration-200"
            [class]="titleFocused() ? 'text-primary' : 'text-on-surface-muted'"
            aria-hidden="true"
            >edit</mat-icon
          >
          <input
            [id]="formId() + '-title'"
            formControlName="title"
            maxlength="200"
            autocomplete="off"
            placeholder="¿Qué necesitas hacer?"
            aria-required="true"
            class="${INPUT_BASE}"
            [class]="
              titleError()
                ? '${INPUT_ERROR}'
                : titleFocused()
                  ? '${INPUT_FOCUS}'
                  : '${INPUT_NORMAL}'
            "
            (focus)="titleFocused.set(true)"
            (blur)="titleFocused.set(false)"
          />
        </div>
        @if (titleError()) {
          <div role="alert" class="flex items-center gap-1.5 text-xs text-error font-medium px-1">
            <mat-icon class="!text-[14px] !w-[14px] !h-[14px] shrink-0" aria-hidden="true"
              >error_outline</mat-icon
            >
            <span>El título es obligatorio</span>
          </div>
        }
      </div>

      <!-- Descripción -->
      <div class="flex flex-col gap-1.5">
        <label
          [for]="formId() + '-desc'"
          class="text-sm font-semibold text-on-surface flex items-center gap-1.5"
        >
          <mat-icon
            class="!text-[14px] !w-[14px] !h-[14px] text-on-surface-muted"
            aria-hidden="true"
            >notes</mat-icon
          >
          Descripción
        </label>
        <div class="relative">
          <mat-icon
            class="absolute left-3.5 top-4 !text-[18px] !w-[18px] !h-[18px] pointer-events-none transition-colors duration-200"
            [class]="descFocused() ? 'text-primary' : 'text-on-surface-muted'"
            aria-hidden="true"
            >subject</mat-icon
          >
          <textarea
            [id]="formId() + '-desc'"
            formControlName="description"
            rows="3"
            maxlength="5000"
            placeholder="Describe la tarea..."
            aria-required="true"
            class="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-on-surface outline-none transition-all duration-200 placeholder:text-on-surface-muted border-[1.5px] resize-y min-h-[80px]"
            [class]="
              descError() ? '${INPUT_ERROR}' : descFocused() ? '${INPUT_FOCUS}' : '${INPUT_NORMAL}'
            "
            (focus)="descFocused.set(true)"
            (blur)="descFocused.set(false)"
          ></textarea>
        </div>
        @if (descError()) {
          <div role="alert" class="flex items-center gap-1.5 text-xs text-error font-medium px-1">
            <mat-icon class="!text-[14px] !w-[14px] !h-[14px] shrink-0" aria-hidden="true"
              >error_outline</mat-icon
            >
            <span>La descripción es obligatoria</span>
          </div>
        }
      </div>

      <!-- Separator -->
      <div class="flex items-center gap-3" aria-hidden="true">
        <div class="flex-1 h-px bg-[rgba(108,99,255,0.12)]"></div>
        <span
          class="text-[0.6875rem] font-medium text-on-surface-secondary uppercase tracking-widest"
          >Detalles</span
        >
        <div class="flex-1 h-px bg-[rgba(108,99,255,0.12)]"></div>
      </div>

      <!-- Prioridad + Fecha -->
      <div class="grid grid-cols-2 gap-3 max-[480px]:grid-cols-1">
        <!-- Prioridad -->
        <div class="flex flex-col gap-1.5">
          <label for="task-priority" class="text-sm font-semibold text-on-surface flex items-center gap-1.5">
            <mat-icon
              class="!text-[14px] !w-[14px] !h-[14px] text-on-surface-muted"
              aria-hidden="true"
              >flag</mat-icon
            >
            Prioridad
          </label>
          <div class="relative">
            <mat-icon
              class="absolute left-3.5 top-1/2 -translate-y-1/2 !text-[18px] !w-[18px] !h-[18px] pointer-events-none text-on-surface-muted z-10"
              aria-hidden="true"
              >flag</mat-icon
            >
            <select
              id="task-priority"
              formControlName="priority"
              class="${INPUT_BASE} ${INPUT_NORMAL} appearance-none cursor-pointer focus:border-primary focus:bg-white focus:shadow-[0_0_0_4px_rgba(108,99,255,0.12)]"
            >
              <option value="">Sin prioridad</option>
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
            </select>
          </div>
        </div>

        <!-- Fecha -->
        <div class="flex flex-col gap-1.5">
          <label for="task-due-date" class="text-sm font-semibold text-on-surface flex items-center gap-1.5">
            <mat-icon
              class="!text-[14px] !w-[14px] !h-[14px] text-on-surface-muted"
              aria-hidden="true"
              >event</mat-icon
            >
            Fecha límite
          </label>
          <div class="relative">
            <mat-icon
              class="absolute left-3.5 top-1/2 -translate-y-1/2 !text-[18px] !w-[18px] !h-[18px] pointer-events-none text-on-surface-muted z-10"
              aria-hidden="true"
              >event</mat-icon
            >
            <input
              id="task-due-date"
              [matDatepicker]="picker"
              formControlName="dueDate"
              placeholder="Opcional"
              readonly
              class="${INPUT_BASE} ${INPUT_NORMAL} cursor-pointer focus:border-primary focus:bg-white focus:shadow-[0_0_0_4px_rgba(108,99,255,0.12)]"
              (click)="picker.open()"
            />
            <mat-datepicker-toggle
              [for]="picker"
              aria-label="Abrir calendario"
              class="absolute right-1 top-1/2 -translate-y-1/2"
            />
            <mat-datepicker #picker />
          </div>
          @if (form.controls.dueDate.hasError('pastDate')) {
            <div role="alert" class="flex items-center gap-1.5 text-xs text-error font-medium px-1">
              <mat-icon class="!text-[14px] !w-[14px] !h-[14px] shrink-0" aria-hidden="true"
                >error_outline</mat-icon
              >
              <span>Fecha en el pasado</span>
            </div>
          }
        </div>
      </div>
    </form>
  `
})
export class TaskForm implements OnInit {
  readonly formId = input.required<string>()
  readonly initialValue = input<Partial<TaskFormValue>>()
  readonly submitted = output<TaskFormValue>()

  readonly titleFocused = signal(false)
  readonly descFocused = signal(false)
  private readonly titleChanged = signal(0)
  private readonly descChanged = signal(0)

  readonly form = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(200)]
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(5000)]
    }),
    priority: new FormControl<'low' | 'medium' | 'high' | ''>('', {
      nonNullable: true
    }),
    dueDate: new FormControl<Date | null>(null, {
      validators: [futureDateValidator]
    })
  })

  readonly titleError = computed(() => {
    this.titleFocused()
    this.titleChanged()
    const c = this.form.controls.title
    return c.invalid && c.touched
  })

  readonly descError = computed(() => {
    this.descFocused()
    this.descChanged()
    const c = this.form.controls.description
    return c.invalid && c.touched
  })

  constructor() {
    this.form.controls.title.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.titleChanged.update((v) => v + 1))
    this.form.controls.description.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.descChanged.update((v) => v + 1))
  }

  ngOnInit(): void {
    const initial = this.initialValue()
    if (initial) {
      this.form.patchValue(initial)

      // In edit mode, only validate future date when the user actually changes it
      const originalDueDate = initial.dueDate ?? null
      const dueDateCtrl = this.form.controls.dueDate
      dueDateCtrl.clearValidators()
      dueDateCtrl.addValidators((control: AbstractControl) => {
        if (!control.value) return null
        // If the date hasn't changed from the original, allow it
        const current = new Date(control.value)
        current.setHours(0, 0, 0, 0)
        if (originalDueDate) {
          const orig = new Date(originalDueDate)
          orig.setHours(0, 0, 0, 0)
          if (current.getTime() === orig.getTime()) return null
        }
        return futureDateValidator(control)
      })
      dueDateCtrl.updateValueAndValidity()
    }
  }

  isInvalid(): boolean {
    return this.form.invalid
  }

  onSubmit(): void {
    if (this.form.invalid) return
    this.submitted.emit(this.form.getRawValue())
  }
}
