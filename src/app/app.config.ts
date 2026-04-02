import {
  ApplicationConfig,
  inject,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
  provideAppInitializer,
  LOCALE_ID
} from '@angular/core'
import { provideRouter } from '@angular/router'
import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async'
import { provideNativeDateAdapter } from '@angular/material/core'
import { registerLocaleData } from '@angular/common'
import localeEs from '@angular/common/locales/es'

import { firstValueFrom } from 'rxjs'

import { routes } from './app.routes'
import { authInterceptor } from './core/interceptors/auth.interceptor'
import { AuthService } from './core/services/auth.service'

registerLocaleData(localeEs)

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    provideNativeDateAdapter(),
    { provide: LOCALE_ID, useValue: 'es' },
    provideAppInitializer(() => {
      const authService = inject(AuthService)
      return firstValueFrom(authService.restoreSession())
    })
  ]
}
