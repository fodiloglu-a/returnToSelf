// src/app/components/event-detail/event-detail.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import {
  AccommodationType,
  EventCategory,
  EventLevel,
  EventModel,
  ExpectedOutcome,
  ParticipationStyle,
  TargetAudience,
  TargetProblem,
  TherapeuticMethod,
  GenderType,
  SpecialPackage,
  EthicalStandard
} from '../../models/event.model';
import { EventService } from '../../services/event.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    MatSnackBarModule
  ],
  templateUrl: './event-detail.component.html',
  styleUrls: ['./event-detail.component.css']
})
export class EventDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  event: EventModel | null = null;
  relatedEvents: EventModel[] = [];
  isLoading = false;
  error: string | null = null;
  eventId: number | null = null;

  // UI States
  showFullDescription = false;
  isBookmarked = false; // Yer imi durumu
  isRegistering = false; // Kayıt olma durumu

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    public translateService: TranslateService, // HTML'den erişim için public yapıldı
    private datePipe: DatePipe,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // URL parametrelerindeki değişiklikleri dinle
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.eventId = +params['id']; // ID'yi sayıya çevir
        if (this.eventId) {
          this.loadEventDetail(); // Etkinlik detaylarını yükle
        }
      });
  }

  ngOnDestroy(): void {
    // Bellek sızıntılarını önlemek için abonelikleri temizle
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Etkinlik detay verilerini yükler.
   */
  private loadEventDetail(): void {
    if (!this.eventId) return;

    this.isLoading = true;
    this.error = null;

    this.eventService.getEventById(this.eventId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (event) => {
          this.event = event;
          this.isLoading = false;
          this.loadRelatedEvents(); // İlgili etkinlikleri yükle
        },
        error: (error) => {
          console.error('Etkinlik yüklenirken hata:', error);
          this.isLoading = false;
          // Hata mesajı null olabileceği için varsayılan bir değer sağlandı
          const errorMessage = error.message || this.translateService.instant('EVENT_DETAIL.ERROR.TITLE');
          this.snackBar.open(errorMessage, this.translateService.instant('COMMON.CLOSE_BUTTON'), {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  /**
   * İlgili etkinlikleri yükler.
   */
  private loadRelatedEvents(): void {
    if (!this.event) return;

    this.eventService.getEventsByCategory(this.event.category)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (events) => {
          // Mevcut etkinliği filtrele ve maksimum 3 ilgili etkinlik göster
          this.relatedEvents = events
            .filter(e => e.id !== this.eventId)
            .slice(0, 3);
        },
        error: (error) => {
          console.error('İlgili etkinlikler yüklenirken hata:', error);
        }
      });
  }

  /**
   * Navigasyon metotları
   */
  goBack(): void {
    this.router.navigate(['/events']);
  }

  navigateToRelatedEvent(eventId: number): void {
    this.router.navigate(['/events', eventId]);
  }

  /**
   * Aksiyon metotları
   */
  registerForEvent(): void {
    if (!this.event || this.getAvailableSpots() === 0) {
      if (this.getAvailableSpots() === 0) {
        this.snackBar.open(this.translateService.instant('EVENT_DETAIL.STATUS.FULL'), this.translateService.instant('COMMON.CLOSE_BUTTON'), {
          duration: 3000,
          panelClass: ['warning-snackbar']
        });
      }
      return;
    }

    this.isRegistering = true;

    // Telegram link ile kayıt için mesaj oluştur
    const telegramMessage = encodeURIComponent(
      `${this.translateService.instant('COMMON.HELLO')}! "${this.event.title}" ${this.translateService.instant('COMMON.EVENT_JOIN_REQUEST')}.\n\n` +
      `📅 ${this.translateService.instant('COMMON.DATE')}: ${this.formatDate(this.event.date)}\n` +
      `⏰ ${this.translateService.instant('COMMON.TIME')}: ${this.formatTime(this.event.time)}\n` +
      `📍 ${this.translateService.instant('COMMON.LOCATION')}: ${this.event.location}\n` +
      `💰 ${this.translateService.instant('COMMON.PRICE')}: ${this.getEventPriceDisplay()}\n\n` +
      `${this.translateService.instant('COMMON.REGISTRATION_PROCESS_QUESTION')}`
    );

    // Telegram bot kullanıcı adınızı buraya ekleyin
    const telegramLink = `https://t.me/your_bot_username?text=${telegramMessage}`;
    window.open(telegramLink, '_blank');

    // Yükleme durumunu gecikmeli olarak sıfırla
    setTimeout(() => {
      this.isRegistering = false;
    }, 2000);
  }

  shareEvent(): void {
    if (navigator.share && this.event) {
      // Web Share API destekleniyorsa kullan
      navigator.share({
        title: this.event.title,
        text: this.event.shortDescription,
        url: window.location.href
      }).catch(error => console.error('Paylaşma başarısız oldu:', error));
    } else {
      // Desteklenmiyorsa panoya kopyala
      navigator.clipboard.writeText(window.location.href).then(() => {
        this.snackBar.open(this.translateService.instant('BLOG_DETAIL.ACTIONS.COPY_LINK_SUCCESS'), this.translateService.instant('COMMON.CLOSE_BUTTON'), {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      }).catch(err => {
        console.error('URL kopyalanırken hata:', err);
        this.snackBar.open(this.translateService.instant('BLOG_DETAIL.ACTIONS.COPY_LINK_ERROR'), this.translateService.instant('COMMON.CLOSE_BUTTON'), {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      });
    }
  }

  toggleBookmark(): void {
    this.isBookmarked = !this.isBookmarked;
    // Yer imi mantığını servisle uygula (API çağrısı burada yapılabilir)
    this.snackBar.open(
      this.isBookmarked ? this.translateService.instant('EVENT_DETAIL.ACTIONS.SAVED') : this.translateService.instant('EVENT_DETAIL.ACTIONS.SAVE'),
      this.translateService.instant('COMMON.CLOSE_BUTTON'),
      {
        duration: 2000,
        panelClass: ['info-snackbar']
      }
    );
  }

  toggleDescription(): void {
    this.showFullDescription = !this.showFullDescription;
  }

  /**
   * Görüntüleme yardımcı metotları
   */
  formatDate(date: string): string {
    const eventDate = new Date(date);
    // DatePipe kullanarak biçimlendir, her zaman Ukraynaca (uk) locale kullan
    return this.datePipe.transform(eventDate, 'longDate', undefined, 'uk') || '';
  }

  formatTime(time: string): string {
    return time.substring(0, 5); // HH:MM formatı
  }

  getEventPriceDisplay(): string {
    if (!this.event) return '';
    return this.event.price === 0 ? this.translateService.instant('EVENT_DETAIL.PRICING.FREE') : `₺${this.event.price}`;
  }

  getAvailableSpots(): number {
    if (!this.event) return 0;
    return Math.max(0, this.event.capacity - this.event.registeredCount);
  }

  getCapacityPercentage(): number {
    if (!this.event) return 0;
    return (this.event.registeredCount / this.event.capacity) * 100;
  }

  isAlmostFull(): boolean {
    return this.getAvailableSpots() <= 3 && this.getAvailableSpots() > 0;
  }

  isFull(): boolean {
    return this.getAvailableSpots() === 0;
  }

  isUpcoming(): boolean {
    if (!this.event) return false;
    const eventDate = new Date(this.event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Sadece tarih karşılaştırması için saati sıfırla
    return eventDate >= today;
  }

  getDaysUntilEvent(): number {
    if (!this.event) return 0;
    const eventDate = new Date(this.event.date);
    const today = new Date();
    // Tam gün farkını hesapla
    const diffTime = eventDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Geliştirilmiş görüntüleme metotları (TranslateService kullanıldı)
   */
  getCategoryText(): string {
    if (!this.event) return '';
    // Enum anahtarını büyük harfe çevirerek çeviriye uygun hale getir
    return this.translateService.instant('EVENT_CATEGORY.' + this.event.category.toUpperCase());
  }

  getLevelText(): string {
    if (!this.event) return '';
    return this.translateService.instant('EVENT_LEVEL.' + this.event.level.toUpperCase());
  }

  getTargetAudienceText(): string {
    if (!this.event) return '';
    return this.translateService.instant('TARGET_AUDIENCE.' + this.event.targetAudience.toUpperCase());
  }

  getTherapeuticMethodsText(): string[] {
    if (!this.event?.therapeuticMethods) return [];
    return this.event.therapeuticMethods.map(method =>
      this.translateService.instant('THERAPEUTIC_METHOD.' + method.toUpperCase())
    );
  }

  getTargetProblemsText(): string[] {
    if (!this.event?.targetProblems) return [];
    return this.event.targetProblems.map(problem =>
      this.translateService.instant('TARGET_PROBLEM.' + problem.toUpperCase())
    );
  }

  getExpectedOutcomesText(): string[] {
    if (!this.event?.expectedOutcomes) return [];
    return this.event.expectedOutcomes.map(outcome =>
      this.translateService.instant('EXPECTED_OUTCOME.' + outcome.toUpperCase())
    );
  }

  getAccommodationOptionsText(): string[] {
    if (!this.event?.accommodationOptions) return [];
    return this.event.accommodationOptions.map(acc =>
      this.translateService.instant('ACCOMMODATION_TYPE.' + acc.toUpperCase())
    );
  }

  getAgeRangeText(): string {
    if (!this.event) return '';
    if (this.event.minAge && this.event.maxAge) {
      return `${this.event.minAge}-${this.event.maxAge} ${this.translateService.instant('COMMON.AGE')}`;
    } else if (this.event.minAge) {
      return `${this.event.minAge}+ ${this.translateService.instant('COMMON.AGE')}`;
    } else if (this.event.maxAge) {
      return `${this.translateService.instant('COMMON.AGE_UNDER_PREFIX')} ${this.event.maxAge} ${this.translateService.instant('COMMON.AGE_UNDER_SUFFIX')}`;
    }
    return this.translateService.instant('COMMON.ALL_AGES');
  }

  getParticipationStyleText(): string {
    if (!this.event) return '';
    return this.translateService.instant('PARTICIPATION_STYLE.' + this.event.participationStyle.toUpperCase());
  }

  /**
   * ngFor optimizasyonu için trackBy fonksiyonu
   */
  trackByEventId(index: number, event: EventModel): number {
    return event.id;
  }
}
