import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core'
import { DatePipe, NgOptimizedImage } from '@angular/common'
import { Router } from '@angular/router'
import { MatIconModule } from '@angular/material/icon'
import { MatButtonModule } from '@angular/material/button'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'

import { AuthService } from '../../../../core/services/auth.service'
import { TopNav } from '../../../../shared/components/top-nav/top-nav'
import {
  ConfirmDialog,
  ConfirmDialogData
} from '../../../../shared/components/confirm-dialog/confirm-dialog'

@Component({
  selector: 'app-profile-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, NgOptimizedImage, MatIconModule, MatButtonModule, TopNav],
  host: { class: 'flex min-h-screen bg-background' },
  template: `
    <app-top-nav />

    <div class="flex-1 flex flex-col min-h-screen overflow-x-hidden ml-(--sidebar-width)">
      <main class="py-7 px-8 flex-1 flex flex-col max-md:py-4 max-md:px-4 max-w-3xl w-full mx-auto">
        <!-- Header con avatar e info del usuario -->
        <header class="flex items-center gap-5 mb-8">
          <img
            ngSrc="atom.png"
            width="80"
            height="80"
            class="w-20 h-20 rounded-full object-cover shrink-0 ring-2 ring-primary/20 ring-offset-2 ring-offset-background"
            alt=""
            aria-hidden="true"
          />
          <div class="flex flex-col gap-1">
            <h1 class="text-2xl font-bold text-on-surface m-0">{{ user()?.name ?? 'Usuario' }}</h1>
            <p class="text-gray-500 m-0">{{ user()?.email ?? '' }}</p>
          </div>
        </header>

        <!-- Card: Información de la cuenta -->
        <section class="rounded-2xl bg-white p-6 mb-6" style="box-shadow: var(--shadow-neu);">
          <div class="flex items-center gap-2 mb-5">
            <mat-icon class="text-primary">account_circle</mat-icon>
            <h2 class="text-lg font-semibold text-on-surface m-0">Información de la cuenta</h2>
          </div>

          <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between py-2 border-b border-gray-100">
              <span class="text-gray-500 text-sm">Nombre</span>
              <span class="text-on-surface font-medium">{{ user()?.name ?? '-' }}</span>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-gray-100">
              <span class="text-gray-500 text-sm">Email</span>
              <span class="text-on-surface font-medium">{{ user()?.email ?? '-' }}</span>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-gray-100">
              <span class="text-gray-500 text-sm">Miembro desde</span>
              <span class="text-on-surface font-medium">{{
                user()?.createdAt | date: 'longDate'
              }}</span>
            </div>
            <div class="flex items-center justify-between py-2">
              <span class="text-gray-500 text-sm">Última actualización</span>
              <span class="text-on-surface font-medium">{{
                user()?.updatedAt | date: 'longDate'
              }}</span>
            </div>
          </div>
        </section>

        <!-- Card: Seguridad -->
        <section class="rounded-2xl bg-white p-6" style="box-shadow: var(--shadow-neu);">
          <div class="flex items-center gap-2 mb-5">
            <mat-icon class="text-primary">security</mat-icon>
            <h2 class="text-lg font-semibold text-on-surface m-0">Seguridad</h2>
          </div>

          <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between flex-wrap gap-3">
              <div class="flex flex-col gap-1">
                <span class="text-on-surface font-medium">Cerrar todas las sesiones</span>
                <span class="text-gray-500 text-sm"
                  >Esto cerrará tu sesión en todos los dispositivos.</span
                >
              </div>
              <button
                mat-stroked-button
                class="!text-red-600 !border-red-300"
                [disabled]="loggingOutAll()"
                (click)="onLogoutAll()"
              >
                <mat-icon class="!text-lg !w-[18px] !h-[18px]">logout</mat-icon>
                @if (loggingOutAll()) {
                  Cerrando...
                } @else {
                  Cerrar todas las sesiones
                }
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  `
})
export class ProfilePage {
  private readonly authService = inject(AuthService)
  private readonly router = inject(Router)
  private readonly dialog = inject(MatDialog)
  private readonly snackBar = inject(MatSnackBar)

  readonly user = this.authService.currentUser
  readonly loggingOutAll = signal(false)

  onLogoutAll(): void {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      data: {
        title: '¿Cerrar todas las sesiones?',
        message: 'Se cerrará la sesión en todos los dispositivos donde hayas iniciado sesión.',
        confirmText: 'Cerrar todas',
        cancelText: 'Cancelar'
      } satisfies ConfirmDialogData
    })

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return

      this.loggingOutAll.set(true)
      this.authService.logoutAll().subscribe({
        next: () => {
          this.loggingOutAll.set(false)
          this.snackBar.open('Todas las sesiones han sido cerradas', 'OK', { duration: 3000 })
          this.router.navigate(['/login'])
        },
        error: () => {
          this.loggingOutAll.set(false)
          this.router.navigate(['/login'])
        }
      })
    })
  }
}
