// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// DatePipe için gerekli lokalizasyon verilerini import et
import { registerLocaleData } from '@angular/common';
import localeTr from '@angular/common/locales/tr'; // Türkçe locale verisi
import localeUk from '@angular/common/locales/uk'; // Ukraynaca locale verisi

// Türkçe ve Ukraynaca locale verilerini kaydet
registerLocaleData(localeTr, 'tr'); // Türkçe locale'i 'tr' anahtarıyla kaydet
registerLocaleData(localeUk, 'uk'); // Ukraynaca locale'i 'uk' anahtarıyla kaydet

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
