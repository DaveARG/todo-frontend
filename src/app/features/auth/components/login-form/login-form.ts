import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatIconModule } from '@angular/material/icon'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'

export interface LoginCredentials {
  email: string
  password: string
}

@Component({
  selector: 'app-login-form',
  templateUrl: './login-form.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatIconModule, MatProgressSpinnerModule]
})
export class LoginForm {
  readonly loading = input(false)
  readonly emailSubmitted = output<LoginCredentials>()

  readonly emailFocused = signal(false)
  readonly passwordFocused = signal(false)
  readonly passwordVisible = signal(false)
  private readonly emailChanged = signal(0)
  private readonly passwordChanged = signal(0)

  readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email]
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)]
    })
  })

  constructor() {
    this.form.controls.email.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.emailChanged.update((v) => v + 1))
    this.form.controls.password.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.passwordChanged.update((v) => v + 1))
  }

  readonly isEmailInvalid = computed(() => {
    this.emailFocused()
    this.emailChanged()
    const ctrl = this.form.controls.email
    return ctrl.invalid && ctrl.touched
  })

  readonly isPasswordInvalid = computed(() => {
    this.passwordFocused()
    this.passwordChanged()
    const ctrl = this.form.controls.password
    return ctrl.invalid && ctrl.touched
  })

  /** Clases dinámicas del input email según estado: foco, error, normal */
  readonly emailInputClasses = computed(() => {
    const isInvalid = this.isEmailInvalid()
    const isFocused = this.emailFocused()

    if (isInvalid) {
      return 'border-error bg-error/[0.03] shadow-[0_0_0_3px_rgba(239,71,111,0.1)]'
    }
    if (isFocused) {
      return 'border-primary shadow-[0_0_0_3px_rgba(108,99,255,0.12)] bg-surface'
    }
    return 'border-[rgba(108,99,255,0.2)] bg-background hover:border-[rgba(108,99,255,0.35)] bg-surface'
  })

  /** Clases dinámicas del input password según estado: foco, error, normal */
  readonly passwordInputClasses = computed(() => {
    const isInvalid = this.isPasswordInvalid()
    const isFocused = this.passwordFocused()

    if (isInvalid) {
      return 'border-error bg-error/[0.03] shadow-[0_0_0_3px_rgba(239,71,111,0.1)]'
    }
    if (isFocused) {
      return 'border-primary shadow-[0_0_0_3px_rgba(108,99,255,0.12)] bg-surface'
    }
    return 'border-[rgba(108,99,255,0.2)] bg-background hover:border-[rgba(108,99,255,0.35)] bg-surface'
  })

  togglePasswordVisibility(): void {
    this.passwordVisible.update((v) => !v)
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.emailSubmitted.emit({
        email: this.form.controls.email.value,
        password: this.form.controls.password.value
      })
    }
  }
}
