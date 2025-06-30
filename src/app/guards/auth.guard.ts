// src/app/guards/auth.guard.ts
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  if (authService.isAuthenticated()) {
    return true;
  } else {
    // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
    snackBar.open('Bu sayfaya erişmek için giriş yapmalısınız.', 'Kapat', {
      duration: 3000,
      panelClass: ['warning-snackbar']
    });

    // Login sonrası geri dönmek için current URL'i sakla
    const returnUrl = state.url;
    router.navigate(['/login'], {
      queryParams: { returnUrl: returnUrl }
    });

    return false;
  }
};
