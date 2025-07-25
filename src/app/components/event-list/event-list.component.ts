// src/app/components/event-list/event-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common'; // DatePipe eklendi
import { Subject, takeUntil } from 'rxjs';
import {
  EventModel,
  EventCategory,
  EventLevel,
  TargetAudience,
  GenderType,
  TherapeuticMethod,
  ParticipationStyle,
  TargetProblem,
  ExpectedOutcome,
  AccommodationType, // Eklenen enum'lar
  SpecialPackage,
  EthicalStandard
} from '../../models/event.model';
import { EventService } from '../../services/event.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core'; // TranslateService eklendi
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // MatSnackBar ve MatSnackBarModule eklendi

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
     // DatePipe import edildi
    MatSnackBarModule // MatSnackBarModule eklendi
  ],
  templateUrl: './event-list.component.html',
  styleUrl: './event-list.component.css'
})
export class EventListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  events: EventModel[] = [];
  upcomingEvents: EventModel[] = [];
  pastEvents: EventModel[] = [];
  isLoading = false;
  error: string | null = null;

  // Statistics
  totalEvents = 0;
  availableSpots = 0;
  freeEvents = 0;

  constructor(
    private eventService: EventService,
    private router: Router,
    public translateService: TranslateService, // HTML'den erişim için public yapıldı
    private datePipe: DatePipe, // DatePipe enjekte edildi
    private snackBar: MatSnackBar // MatSnackBar enjekte edildi
  ) {}

  ngOnInit(): void {
    this.loadEvents();
    this.loadStatistics();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Tüm etkinlikleri yükler.
   */
  private loadEvents(): void {
    this.isLoading = true;
    this.error = null;

    this.eventService.getAllEvents()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (events) => {
          this.events = events;
          this.separateEvents();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Etkinlikler yüklenirken hata:', error);
          // Hata mesajı null olabileceği için varsayılan bir değer sağlandı
          const errorMessage = error.message || this.translateService.instant('EVENT_LIST.ERROR.TITLE');
          this.error = errorMessage; // error değişkenini de güncelle
          this.isLoading = false;
          this.snackBar.open(errorMessage, this.translateService.instant('COMMON.CLOSE_BUTTON'), {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  /**
   * İstatistikleri yükler.
   */
  private loadStatistics(): void {
    this.eventService.getEventStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats: any) => {
          this.totalEvents = stats.totalActiveEvents || 0;
          this.freeEvents = stats.freeEvents || 0;
          this.calculateAvailableSpots();
        },
        error: (error) => {
          console.error('İstatistikler yüklenirken hata:', error);
        }
      });
  }

  /**
   * Etkinlikleri gelecek ve geçmiş olarak ayırır.
   */
  private separateEvents(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.upcomingEvents = this.events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= today;
    });

    this.pastEvents = this.events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate < today;
    });
  }

  /**
   * Toplam müsait yerleri hesaplar.
   */
  private calculateAvailableSpots(): void {
    this.availableSpots = this.upcomingEvents.reduce((total, event) => {
      return total + Math.max(0, event.capacity - event.registeredCount);
    }, 0);
  }

  /**
   * Navigasyon metotları
   */
  navigateToEventDetail(eventId: number): void {
    this.router.navigate(['/events', eventId]);
  }

  goBack(): void {
    this.router.navigate(['/']); // Ana sayfaya dönmek için
  }

  /**
   * Görüntüleme yardımcı metotları
   */
  formatDate(date: string): string {
    const eventDate = new Date(date);
    // DatePipe kullanarak biçimlendir, Ukraynaca (uk) locale kullan
    return this.datePipe.transform(eventDate, 'longDate', undefined, 'uk') || '';
  }

  formatTime(time: string): string {
    return time.substring(0, 5); // HH:MM formatı
  }

  getEventPriceDisplay(event: EventModel): string {
    return event.price === 0 ? this.translateService.instant('EVENT_LIST.PRICING.FREE') : `₺${event.price}`; // Çeviri kullanıldı
  }

  getAvailableSpots(event: EventModel): number {
    return Math.max(0, event.capacity - event.registeredCount);
  }

  getCapacityPercentage(event: EventModel): number {
    if (!event || event.capacity === 0) return 0;
    return (event.registeredCount / event.capacity) * 100;
  }

  isAlmostFull(event: EventModel): boolean {
    return this.getAvailableSpots(event) <= 3 && this.getAvailableSpots(event) > 0;
  }

  isFull(event: EventModel): boolean {
    return this.getAvailableSpots(event) === 0;
  }

  isUpcoming(event: EventModel): boolean {
    const eventDate = new Date(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate >= today;
  }

  getDaysUntilEvent(event: EventModel): number {
    const eventDate = new Date(event.date);
    const today = new Date();
    const diffTime = eventDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Geliştirilmiş görüntüleme metotları (TranslateService kullanıldı)
   */
  getCategoryText(category: EventCategory): string {
    return this.translateService.instant('EVENT_CATEGORY.' + category.toUpperCase());
  }

  getLevelText(level: EventLevel): string {
    return this.translateService.instant('EVENT_LEVEL.' + level.toUpperCase());
  }

  getTargetAudienceText(audience: TargetAudience): string {
    return this.translateService.instant('TARGET_AUDIENCE.' + audience.toUpperCase());
  }

  getKeyFeatures(event: EventModel): string[] {
    const features: string[] = [];

    // En önemli özellikleri öncelik sırasına göre ekle ve çevir
    if (event.targetAudience === TargetAudience.WOMEN_ONLY) {
      features.push(this.translateService.instant('TARGET_AUDIENCE.WOMEN_ONLY'));
    } else if (event.targetAudience === TargetAudience.MEN_ONLY) {
      features.push(this.translateService.instant('TARGET_AUDIENCE.MEN_ONLY'));
    } else if (event.targetAudience === TargetAudience.COUPLES) {
      features.push(this.translateService.instant('TARGET_AUDIENCE.COUPLES'));
    }

    if (event.allowsObserverMode) {
      features.push(this.translateService.instant('PARTICIPATION_STYLE.OBSERVER_FRIENDLY'));
    }

    if (event.individualSessionIncluded) {
      features.push(this.translateService.instant('SPECIAL_PACKAGE.PERSONAL_SUPPORT')); // veya daha spesifik bir anahtar
    }

    if (event.therapeuticMethods && event.therapeuticMethods.length > 0) {
      const primaryMethod = event.therapeuticMethods[0];
      features.push(this.getTherapeuticMethodText(primaryMethod));
    }

    if (event.accommodationOptions && event.accommodationOptions.length > 0) {
      features.push(this.translateService.instant('COMMON.ACCOMMODATION_INCLUDED'));
    }

    // Maksimum 3 özellik döndür
    return features.slice(0, 3);
  }

  getTherapeuticMethodText(method: TherapeuticMethod): string {
    return this.translateService.instant('THERAPEUTIC_METHOD.' + method.toUpperCase());
  }

  /**
   * ngFor optimizasyonu için trackBy fonksiyonu
   */
  trackByEventId(index: number, event: EventModel): number {
    return event.id;
  }

  /**
   * Etkinlikleri yeniler.
   */
  refreshEvents(): void {
    this.loadEvents();
    this.loadStatistics();
  }
}
