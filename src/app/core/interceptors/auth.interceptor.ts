import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest
} from '@angular/common/http'
import { inject, Injector, runInInjectionContext } from '@angular/core'
import { Observable, catchError, switchMap, throwError } from 'rxjs'

import { TokenStorageService } from '../services/token-storage.service'
import { TokenRefreshService } from '../services/token-refresh.service'
import { environment } from '../../../environments/environment'

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStorage = inject(TokenStorageService)
  const tokenRefreshService = inject(TokenRefreshService)
  const injector = inject(Injector)

  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req)
  }

  const token = tokenStorage.getAccessToken()
  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req

  const isAuthEndpoint =
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/refresh') ||
    (req.url.endsWith('/users') && req.method === 'POST')

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isAuthEndpoint) {
        return handle401(req, next, tokenRefreshService, injector)
      }
      return throwError(() => error)
    })
  )
}

function handle401(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  tokenRefreshService: TokenRefreshService,
  injector: Injector
): Observable<HttpEvent<unknown>> {
  if (tokenRefreshService.refreshing) {
    return tokenRefreshService.waitForRefresh().pipe(
      switchMap((newToken) => {
        const retryReq = req.clone({
          setHeaders: { Authorization: `Bearer ${newToken}` }
        })
        return next(retryReq)
      })
    )
  }

  return tokenRefreshService
    .executeRefresh(() => {
      return new Observable((subscriber) => {
        import('../services/auth.service').then(({ AuthService }) => {
          runInInjectionContext(injector, () => {
            const authService = inject(AuthService)
            authService.refreshToken().subscribe(subscriber)
          })
        })
      })
    })
    .pipe(
      switchMap((newToken) => {
        const retryReq = req.clone({
          setHeaders: { Authorization: `Bearer ${newToken}` }
        })
        return next(retryReq)
      })
    )
}
