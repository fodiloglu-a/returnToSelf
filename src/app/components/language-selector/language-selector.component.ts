// src/app/components/language-selector/language-selector.component.ts
import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="language-selector">
      <button
        class="lang-btn"
        [class.active]="currentLanguage === 'tr'"
        (click)="changeLanguage('tr')"
        title="Türkçe">
        🇹🇷 TR
      </button>
      <button
        class="lang-btn"
        [class.active]="currentLanguage === 'uk'"
        (click)="changeLanguage('uk')"
        title="Українська">
        🇺🇦 UK
      </button>
    </div>
  `,
  styles: [`
    .language-selector {
      display: flex;
      gap: 8px;
    }

    .lang-btn {
      padding: 10px 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border-radius: 20px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.9rem;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .lang-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.5);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .lang-btn.active {
      background: rgba(255, 255, 255, 0.9);
      color: #333;
      border-color: white;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    }

    .lang-btn.active:hover {
      background: white;
    }
  `]
})
export class LanguageSelectorComponent implements OnInit {
  currentLanguage: string = 'uk';

  constructor(
    private translationService: TranslationService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.translationService.currentLanguage$.subscribe(
        language => this.currentLanguage = language
      );
    }
  }

  changeLanguage(language: string): void {
    this.translationService.setLanguage(language);
  }
}
