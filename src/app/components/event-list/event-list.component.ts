import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
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
  ExpectedOutcome
} from '../../models/event.model';
import {EventService} from '../../services/event.service';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  selector: 'app-event-list',
  imports: [CommonModule, TranslatePipe],
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
    private router: Router
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
   * Load all events
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
          this.error = error.message || 'Etkinlikler yüklenirken bir hata oluştu.';
          this.isLoading = false;
        }
      });
  }

  /**
   * Load statistics
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
          console.error('Statistics loading error:', error);
        }
      });
  }

  /**
   * Separate events into upcoming and past
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
   * Calculate total available spots
   */
  private calculateAvailableSpots(): void {
    this.availableSpots = this.upcomingEvents.reduce((total, event) => {
      return total + Math.max(0, event.capacity - event.registeredCount);
    }, 0);
  }

  /**
   * Navigation methods
   */
  navigateToEventDetail(eventId: number): void {
    this.router.navigate(['/events', eventId]);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  /**
   * Display helper methods
   */
  formatDate(date: string): string {
    const eventDate = new Date(date);
    return eventDate.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  formatTime(time: string): string {
    return time.substring(0, 5); // HH:MM format
  }

  getEventPriceDisplay(event: EventModel): string {
    return event.price === 0 ? 'Ücretsiz' : `₺${event.price}`;
  }

  getAvailableSpots(event: EventModel): number {
    return Math.max(0, event.capacity - event.registeredCount);
  }

  getCapacityPercentage(event: EventModel): number {
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
   * Enhanced display methods
   */
  getCategoryText(category: EventCategory): string {
    const categoryMap = {
      [EventCategory.WORKSHOP]: 'Atölye',
      [EventCategory.SEMINAR]: 'Seminer',
      [EventCategory.RETREAT]: 'Retreat',
      [EventCategory.THERAPY]: 'Terapi',
      [EventCategory.MINDFULNESS]: 'Farkındalık',
      [EventCategory.WOMENS_RETREAT]: 'Kadın Retreat\'i',
      [EventCategory.MENS_RETREAT]: 'Erkek Retreat\'i',
      [EventCategory.COUPLES_RETREAT]: 'Çift Retreat\'i',
      [EventCategory.DIGITAL_DETOX]: 'Dijital Detoks',
      [EventCategory.THERAPEUTIC_INTENSIVE]: 'Terapötik Yoğunlaştırma',
      [EventCategory.PSYCHODRAMA_WORKSHOP]: 'Psikodrama Atölyesi',
      [EventCategory.FAMILY_CONSTELLATION]: 'Aile Dizimi'
    };
    return categoryMap[category] || category;
  }

  getLevelText(level: EventLevel): string {
    const levelMap = {
      [EventLevel.BEGINNER]: 'Başlangıç',
      [EventLevel.INTERMEDIATE]: 'Orta',
      [EventLevel.ADVANCED]: 'İleri',
      [EventLevel.ALL_LEVELS]: 'Tüm Seviyeler',
      [EventLevel.NO_EXPERIENCE_NEEDED]: 'Deneyim Gerekmez',
      [EventLevel.SOME_THERAPY_EXPERIENCE]: 'Biraz Terapi Deneyimi',
      [EventLevel.ADVANCED_PRACTITIONERS]: 'İleri Seviye Uygulayıcılar',
      [EventLevel.PROFESSIONALS_ONLY]: 'Sadece Profesyoneller'
    };
    return levelMap[level] || level;
  }

  getTargetAudienceText(audience: TargetAudience): string {
    const audienceMap = {
      [TargetAudience.WOMEN_ONLY]: 'Kadınlara Özel',
      [TargetAudience.MEN_ONLY]: 'Erkeklere Özel',
      [TargetAudience.MIXED_GENDER]: 'Karma Grup',
      [TargetAudience.COUPLES]: 'Çiftler',
      [TargetAudience.FAMILIES]: 'Aileler',
      [TargetAudience.PROFESSIONALS]: 'Profesyoneller',
      [TargetAudience.STUDENTS]: 'Öğrenciler',
      [TargetAudience.SENIORS]: 'Yaşlılar'
    };
    return audienceMap[audience] || audience;
  }

  getKeyFeatures(event: EventModel): string[] {
    const features: string[] = [];

    // En önemli özellikleri öncelik sırasına göre ekle
    if (event.targetAudience === TargetAudience.WOMEN_ONLY) {
      features.push('Kadınlara Özel');
    } else if (event.targetAudience === TargetAudience.MEN_ONLY) {
      features.push('Erkeklere Özel');
    } else if (event.targetAudience === TargetAudience.COUPLES) {
      features.push('Çiftler İçin');
    }

    if (event.allowsObserverMode) {
      features.push('Gözlemci Dostu');
    }

    if (event.individualSessionIncluded) {
      features.push('Bireysel Oturum');
    }

    if (event.therapeuticMethods && event.therapeuticMethods.length > 0) {
      const primaryMethod = event.therapeuticMethods[0];
      features.push(this.getTherapeuticMethodText(primaryMethod));
    }

    if (event.accommodationOptions && event.accommodationOptions.length > 0) {
      features.push('Konaklama Dahil');
    }

    // Maksimum 3 özellik döndür
    return features.slice(0, 3);
  }

  getTherapeuticMethodText(method: TherapeuticMethod): string {
    const methodMap = {
      [TherapeuticMethod.PSYCHODRAMA]: 'Psikodrama',
      [TherapeuticMethod.SYSTEMIC_FAMILY_THERAPY]: 'Sistemik Aile Terapisi',
      [TherapeuticMethod.METAPHORICAL_CARDS]: 'Metaforik Kartlar',
      [TherapeuticMethod.SYMBOL_DRAMA]: 'Sembol Drama',
      [TherapeuticMethod.BODY_AWARENESS]: 'Beden Farkındalığı',
      [TherapeuticMethod.GESTALT_THERAPY]: 'Gestalt Terapi',
      [TherapeuticMethod.CBT]: 'Bilişsel Davranışçı Terapi',
      [TherapeuticMethod.MINDFULNESS]: 'Farkındalık',
      [TherapeuticMethod.MEDITATION]: 'Meditasyon',
      [TherapeuticMethod.ART_THERAPY]: 'Sanat Terapisi',
      [TherapeuticMethod.MUSIC_THERAPY]: 'Müzik Terapisi',
      [TherapeuticMethod.DANCE_THERAPY]: 'Dans Terapisi'
    };
    return methodMap[method] || method;
  }

  /**
   * Track by function for ngFor optimization
   */
  trackByEventId(index: number, event: EventModel): number {
    return event.id;
  }

  /**
   * Refresh events
   */
  refreshEvents(): void {
    this.loadEvents();
    this.loadStatistics();
  }
}
