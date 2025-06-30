// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { guestGuard } from './guards/guest.guard';
import { authGuard } from './guards/auth.guard';
export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },

  // Home component - eager loading (ana sayfa hızlı yüklenmeli)
  {
    path: 'home',
    loadComponent: () => import('./components/home/home.component').then(c => c.HomeComponent)
  },

  // Blog modülü - lazy loading
  {
    path: 'blogs',
    loadChildren: () => import('./modules/blog.module').then(m => m.BlogModule)
  },

  // Events modülü - lazy loading
  {
    path: 'events',
    loadChildren: () => import('./modules/events.module').then(m => m.EventsModule)
  },

  // Auth modülü - lazy loading (guest only routes)
  {
    path: 'auth',
    loadChildren: () => import('./modules/auth.module').then(m => m.AuthModule),
    canActivate: [guestGuard]
  },

  // Profile - lazy component loading (protected route)
  {
    path: 'profile',
    loadComponent: () => import('./components/profile/profile.component').then(c => c.ProfileComponent),
    canActivate: [authGuard]
  },

  // Legacy routes - redirect to new structure
  { path: 'login', redirectTo: 'auth/login' },
  { path: 'register', redirectTo: 'auth/register' },

  {
    path: '**',
    loadComponent: () => import('./components/not-found/not-found.component').then(c => c.NotFoundComponent)
  }
];
