// src/app/interceptors/jwt.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);

  // Token'ı al (sadece browser'da)
  let token: string | null = null;

  try {
    token = authService.getToken();
  } catch (error) {
    // Token alma hatası - sessizce devam et
    if (isBrowser) {
      console.warn('Token alınamadı:', error);
    }
  }

  // Token ekle (auth endpoint'leri hariç)
  let modifiedReq = req;
  if (token && !isAuthEndpoint(req.url)) {
    modifiedReq = req.clone({
      setHeaders: {
        'Authorization': `Bearer ${token}`
      }
    });
  }

  // İsteği gönder ve hataları yakala
  return next(modifiedReq).pipe(
    catchError((error: any) => {
      // Sadece HttpErrorResponse türündeki hataları işle
      if (error instanceof HttpErrorResponse) {
        handleHttpError(error, authService, router, isBrowser);
      }

      // Orijinal hatayı fırlat (düzenleme yapmadan)
      return throwError(() => error);
    })
  );
};

function isAuthEndpoint(url: string): boolean {
  const authPaths = ['/login', '/register', '/api/auth/'];
  return authPaths.some(path => url.includes(path));
}

function handleHttpError(
  error: HttpErrorResponse,
  authService: AuthService,
  router: Router,
  isBrowser: boolean
): void {
  // 401 - Unauthorized: Token süresi dolmuş veya geçersiz
  if (error.status === 401 && !isAuthEndpoint(error.url || '')) {
    try {
      // Sessizce logout yap
      authService.logout();

      // Sadece browser'da navigation yap
      if (isBrowser) {
        router.navigate(['/login'], {
          queryParams: { returnUrl: router.url }
        }).catch(navError => {
          console.error('Navigation error:', navError);
        });
      }
    } catch (logoutError) {
      if (isBrowser) {
        console.error('Logout error:', logoutError);
      }
    }
  }

  // 403 hatalarını sadece browser'da log et
  if (error.status === 403 && isBrowser) {
    console.warn('Access denied:', error.url);
  }
}
