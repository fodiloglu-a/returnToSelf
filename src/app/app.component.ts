import { Component, OnInit, PLATFORM_ID, Inject, HostListener, ElementRef, ViewChild, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { NavComponent } from './components/home/nav/nav.component';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FooterComponent } from "./components/home/footer/footer.component";
import {TranslationService} from './services/translation.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, NavComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild('backgroundGif') gifElement!: ElementRef<HTMLImageElement>;

  title = 'your-app-name';

  // GIF durumu
  gifPath = '/gif.gif'; // GIF yolunu kendi projenize göre ayarlayın

  isGifLoaded = false;
  showFallback = true;
  windowWidth = 0;
  windowHeight = 0;
  isMobile = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private elementRef: ElementRef,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private translationService: TranslationService
  ) {
    // Tarayıcı ortamında başlangıç değerlerini ayarla
    if (isPlatformBrowser(this.platformId)) {
      this.windowWidth = window.innerWidth;
      this.windowHeight = window.innerHeight;
      this.checkIfMobile();
    }
  }

  ngOnInit(): void {
    // Tarayıcı ortamında GIF kaynağını seç
    if (isPlatformBrowser(this.platformId)) {
      this.selectGifSource();
    }
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // GIF yükleme işlemini bir mikrosaniye sonra başlat
      // Bu, Angular'ın ilk değişiklik döngüsünün tamamlanmasını sağlar
      setTimeout(() => {
        this.preloadGif();
        this.cdr.detectChanges(); // Değişiklikleri algıla
      }, 0);
    }
  }

  // GIF'i önceden yükle ve önbelleğe al
  preloadGif(): void {
    if (!isPlatformBrowser(this.platformId) || !this.gifElement) {
      return;
    }

    const img = this.gifElement.nativeElement;

    // Önceden yüklenmiş mi kontrol et
    if (img.complete && img.naturalWidth !== 0) {
      this.onGifLoaded();
      return;
    }

    // Yükleme olay dinleyicileri
    img.onload = () => {
      this.onGifLoaded();
      this.cdr.detectChanges(); // Değişiklikleri algıla
    };

    img.onerror = () => {
      this.onGifError();
      this.cdr.detectChanges(); // Değişiklikleri algıla
    };

    // GIF'i yükle
    img.src = this.gifPath;
  }

  // GIF yüklendiğinde
  onGifLoaded(): void {
    this.isGifLoaded = true;
    this.showFallback = false;
  }

  // GIF yüklenemediğinde
  onGifError(): void {
    this.isGifLoaded = false;
    this.showFallback = true;
  }

  // Ekran boyutu değiştiğinde tetiklenir
  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    if (isPlatformBrowser(this.platformId)) {
      const prevWidth = this.windowWidth;
      const prevHeight = this.windowHeight;

      this.windowWidth = window.innerWidth;
      this.windowHeight = window.innerHeight;
      this.checkIfMobile();

      // Ekran boyutu önemli ölçüde değiştiyse GIF kaynağını güncelle
      if (Math.abs(prevWidth - this.windowWidth) > 200 ||
        Math.abs(prevHeight - this.windowHeight) > 200 ||
        (prevWidth < 768 && this.windowWidth >= 768) ||
        (prevWidth >= 768 && this.windowWidth < 768)) {
        this.selectGifSource();
      }
    }
  }

  // Cihaz tipine ve ekran boyutuna göre GIF kaynağını seç
  private selectGifSource(): void {
    // Eğer mobil cihaz ise veya ekran genişliği 768px'den küçükse
    if (this.isMobile || this.windowWidth < 768) {
      // Mobil için optimize edilmiş GIF (gerekirse)
      this.gifPath = '/gif.gif';
    } else {
      // Masaüstü için normal GIF
      this.gifPath = '/gif.gif';
    }

    // Eğer gif elementimiz hazırsa, yeniden yükle
    if (this.gifElement && this.gifElement.nativeElement) {
      this.reloadGif();
    }
  }

  // GIF'i yeniden yükle
  private reloadGif(): void {
    this.isGifLoaded = false;
    this.showFallback = true;

    // Asenkron olarak yeniden yükleme işlemini gerçekleştir
    setTimeout(() => {
      const img = this.gifElement.nativeElement;
      img.src = this.gifPath + '?t=' + new Date().getTime(); // Önbelleği atla
      this.cdr.detectChanges();
    }, 0);
  }

  // Mobil cihaz kontrolü
  private checkIfMobile(): void {
    this.isMobile = this.windowWidth < 768;
  }
}
