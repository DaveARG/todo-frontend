import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core'
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'

export interface CreateUserDialogData {
  email?: string
  password?: string
}

export interface CreateUserDialogResult {
  email: string
  password: string
  name: string
}

function patternValidator(pattern: RegExp, errorKey: string) {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null
    return pattern.test(control.value) ? null : { [errorKey]: true }
  }
}

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')
  const confirmPassword = control.get('confirmPassword')
  if (password && confirmPassword && password.value !== confirmPassword.value) {
    return { passwordMismatch: true }
  }
  return null
}

@Component({
  selector: 'app-create-user-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatIconModule, ReactiveFormsModule],
  styles: [
    `
      :host {
        --mdc-dialog-container-shape: 1.25rem;
      }
      .dialog-accent-bar {
        height: 4px;
        background: linear-gradient(90deg, #6c63ff 0%, #9d97ff 60%, #06d6a0 100%);
      }
    `
  ],
  template: `
    <div class="dialog-accent-bar" aria-hidden="true"></div>

    <h2 mat-dialog-title class="dialog-custom-title">
      <div class="flex items-center gap-3 px-6 pb-4 -mt-6">
        <div
          class="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark shadow-[0_4px_12px_rgba(108,99,255,0.35)] shrink-0"
          aria-hidden="true"
        >
          <mat-icon class="!text-white !text-[20px] !w-5 !h-5">person_add</mat-icon>
        </div>
        <div class="flex flex-col leading-tight">
          <span class="text-lg font-bold text-on-surface">Crear cuenta</span>
          <span class="text-xs text-on-surface-secondary">Completa tus datos para registrarte</span>
        </div>
      </div>
    </h2>

    <mat-dialog-content class="!overflow-x-hidden">
      <form
        [formGroup]="form"
        id="create-user-form"
        (ngSubmit)="onSubmit()"
        class="flex flex-col gap-5 px-1"
      >
        <!-- Email -->
        <div class="flex flex-col gap-2">
          <label
            for="register-email"
            class="text-sm font-semibold text-on-surface flex items-center gap-1.5"
          >
            <mat-icon
              class="!text-[14px] !w-[14px] !h-[14px] text-on-surface-muted"
              aria-hidden="true"
              >alternate_email</mat-icon
            >
            Correo electrónico
          </label>
          <div class="relative">
            <mat-icon
              class="absolute left-3.5 top-1/2 -translate-y-1/2 !text-[18px] !w-[18px] !h-[18px] pointer-events-none select-none transition-colors duration-200"
              [class]="
                hasPrefilledEmail
                  ? 'text-on-surface-muted'
                  : emailFocused()
                    ? 'text-primary'
                    : 'text-on-surface-muted'
              "
              aria-hidden="true"
            >
              mail_outline
            </mat-icon>
            @if (hasPrefilledEmail) {
              <input
                id="register-email"
                type="email"
                readonly
                [value]="data.email"
                class="w-full h-12 pl-10 pr-4 rounded-xl text-sm text-on-surface-secondary outline-none border-[1.5px] border-[rgba(108,99,255,0.12)] bg-background cursor-not-allowed"
                aria-label="Correo electrónico"
              />
            } @else {
              <input
                id="register-email"
                formControlName="email"
                type="email"
                autocomplete="email"
                placeholder="tu@correo.com"
                class="w-full h-12 pl-10 pr-4 rounded-xl text-sm text-on-surface outline-none transition-all duration-200 placeholder:text-on-surface-muted border-[1.5px]"
                [class]="emailInputClasses()"
                [attr.aria-invalid]="isEmailInvalid()"
                [attr.aria-describedby]="isEmailInvalid() ? 'register-email-error' : null"
                (focus)="emailFocused.set(true)"
                (blur)="emailFocused.set(false)"
              />
            }
          </div>
          @if (isEmailInvalid()) {
            <div
              id="register-email-error"
              role="alert"
              aria-live="polite"
              class="flex items-center gap-1.5 text-xs text-error font-medium px-1"
            >
              <mat-icon class="!text-[14px] !w-[14px] !h-[14px] shrink-0" aria-hidden="true"
                >error_outline</mat-icon
              >
              @if (form.controls.email.hasError('required')) {
                <span>El correo electrónico es obligatorio</span>
              } @else if (form.controls.email.hasError('email')) {
                <span>Ingresa un correo electrónico válido</span>
              }
            </div>
          }
        </div>

        <!-- Nombre -->
        <div class="flex flex-col gap-2">
          <label
            for="register-name"
            class="text-sm font-semibold text-on-surface flex items-center gap-1.5"
          >
            <mat-icon
              class="!text-[14px] !w-[14px] !h-[14px] text-on-surface-muted"
              aria-hidden="true"
              >badge</mat-icon
            >
            Nombre
          </label>
          <div class="relative">
            <mat-icon
              class="absolute left-3.5 top-1/2 -translate-y-1/2 !text-[18px] !w-[18px] !h-[18px] pointer-events-none select-none transition-colors duration-200"
              [class]="nameFocused() ? 'text-primary' : 'text-on-surface-muted'"
              aria-hidden="true"
            >
              person_outline
            </mat-icon>
            <input
              id="register-name"
              formControlName="name"
              type="text"
              autocomplete="name"
              placeholder="Tu nombre completo"
              class="w-full h-12 pl-10 pr-4 rounded-xl text-sm text-on-surface outline-none transition-all duration-200 placeholder:text-on-surface-muted border-[1.5px]"
              [class]="nameInputClasses()"
              [attr.aria-invalid]="isNameInvalid()"
              [attr.aria-describedby]="isNameInvalid() ? 'name-error' : null"
              (focus)="nameFocused.set(true)"
              (blur)="nameFocused.set(false)"
            />
          </div>
          @if (isNameInvalid()) {
            <div
              id="name-error"
              role="alert"
              aria-live="polite"
              class="flex items-center gap-1.5 text-xs text-error font-medium px-1"
            >
              <mat-icon class="!text-[14px] !w-[14px] !h-[14px] shrink-0" aria-hidden="true"
                >error_outline</mat-icon
              >
              <span>El nombre es obligatorio</span>
            </div>
          }
        </div>

        <!-- Contraseña -->
        <div class="flex flex-col gap-2">
          <label
            for="register-password"
            class="text-sm font-semibold text-on-surface flex items-center gap-1.5"
          >
            <mat-icon
              class="!text-[14px] !w-[14px] !h-[14px] text-on-surface-muted"
              aria-hidden="true"
              >lock_outline</mat-icon
            >
            Contraseña
          </label>
          <div class="relative">
            <mat-icon
              class="absolute left-3.5 top-1/2 -translate-y-1/2 !text-[18px] !w-[18px] !h-[18px] pointer-events-none select-none transition-colors duration-200"
              [class]="passwordFocused() ? 'text-primary' : 'text-on-surface-muted'"
              aria-hidden="true"
            >
              lock_outline
            </mat-icon>
            <input
              id="register-password"
              formControlName="password"
              [type]="passwordVisible() ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="Mínimo 8 caracteres"
              class="w-full h-12 pl-10 pr-12 rounded-xl text-sm text-on-surface outline-none transition-all duration-200 placeholder:text-on-surface-muted border-[1.5px]"
              [class]="passwordInputClasses()"
              [attr.aria-invalid]="isPasswordInvalid()"
              [attr.aria-describedby]="isPasswordInvalid() ? 'reg-password-error' : null"
              (focus)="passwordFocused.set(true)"
              (blur)="passwordFocused.set(false)"
            />
            <button
              type="button"
              class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer text-on-surface-muted hover:text-primary hover:bg-primary/[0.06] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-1"
              [attr.aria-label]="passwordVisible() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              (click)="togglePasswordVisibility()"
            >
              <mat-icon class="!text-[18px] !w-[18px] !h-[18px]" aria-hidden="true">
                {{ passwordVisible() ? 'visibility_off' : 'visibility' }}
              </mat-icon>
            </button>
          </div>
          @if (isPasswordInvalid()) {
            <div
              id="reg-password-error"
              role="alert"
              aria-live="polite"
              class="flex flex-col gap-1 text-xs text-error font-medium px-1"
            >
              @if (form.controls.password.hasError('required')) {
                <div class="flex items-center gap-1.5">
                  <mat-icon class="!text-[14px] !w-[14px] !h-[14px] shrink-0" aria-hidden="true"
                    >error_outline</mat-icon
                  >
                  <span>La contraseña es requerida</span>
                </div>
              } @else {
                @if (form.controls.password.hasError('minlength')) {
                  <div class="flex items-center gap-1.5">
                    <mat-icon class="!text-[14px] !w-[14px] !h-[14px] shrink-0" aria-hidden="true"
                      >error_outline</mat-icon
                    >
                    <span>Debe tener al menos 8 caracteres</span>
                  </div>
                }
                @if (form.controls.password.hasError('maxlength')) {
                  <div class="flex items-center gap-1.5">
                    <mat-icon class="!text-[14px] !w-[14px] !h-[14px] shrink-0" aria-hidden="true"
                      >error_outline</mat-icon
                    >
                    <span>No puede exceder 72 caracteres</span>
                  </div>
                }
                @if (form.controls.password.hasError('missingUppercase')) {
                  <div class="flex items-center gap-1.5">
                    <mat-icon class="!text-[14px] !w-[14px] !h-[14px] shrink-0" aria-hidden="true"
                      >error_outline</mat-icon
                    >
                    <span>Debe incluir al menos una letra mayúscula</span>
                  </div>
                }
                @if (form.controls.password.hasError('missingLowercase')) {
                  <div class="flex items-center gap-1.5">
                    <mat-icon class="!text-[14px] !w-[14px] !h-[14px] shrink-0" aria-hidden="true"
                      >error_outline</mat-icon
                    >
                    <span>Debe incluir al menos una letra minúscula</span>
                  </div>
                }
                @if (form.controls.password.hasError('missingNumber')) {
                  <div class="flex items-center gap-1.5">
                    <mat-icon class="!text-[14px] !w-[14px] !h-[14px] shrink-0" aria-hidden="true"
                      >error_outline</mat-icon
                    >
                    <span>Debe incluir al menos un número</span>
                  </div>
                }
                @if (form.controls.password.hasError('missingSpecial')) {
                  <div class="flex items-center gap-1.5">
                    <mat-icon class="!text-[14px] !w-[14px] !h-[14px] shrink-0" aria-hidden="true"
                      >error_outline</mat-icon
                    >
                    <span>Debe incluir al menos un carácter especial (!&#64;#$%^&* etc.)</span>
                  </div>
                }
              }
            </div>
          }
        </div>

        <!-- Confirmar contraseña -->
        <div class="flex flex-col gap-2 mb-2">
          <label
            for="register-confirm-password"
            class="text-sm font-semibold text-on-surface flex items-center gap-1.5"
          >
            <mat-icon
              class="!text-[14px] !w-[14px] !h-[14px] text-on-surface-muted"
              aria-hidden="true"
              >lock_outline</mat-icon
            >
            Confirmar contraseña
          </label>
          <div class="relative">
            <mat-icon
              class="absolute left-3.5 top-1/2 -translate-y-1/2 !text-[18px] !w-[18px] !h-[18px] pointer-events-none select-none transition-colors duration-200"
              [class]="confirmPasswordFocused() ? 'text-primary' : 'text-on-surface-muted'"
              aria-hidden="true"
            >
              lock_outline
            </mat-icon>
            <input
              id="register-confirm-password"
              formControlName="confirmPassword"
              [type]="confirmPasswordVisible() ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="Repite tu contraseña"
              class="w-full h-12 pl-10 pr-12 rounded-xl text-sm text-on-surface outline-none transition-all duration-200 placeholder:text-on-surface-muted border-[1.5px]"
              [class]="confirmPasswordInputClasses()"
              [attr.aria-invalid]="isConfirmPasswordInvalid()"
              [attr.aria-describedby]="isConfirmPasswordInvalid() ? 'confirm-password-error' : null"
              (focus)="confirmPasswordFocused.set(true)"
              (blur)="confirmPasswordFocused.set(false)"
            />
            <button
              type="button"
              class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer text-on-surface-muted hover:text-primary hover:bg-primary/[0.06] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-1"
              [attr.aria-label]="
                confirmPasswordVisible() ? 'Ocultar contraseña' : 'Mostrar contraseña'
              "
              (click)="toggleConfirmPasswordVisibility()"
            >
              <mat-icon class="!text-[18px] !w-[18px] !h-[18px]" aria-hidden="true">
                {{ confirmPasswordVisible() ? 'visibility_off' : 'visibility' }}
              </mat-icon>
            </button>
          </div>
          @if (isConfirmPasswordInvalid()) {
            <div
              id="confirm-password-error"
              role="alert"
              aria-live="polite"
              class="flex items-center gap-1.5 text-xs text-error font-medium px-1"
            >
              <mat-icon class="!text-[14px] !w-[14px] !h-[14px] shrink-0" aria-hidden="true"
                >error_outline</mat-icon
              >
              @if (form.controls.confirmPassword.hasError('required')) {
                <span>Confirma tu contraseña</span>
              } @else if (form.hasError('passwordMismatch')) {
                <span>Las contraseñas no coinciden</span>
              }
            </div>
          }
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions class="!px-6 !py-5 !gap-2.5 !justify-end">
      <button
        type="button"
        class="inline-flex items-center justify-center h-10 px-5 bg-transparent border border-[rgba(108,99,255,0.2)] rounded-lg text-sm font-medium text-on-surface-secondary cursor-pointer transition-all duration-150 hover:bg-[rgba(108,99,255,0.06)] hover:border-primary/40 hover:text-on-surface focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
        (click)="onCancel()"
      >
        Cancelar
      </button>
      <button
        type="submit"
        form="create-user-form"
        class="inline-flex items-center justify-center gap-2 h-10 px-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none rounded-pill text-sm font-semibold cursor-pointer transition-[box-shadow,transform,opacity] duration-200 shadow-[0_4px_14px_rgba(108,99,255,0.38)] hover:enabled:shadow-[0_6px_22px_rgba(108,99,255,0.52)] hover:enabled:-translate-y-px active:enabled:translate-y-0 active:enabled:shadow-[0_2px_8px_rgba(108,99,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-[3px]"
        [disabled]="form.invalid"
      >
        <mat-icon class="!text-[18px] !w-[18px] !h-[18px]" aria-hidden="true">person_add</mat-icon>
        Crear cuenta
      </button>
    </mat-dialog-actions>
  `
})
export class CreateUserDialog {
  readonly data = inject<CreateUserDialogData>(MAT_DIALOG_DATA)
  private readonly dialogRef = inject(MatDialogRef<CreateUserDialog>)

  readonly hasPrefilledEmail: boolean

  // Señales de estado de foco
  readonly emailFocused = signal(false)
  readonly nameFocused = signal(false)
  readonly passwordFocused = signal(false)
  readonly confirmPasswordFocused = signal(false)
  readonly passwordVisible = signal(false)
  readonly confirmPasswordVisible = signal(false)

  readonly form = new FormGroup(
    {
      email: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email]
      }),
      name: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required]
      }),
      password: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(72),
          patternValidator(/[A-Z]/, 'missingUppercase'),
          patternValidator(/[a-z]/, 'missingLowercase'),
          patternValidator(/[0-9]/, 'missingNumber'),
          patternValidator(/[!@#$%^&*()_+\-=[\]{}|;:',.<>?/\\~`]/, 'missingSpecial')
        ]
      }),
      confirmPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required]
      })
    },
    { validators: passwordMatchValidator }
  )

  constructor() {
    this.hasPrefilledEmail = !!this.data?.email

    if (this.data?.email) {
      this.form.controls.email.setValue(this.data.email)
      this.form.controls.email.disable()
    }
    if (this.data?.password) {
      this.form.controls.password.setValue(this.data.password)
      this.form.controls.confirmPassword.setValue(this.data.password)
    }
  }

  // Computed: validación de campos
  // Cada computed lee su signal de foco correspondiente para crear una dependencia reactiva.
  // Sin esto, ctrl.invalid y ctrl.touched (propiedades imperativas, no signals) no disparan
  // la re-evaluación del computed, y los errores nunca se muestran tras el blur.
  readonly isEmailInvalid = computed(() => {
    this.emailFocused()
    const ctrl = this.form.controls.email
    return ctrl.invalid && ctrl.touched
  })

  readonly isNameInvalid = computed(() => {
    this.nameFocused()
    const ctrl = this.form.controls.name
    return ctrl.invalid && ctrl.touched
  })

  readonly isPasswordInvalid = computed(() => {
    this.passwordFocused()
    const ctrl = this.form.controls.password
    return ctrl.invalid && ctrl.touched
  })

  readonly isConfirmPasswordInvalid = computed(() => {
    this.confirmPasswordFocused()
    const ctrl = this.form.controls.confirmPassword
    return (ctrl.invalid || this.form.hasError('passwordMismatch')) && ctrl.touched
  })

  // Computed: clases dinámicas de inputs
  readonly emailInputClasses = computed(() => {
    return this.getInputClasses(this.isEmailInvalid(), this.emailFocused())
  })

  readonly nameInputClasses = computed(() => {
    return this.getInputClasses(this.isNameInvalid(), this.nameFocused())
  })

  readonly passwordInputClasses = computed(() => {
    return this.getInputClasses(this.isPasswordInvalid(), this.passwordFocused())
  })

  readonly confirmPasswordInputClasses = computed(() => {
    return this.getInputClasses(this.isConfirmPasswordInvalid(), this.confirmPasswordFocused())
  })

  togglePasswordVisibility(): void {
    this.passwordVisible.update((v) => !v)
  }

  toggleConfirmPasswordVisibility(): void {
    this.confirmPasswordVisible.update((v) => !v)
  }

  onSubmit(): void {
    if (this.form.valid) {
      const raw = this.form.getRawValue()
      const result: CreateUserDialogResult = {
        email: raw.email,
        password: raw.password,
        name: raw.name
      }
      this.dialogRef.close(result)
    }
  }

  onCancel(): void {
    this.dialogRef.close(undefined)
  }

  private getInputClasses(isInvalid: boolean, isFocused: boolean): string {
    if (isInvalid) {
      return 'border-error bg-error/[0.03] shadow-[0_0_0_3px_rgba(239,71,111,0.1)]'
    }
    if (isFocused) {
      return 'border-primary shadow-[0_0_0_3px_rgba(108,99,255,0.12)] bg-surface'
    }
    return 'border-[rgba(108,99,255,0.2)] bg-background hover:border-[rgba(108,99,255,0.35)] bg-surface'
  }
}
