import { HttpErrorResponse } from '@angular/common/http'

import { ApiErrorResponse } from './api.model'

/**
 * Type guard to check if an HTTP error body matches the ApiErrorResponse shape.
 */
export function isApiError(value: unknown): value is ApiErrorResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof (value as ApiErrorResponse).error === 'string'
  )
}

/**
 * Extract user-facing message from an HttpErrorResponse.
 */
export function getApiErrorMessage(error: HttpErrorResponse, fallback: string): string {
  if (error.status === 0) {
    return 'Sin conexión. Verifique su red e intente de nuevo.'
  }
  return isApiError(error.error) ? error.error.error : fallback
}
