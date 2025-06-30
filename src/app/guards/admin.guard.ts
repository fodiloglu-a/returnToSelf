// src/app/guards/admin.guard.ts
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  const currentUser = authService.getCurrentUser();

  if (authService.isAuthenticated() && currentUser?.role === 'ADMIN') {
    return true;
  } else {
    snackBar.open('Bu sayfaya erişmek için admin yetkisi gereklidir.', 'Kapat', {
      duration: 3000,
      panelClass: ['error-snackbar']
    });

    router.navigate(['/home']);
    return false;
  }
};
