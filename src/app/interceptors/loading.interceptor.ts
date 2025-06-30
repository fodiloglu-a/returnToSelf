// src/app/interceptors/loading.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { finalize, delay } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { LoadingService } from '../services/loading.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);

  // Skip loading for certain requests or if not in browser
  if (!isBrowser || shouldSkipLoading(req.url)) {
    return next(req);
  }

  // Start loading
  let loadingStarted = false;

  try {
    loadingService.setLoading(true);
    loadingStarted = true;
  } catch (error) {
    console.warn('Loading service error:', error);
  }

  return next(req).pipe(
    // Add minimum delay to prevent flicker
    delay(100),
    finalize(() => {
      // Stop loading only if we started it
      if (loadingStarted) {
        try {
          loadingService.setLoading(false);
        } catch (error) {
          console.warn('Loading service finalize error:', error);
        }
      }
    })
  );
};

function shouldSkipLoading(url: string): boolean {
  const skipPaths = [
    '/api/auth/check',
    '/api/health',
    '/api/ping'
  ];

  return skipPaths.some(path => url.includes(path));
}
