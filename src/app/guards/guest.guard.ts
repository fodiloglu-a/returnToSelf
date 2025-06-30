// src/app/guards/guest.guard.ts
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  } else {
    // Kullanıcı zaten giriş yapmışsa ana sayfaya yönlendir
    router.navigate(['/home']);
    return false;
  }
};
