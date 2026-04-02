import { Component, ChangeDetectionStrategy, inject } from '@angular/core'
import { Router, RouterLink, RouterLinkActive } from '@angular/router'
import { NgOptimizedImage } from '@angular/common'
import { MatIconModule } from '@angular/material/icon'
import { MatTooltipModule } from '@angular/material/tooltip'

import { AuthService } from '../../../core/services/auth.service'

interface NavItem {
  icon: string
  label: string
  route: string
}

@Component({
  selector: 'app-top-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatTooltipModule, RouterLink, RouterLinkActive, NgOptimizedImage],
  host: {
    class:
      'flex flex-col items-center w-(--sidebar-width) min-h-screen bg-sidebar-bg py-5 fixed top-0 left-0 z-100',
    style: 'box-shadow: var(--shadow-neu-sidebar);'
  },
  template: `
    <!-- Logo "T" geométrico con gradiente purple -->
    <div
      class="w-11 h-11 rounded-xl flex items-center justify-center mb-8 shrink-0"
      style="background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%); box-shadow: var(--shadow-neu-btn);"
      aria-hidden="true"
      role="img"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 22 22"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect x="2" y="3" width="18" height="4" rx="2" fill="white" />
        <rect x="8.5" y="7" width="5" height="12" rx="2" fill="white" />
      </svg>
    </div>

    <!-- Navegación principal -->
    <nav
      class="flex flex-col items-center gap-5 flex-1 w-full px-3"
      aria-label="Navegación principal"
    >
      @for (item of navItems; track item.icon) {
        <a
          [routerLink]="item.route"
          routerLinkActive="nav-active"
          [routerLinkActiveOptions]="{ exact: false }"
          class="w-12 h-12 flex items-center justify-center rounded-xl border-none cursor-pointer transition-all duration-200 ease-in-out p-0 no-underline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
          style="background: var(--color-sidebar-bg); box-shadow: var(--shadow-neu-btn);"
          [attr.aria-label]="item.label"
          [matTooltip]="item.label"
          matTooltipPosition="right"
          #rla="routerLinkActive"
        >
          <mat-icon
            class="!text-[22px] !w-[22px] !h-[22px] transition-colors duration-200"
            [style.color]="
              rla.isActive ? 'var(--color-sidebar-icon-active)' : 'var(--color-sidebar-icon)'
            "
          >
            {{ item.icon }}
          </mat-icon>
        </a>
      }
    </nav>

    <!-- Sección inferior: avatar y logout -->
    <div class="flex flex-col items-center gap-3 px-3 w-full">
      <!-- Avatar del usuario -->
      <a
        routerLink="/profile"
        class="w-10 h-10 rounded-full shrink-0 overflow-hidden no-underline"
        style="box-shadow: var(--shadow-neu-btn);"
        [attr.aria-label]="'Perfil de ' + (currentUser()?.name ?? 'usuario')"
      >
        <img
          ngSrc="atom.png"
          width="40"
          height="40"
          class="w-full h-full object-cover rounded-full"
          alt=""
          aria-hidden="true"
        />
      </a>

      <!-- Separador -->
      <div
        class="w-8 h-px rounded-full opacity-40"
        style="background: linear-gradient(90deg, transparent, var(--color-on-surface-muted), transparent);"
        aria-hidden="true"
      ></div>

      <!-- Botón logout -->
      <button
        class="logout-btn w-11 h-11 flex items-center justify-center rounded-xl border-none cursor-pointer transition-all duration-300 ease-in-out p-0 focus-visible:outline-2 focus-visible:outline-error focus-visible:outline-offset-2 group"
        aria-label="Cerrar sesión"
        [matTooltip]="'Cerrar sesión'"
        matTooltipPosition="right"
        (click)="onLogout()"
      >
        <mat-icon
          class="!text-[22px] !w-[22px] !h-[22px] transition-all duration-300 group-hover:scale-110 pl-[2px]"
        >
          logout
        </mat-icon>
      </button>
    </div>
  `,
  styles: [
    `
      :host .nav-active {
        box-shadow: var(--shadow-neu-btn-active) !important;
      }

      .logout-btn {
        background: var(--color-sidebar-bg);
        box-shadow: var(--shadow-neu-btn);
        color: var(--color-on-surface-muted);
      }

      .logout-btn:hover {
        background: rgba(239, 71, 111, 0.1);
        box-shadow: var(--shadow-neu-btn-active);
        color: var(--color-error);
      }

      .logout-btn:active {
        transform: scale(0.93);
      }
    `
  ]
})
export class TopNav {
  private readonly authService = inject(AuthService)
  private readonly router = inject(Router)

  readonly currentUser = this.authService.currentUser

  readonly navItems: NavItem[] = [
    { icon: 'task_alt', label: 'Tareas', route: '/tasks' },
    { icon: 'person_outline', label: 'Perfil', route: '/profile' }
  ]

  onLogout(): void {
    // AuthService.logout() returns Observable<void> — subscribe and navigate on completion
    this.authService.logout().subscribe({
      complete: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login'])
    })
  }
}
