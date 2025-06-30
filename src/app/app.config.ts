// src/app/app.config.ts - Optimized for performance
import { ApplicationConfig, provideZoneChangeDetection, isDevMode, importProvidersFrom } from '@angular/core';
import { provideRouter, withHashLocation, PreloadAllModules, withPreloading } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch, HttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { DatePipe } from '@angular/common';

import { routes } from './app.routes';
import { jwtInterceptor } from './interceptors/jwt.interceptor';
import { errorInterceptor } from './interceptors/error.interceptor';
import { loadingInterceptor } from './interceptors/loading.interceptor';
import { provideServiceWorker } from '@angular/service-worker';

// TranslateHttpLoader factory function - optimized for performance
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './i18n/', '.json');
}

// Custom preloading strategy for better performance
export class CustomPreloadingStrategy {
  preload(route: any, fn: () => any) {
    // Only preload modules marked with data.preload = true
    return route.data && route.data.preload ? fn() : null;
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    // Zone optimization for better performance
    provideZoneChangeDetection({
      eventCoalescing: true,
      runCoalescing: true  // Added for better performance
    }),

    // Router with intelligent preloading strategy
    provideRouter(
      routes,
      withHashLocation(),
      withPreloading(PreloadAllModules) // Preload all modules for better UX
    ),

    DatePipe,

    // HTTP client with fetch API for better performance
    provideHttpClient(
      withFetch(), // Use fetch API instead of XMLHttpRequest
      withInterceptors([
        jwtInterceptor,
        errorInterceptor,
        loadingInterceptor
      ])
    ),

    // No animations for better performance (keep as is if intended)
    provideNoopAnimations(),

    // i18n (çoklu dil) desteği - optimized
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
        },
        defaultLanguage: 'tr',
        useDefaultLang: true,
        isolate: false,
        extend: true // Enable extending translations
      })
    ),

    // Service Worker - optimized registration (removed duplicate)
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
};
