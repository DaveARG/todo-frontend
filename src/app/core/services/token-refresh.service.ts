import { Injectable, inject } from '@angular/core'
import { Router } from '@angular/router'
import { MatSnackBar } from '@angular/material/snack-bar'
import { HttpErrorResponse } from '@angular/common/http'
import { BehaviorSubject, Observable, throwError } from 'rxjs'
import { catchError, filter, switchMap, take } from 'rxjs/operators'

import { TokenStorageService } from './token-storage.service'
import { isApiError } from '../models/api-error'

interface RefreshResult {
  data: { accessToken: string; refreshToken: string }
}

@Injectable({ providedIn: 'root' })
export class TokenRefreshService {
  private readonly tokenStorage = inject(TokenStorageService)
  private readonly router = inject(Router)
  private readonly snackBar = inject(MatSnackBar)

  private isRefreshing = false
  private refreshSubject$ = new BehaviorSubject<string | null>(null)

  get refreshing(): boolean {
    return this.isRefreshing
  }

  /**
   * Execute a token refresh or wait for an in-progress one.
   * Returns an Observable that emits the new access token string.
   */
  executeRefresh(doRefresh: () => Observable<RefreshResult>): Observable<string> {
    if (this.isRefreshing) {
      return this.waitForRefresh()
    }

    this.isRefreshing = true
    this.refreshSubject$.next(null)

    return doRefresh().pipe(
      switchMap((response) => {
        this.isRefreshing = false
        this.refreshSubject$.next(response.data.accessToken)
        return [response.data.accessToken]
      }),
      catchError((err: HttpErrorResponse) => {
        this.handleRefreshFailure(err)
        return throwError(() => err)
      })
    )
  }

  /**
   * Wait for an in-progress refresh to complete.
   */
  waitForRefresh(): Observable<string> {
    return this.refreshSubject$.pipe(
      filter((token): token is string => token !== null),
      take(1)
    )
  }

  private handleRefreshFailure(err: HttpErrorResponse): void {
    this.isRefreshing = false
    // Reset the subject — do NOT call .error() to avoid breaking queued subscribers
    this.refreshSubject$.next(null)
    this.refreshSubject$ = new BehaviorSubject<string | null>(null)

    const message = isApiError(err.error)
      ? err.error.error
      : 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.'

    this.snackBar.open(message, 'Cerrar', { duration: 5000 })
    this.tokenStorage.clearTokens()
    this.router.navigate(['/login'])
  }
}
