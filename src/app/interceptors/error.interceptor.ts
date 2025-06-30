// src/app/interceptors/error.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { catchError, throwError, timer } from 'rxjs';
import { retry, mergeMap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);

  return next(req).pipe(
    // Retry logic for network errors only
    retry({
      count: 2,
      delay: (error: HttpErrorResponse, retryCount: number) => {
        // Only retry for network errors (status 0) or server errors (5xx)
        if ((error.status === 0 || error.status >= 500) && retryCount <= 2) {
          if (isBrowser) {
            console.log(`Retry attempt ${retryCount} for request: ${req.url}`);
          }
          // Exponential backoff
          return timer(Math.pow(2, retryCount) * 1000);
        }
        // Don't retry for other errors
        throw error;
      }
    }),

    catchError((error: HttpErrorResponse) => {
      // Log error for debugging (only in browser)
      if (isBrowser) {
        console.error('HTTP Error:', {
          status: error.status,
          message: error.message,
          url: req.url
        });
      }

      // Let the error bubble up to the component
      return throwError(() => error);
    })
  );
};
