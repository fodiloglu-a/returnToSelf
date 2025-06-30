import { Component, OnInit, PLATFORM_ID, Inject, HostListener, ElementRef, ViewChild, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { NavComponent } from './components/home/nav/nav.component';
import { HttpClient } from '@angular/common/http';
import { FooterComponent } from "./components/home/footer/footer.component";
import { TranslationService } from './services/translation.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, NavComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild('backgroundGif') gifElement!: ElementRef<HTMLImageElement>;

  title = 'return-to-self';

  // PERFORMANCE OPTIMIZATION: Farklı cihazlar için farklı kaynaklar
  gifSources = {
    mobile: '/video.gif', // Statik WebP mobil için
    tablet: '/video.gif', // Statik WebP tablet için
    desktop: '/video.gif' // Sadece desktop'ta GIF
  };

  // PERFORMANCE STATE
  gifPath = '';
  isGifLoaded = false;
  showFallback = true;
  loadingStrategy: 'immediate' | 'lazy' | 'critical' = 'critical';

  // Device detection
  windowWidth = 0;
  windowHeight = 0;
  isMobile = false;
  isTablet = false;
  isDesktop = false;

  // Performance tracking
  loadStartTime = 0;
  loadEndTime = 0;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private elementRef: ElementRef,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private translationService: TranslationService
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.windowWidth = window.innerWidth;
      this.windowHeight = window.innerHeight;
      this.categorizeDevice();
      this.determineLoadingStrategy();
    }
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.selectOptimalBackground();

      // CRITICAL: Sadece desktop'ta GIF preload et
      if (this.isDesktop && this.loadingStrategy === 'critical') {
        this.preloadCriticalResources();
      }
    }
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // PERFORMANCE: Micro task'ta yükle, main thread'i bloke etme
      queueMicrotask(() => {
        this.initializeBackground();
      });
    }
  }

  // OPTIMIZATION: Cihaz kategorisi belirleme
  private categorizeDevice(): void {
    const width = this.windowWidth;
    const connection = (navigator as any).connection;

    this.isMobile = width < 768;
    this.isTablet = width >= 768 && width < 1024;
    this.isDesktop = width >= 1024;

    // Network durumunu da kontrol et
    if (connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')) {
      this.isMobile = true; // Yavaş bağlantıda mobil gibi davran
    }
  }

  // OPTIMIZATION: Yükleme stratejisini belirle
  private determineLoadingStrategy(): void {
    if (this.isMobile) {
      this.loadingStrategy = 'lazy'; // Mobilde lazy load
    } else if (this.isTablet) {
      this.loadingStrategy = 'lazy'; // Tablette de lazy
    } else {
      this.loadingStrategy = 'critical'; // Sadece desktop'ta immediate
    }
  }

  // OPTIMIZATION: En optimal arka plan kaynağını seç
  private selectOptimalBackground(): void {
    if (this.isMobile) {
      // Mobilde hafif WebP statik görsel
      this.gifPath = this.gifSources.mobile;
    } else if (this.isTablet) {
      // Tablette orta çözünürlük WebP
      this.gifPath = this.gifSources.tablet;
    } else {
      // Sadece desktop'ta GIF kullan
      this.gifPath = this.gifSources.desktop;
    }
  }

  // OPTIMIZATION: Critical resource'ları preload et
  private preloadCriticalResources(): void {
    if (!this.isDesktop) return;

    // Sadece desktop'ta GIF'i preload et
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = this.gifSources.desktop;
    document.head.appendChild(link);
  }

  // OPTIMIZATION: Arka plan başlatma
  private initializeBackground(): void {
    if (!this.gifElement) return;

    this.loadStartTime = performance.now();

    if (this.loadingStrategy === 'lazy') {
      // Lazy loading için intersection observer kullan
      this.setupLazyLoading();
    } else {
      // Critical loading için immediate load
      this.loadBackground();
    }
  }

  // OPTIMIZATION: Lazy loading setup
  private setupLazyLoading(): void {
    if (!('IntersectionObserver' in window)) {
      // Fallback: Observer yoksa immediate load
      this.loadBackground();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          this.loadBackground();
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(this.gifElement.nativeElement);
  }

  // OPTIMIZATION: Arka plan yükleme
  private loadBackground(): void {
    const img = this.gifElement.nativeElement;

    // Zaten yüklü mü kontrol et
    if (img.complete && img.naturalWidth !== 0) {
      this.onBackgroundLoaded();
      return;
    }

    // Event listeners
    img.onload = () => this.onBackgroundLoaded();
    img.onerror = () => this.onBackgroundError();

    // Load image
    img.src = this.gifPath;
  }

  // OPTIMIZATION: Başarılı yükleme handler
  private onBackgroundLoaded(): void {
    this.loadEndTime = performance.now();
    this.isGifLoaded = true;
    this.showFallback = false;

    // Performance tracking
    const loadTime = this.loadEndTime - this.loadStartTime;
    console.log(`Background loaded in ${loadTime.toFixed(2)}ms`);

    this.cdr.detectChanges();
  }

  // OPTIMIZATION: Hata durumu handler
  private onBackgroundError(): void {
    console.warn('Background failed to load, showing fallback');
    this.isGifLoaded = false;
    this.showFallback = true;
    this.cdr.detectChanges();
  }

  // OPTIMIZATION: Window resize handler
  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const prevWidth = this.windowWidth;
    this.windowWidth = window.innerWidth;
    this.windowHeight = window.innerHeight;

    // Cihaz kategorisi değişti mi?
    const prevMobile = this.isMobile;
    const prevTablet = this.isTablet;

    this.categorizeDevice();

    // Kategori değiştiyse background'ı güncelle
    if (prevMobile !== this.isMobile || prevTablet !== this.isTablet) {
      this.selectOptimalBackground();
      this.reloadBackground();
    }
  }

  // OPTIMIZATION: Background yeniden yükleme
  private reloadBackground(): void {
    this.isGifLoaded = false;
    this.showFallback = true;

    // Debounce reload işlemi
    setTimeout(() => {
      if (this.gifElement?.nativeElement) {
        const img = this.gifElement.nativeElement;
        img.src = this.gifPath + '?v=' + Date.now();
        this.cdr.detectChanges();
      }
    }, 100);
  }

  // UTILITY: Cihaz tipi getter'ları
  get currentDeviceType(): string {
    if (this.isMobile) return 'mobile';
    if (this.isTablet) return 'tablet';
    return 'desktop';
  }

  get isUsingGif(): boolean {
    return this.isDesktop && this.gifPath.includes('.gif');
  }
}
