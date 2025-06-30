// src/app/services/loading.service.ts
import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private loadingCount = 0;

  public loading$ = this.loadingSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  setLoading(loading: boolean): void {
    // Sadece browser ortamında çalıştır
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      if (loading) {
        this.loadingCount++;
      } else {
        this.loadingCount = Math.max(0, this.loadingCount - 1);
      }

      const isLoading = this.loadingCount > 0;

      // Sadece durum değiştiğinde emit et
      if (this.loadingSubject.value !== isLoading) {
        this.loadingSubject.next(isLoading);
      }
    } catch (error) {
      console.warn('Loading service error:', error);
    }
  }

  isLoading(): boolean {
    return this.loadingSubject.value;
  }

  reset(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadingCount = 0;
      this.loadingSubject.next(false);
    }
  }
}
