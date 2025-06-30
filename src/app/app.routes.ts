// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { guestGuard } from './guards/guest.guard';
import { authGuard } from './guards/auth.guard';
import { BlogListComponent } from './components/blog-list/blog-list.component';
import { BlogDetailComponent } from './components/blog-detail/blog-detail.component';
import { ProfileComponent } from './components/profile/profile.component';
import {EventDetailComponent} from './components/event-detail/event-detail.component';
import {EventListComponent} from './components/event-list/event-list.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'blogs', component: BlogListComponent },
  { path: 'blogs/:id', component: BlogDetailComponent },
  { path: 'events/:id', component: EventDetailComponent },
  { path: 'events', component: EventListComponent },

  // Guest only routes (giriş yapmış kullanıcılar erişemez)
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard]
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [guestGuard]
  },

  // Protected routes (giriş yapmış kullanıcılar için)
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard]
  },

  // Wildcard route - 404 sayfası
  { path: '**', redirectTo: 'home' }
];
