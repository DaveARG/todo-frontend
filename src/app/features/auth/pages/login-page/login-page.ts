import { Component, ChangeDetectionStrategy, inject } from '@angular/core'
import { Router } from '@angular/router'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { MatIconModule } from '@angular/material/icon'
import { HttpErrorResponse } from '@angular/common/http'

import { AuthService } from '../../../../core/services/auth.service'
import { getApiErrorMessage } from '../../../../core/models/api-error'
import { LoginForm, LoginCredentials } from '../../components/login-form/login-form'
import {
  CreateUserDialog,
  CreateUserDialogData,
  CreateUserDialogResult
} from '../../components/create-user-dialog/create-user-dialog'

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LoginForm, MatIconModule]
})
export class LoginPage {
  readonly authService = inject(AuthService)
  private readonly router = inject(Router)
  private readonly dialog = inject(MatDialog)
  private readonly snackBar = inject(MatSnackBar)

  // Arrays para el patrón de puntos decorativos SVG en el panel izquierdo
  readonly dotRows = [0, 1, 2, 3, 4, 5]
  readonly dotCols = [0, 1, 2, 3, 4, 5]
  // Patrón de puntos pequeño para la esquina superior izquierda
  readonly dotRowsSmall = [0, 1, 2, 3]
  readonly dotColsSmall = [0, 1, 2, 3]

  onLogin(credentials: LoginCredentials): void {
    this.authService.login(credentials.email, credentials.password).subscribe({
      next: () => {
        this.router.navigate(['/tasks'])
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 404) {
          this.openCreateUserDialog(credentials.email, credentials.password)
        } else {
          this.showError(error)
        }
      }
    })
  }

  openCreateUserDialog(email?: string, password?: string): void {
    const dialogData: CreateUserDialogData = { email, password }
    const dialogRef = this.dialog.open(CreateUserDialog, {
      data: dialogData,
      disableClose: true,
      width: '440px'
    })

    dialogRef.afterClosed().subscribe((result: CreateUserDialogResult | undefined) => {
      if (result) {
        this.authService.createUser(result.email, result.password, result.name).subscribe({
          next: () => {
            this.router.navigate(['/tasks'])
          },
          error: (error: HttpErrorResponse) => this.showError(error)
        })
      }
    })
  }

  private showError(error: HttpErrorResponse): void {
    const message = getApiErrorMessage(error, 'Ha ocurrido un error inesperado')
    this.snackBar.open(message, 'Cerrar', { duration: 5000 })
  }
}
