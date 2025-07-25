// src/app/services/auth.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,

} from '../models/auth.model';
import {User} from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  //   private readonly API_URL = 'http://localhost:8080/api/auth';
   private readonly API_URL = 'https://returntoyourself.onrender.com/api/auth';
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'current_user';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Sadece browser'da localStorage kullan
    if (isPlatformBrowser(this.platformId)) {
      this.loadStoredUser();
    }
  }

  // Kayıt olma
  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, request)
      .pipe(
        tap(response => this.handleAuthResponse(response))
      );
  }
  updateUser(currentUser: User) {
    return this.http.put<AuthResponse>(`${this.API_URL}/user-update`, currentUser)
  }

  // Giriş yapma
  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, request)
      .pipe(
        tap(response => {
          this.handleAuthResponse(response);
          this.redirectAfterLogin();
        })
      );
  }

  // Çıkış yapma
  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  // Token alma
  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  // Mevcut kullanıcı alma
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Giriş yapıp yapmadığını kontrol etme
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    // Token'ın süresi dolmuş mu kontrol et
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = payload.exp * 1000 < Date.now();

      if (isExpired) {
        this.logout();
        return false;
      }

      return true;
    } catch (error) {
      this.logout();
      return false;
    }
  }

  // Auth response'u işleme
  private handleAuthResponse(response: AuthResponse): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.TOKEN_KEY, response.token);

      const user: User = {
        username: response.username,
        email: response.email,
        role: response.role,
        firstName:response.firstName,
        lastName:response.lastName,
        createdAt:response.createdAt,
        likedBlogIds:response.likedBlogIds,
        bio:response.bio,
      };
      console.log('USER', user);

      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
    }
  }

  // Sayfa yenilendiğinde kullanıcı bilgilerini yükleme
  private loadStoredUser(): void {
    if (isPlatformBrowser(this.platformId)) {
      const token = this.getToken();
      const userData = localStorage.getItem(this.USER_KEY);

      if (token && userData && this.isAuthenticated()) {
        const user: User = JSON.parse(userData);
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
      }
    }
  }

  // Login sonrası yönlendirme
  private redirectAfterLogin(): void {
    if (isPlatformBrowser(this.platformId)) {
      // URL query parametrelerinden returnUrl'i al
      const urlParams = new URLSearchParams(window.location.search);
      const returnUrl = urlParams.get('returnUrl') || '/home';
      this.router.navigate([returnUrl]);
    } else {
      this.router.navigate(['/home']);
    }
  }

  // Role kontrolü
  hasRole(role: string): boolean {
    const currentUser = this.getCurrentUser();
    return currentUser?.role === role;
  }

  // Admin kontrolü
  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  // User kontrolü
  isUser(): boolean {
    return this.hasRole('USER');
  }



}
