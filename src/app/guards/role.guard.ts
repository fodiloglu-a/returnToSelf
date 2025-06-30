// src/app/guards/role.guard.ts
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const snackBar = inject(MatSnackBar);

    if (!authService.isAuthenticated()) {
      snackBar.open('Bu sayfaya erişmek için giriş yapmalısınız.', 'Kapat', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });

      router.navigate(['/login'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    }

    const currentUser = authService.getCurrentUser();
    const userRole = currentUser?.role;

    if (userRole && allowedRoles.includes(userRole)) {
      return true;
    } else {
      snackBar.open('Bu sayfaya erişmek için yetkiniz bulunmuyor.', 'Kapat', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });

      router.navigate(['/home']);
      return false;
    }
  };
};
