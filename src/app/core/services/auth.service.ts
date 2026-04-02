import { Injectable, inject, signal, computed } from '@angular/core'
import { HttpClient, HttpErrorResponse } from '@angular/common/http'
import { Observable, of, throwError } from 'rxjs'
import { catchError, map, switchMap, tap } from 'rxjs/operators'

import { User } from '../models/user.model'
import { ApiResponse } from '../models/api.model'
import {
  AuthResponse,
  CreateUserRequest,
  LoginRequest,
  LogoutAllResponse,
  LogoutRequest,
  RefreshRequest,
  RefreshResponse
} from '../models/auth.model'
import { TokenStorageService } from './token-storage.service'
import { environment } from '../../../environments/environment'

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient)
  private readonly tokenStorage = inject(TokenStorageService)

  readonly currentUser = signal<User | null>(null)
  readonly isAuthenticated = computed(() => this.currentUser() !== null)
  readonly loading = signal(false)

  login(email: string, password: string): Observable<AuthResponse> {
    this.loading.set(true)
    const body: LoginRequest = { email, password }
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, body).pipe(
      tap((response) => {
        this.tokenStorage.setTokens(response.data.accessToken, response.data.refreshToken)
        this.currentUser.set(response.data.user)
        this.loading.set(false)
      }),
      catchError((error: HttpErrorResponse) => {
        this.loading.set(false)
        return throwError(() => error)
      })
    )
  }

  createUser(email: string, password: string, name: string): Observable<AuthResponse> {
    this.loading.set(true)
    const body: CreateUserRequest = { email, password, name }
    return this.http.post<ApiResponse<User>>(`${environment.apiUrl}/users`, body).pipe(
      switchMap(() => this.login(email, password)),
      catchError((error: HttpErrorResponse) => {
        this.loading.set(false)
        return throwError(() => error)
      })
    )
  }

  refreshToken(): Observable<RefreshResponse> {
    const refreshToken = this.tokenStorage.getRefreshToken()
    const body: RefreshRequest = { refreshToken: refreshToken ?? '' }
    return this.http.post<RefreshResponse>(`${environment.apiUrl}/auth/refresh`, body).pipe(
      tap((response) => {
        this.tokenStorage.setTokens(response.data.accessToken, response.data.refreshToken)
      })
    )
  }

  logout(): Observable<void> {
    const refreshToken = this.tokenStorage.getRefreshToken()
    if (refreshToken) {
      const body: LogoutRequest = { refreshToken }
      return this.http.post<void>(`${environment.apiUrl}/auth/logout`, body).pipe(
        tap(() => this.clearSession()),
        catchError(() => {
          // Si falla el server call, limpiar localmente igual
          this.clearSession()
          return of(undefined)
        })
      )
    }
    this.clearSession()
    return of(undefined)
  }

  logoutAll(): Observable<LogoutAllResponse> {
    return this.http.post<LogoutAllResponse>(`${environment.apiUrl}/auth/logout-all`, {}).pipe(
      tap(() => this.clearSession()),
      catchError((error: HttpErrorResponse) => {
        this.clearSession()
        return throwError(() => error)
      })
    )
  }

  restoreSession(): Observable<void> {
    if (!this.tokenStorage.hasToken()) {
      return of(undefined)
    }

    return this.http.get<ApiResponse<User>>(`${environment.apiUrl}/users/me`).pipe(
      tap((response) => {
        this.currentUser.set(response.data)
      }),
      map(() => undefined),
      catchError(() => {
        this.clearSession()
        return of(undefined)
      })
    )
  }

  clearSession(): void {
    this.tokenStorage.clearTokens()
    this.currentUser.set(null)
  }
}
