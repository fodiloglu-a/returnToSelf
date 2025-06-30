// src/app/services/translation.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private currentLanguageSubject = new BehaviorSubject<string>('tr');
  public currentLanguage$ = this.currentLanguageSubject.asObservable();

  constructor(
    private translateService: TranslateService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Sadece browser ortamında initialize et
    if (isPlatformBrowser(this.platformId)) {
      this.initializeLanguage();
    } else {
      // Server-side'da varsayılan dili ayarla
      this.translateService.setDefaultLang('tr');
      this.translateService.use('tr');
    }
  }

  private initializeLanguage(): void {
    // LocalStorage'dan dil tercihini al veya varsayılan olarak Türkçe kullan
    const savedLanguage = this.getSavedLanguage() || 'tr';
    this.setLanguage(savedLanguage);
  }

  private getSavedLanguage(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      try {
        return localStorage.getItem('selectedLanguage');
      } catch (error) {
        return null;
      }
    }
    return null;
  }

  private saveLanguage(language: string): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem('selectedLanguage', language);
      } catch (error) {
        console.warn('Cannot save language preference:', error);
      }
    }
  }

  setLanguage(language: string): void {
    this.translateService.use(language);
    this.currentLanguageSubject.next(language);
    this.saveLanguage(language);

    if (isPlatformBrowser(this.platformId)) {
      document.documentElement.lang = language;
    }
  }

  getCurrentLanguage(): string {
    return this.currentLanguageSubject.value;
  }

  getTranslation(key: string): string {
    return this.translateService.instant(key);
  }

  // Yardımcı metodlar
  isCurrentLanguage(language: string): boolean {
    return this.getCurrentLanguage() === language;
  }

  getAvailableLanguages(): string[] {
    return ['tr', 'uk'];
  }
}
