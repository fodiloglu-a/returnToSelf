import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import {
  AccommodationType,
  EventCategory,
  EventLevel,
  EventModel, ExpectedOutcome, ParticipationStyle,
  TargetAudience,
  TargetProblem,
  TherapeuticMethod
} from '../../models/event.model';
import {EventService} from '../../services/event.service';
import {TranslatePipe} from '@ngx-translate/core';
import {BlogCardsComponent} from '../home/blog-cards/blog-cards.component';
import {Blog} from '../../models/blog.model';
import {BlogService} from '../../services/blog.service';
import {AuthService} from '../../services/auth.service';
import {CommentService} from '../../services/comment.service';

@Component({
  selector: 'app-event-detail',
  imports: [CommonModule, TranslatePipe],
  templateUrl: './event-detail.component.html',
  styleUrl: './event-detail.component.css'
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
  isBookmarked = false;
  isRegistering = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,

  ) {

  }

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.eventId = +params['id'];
        if (this.eventId) {
          this.loadEventDetail();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load event detail data
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
          this.loadRelatedEvents();

        },
        error: (error) => {
          this.error = error.message || 'Etkinlik yüklenirken bir hata oluştu.';
          this.isLoading = false;
        }
      });
  }

  /**
   * Load related events
   */
  private loadRelatedEvents(): void {
    if (!this.event) return;

    this.eventService.getEventsByCategory(this.event.category)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (events) => {
          // Current event'i çıkar ve maksimum 3 related event göster
          this.relatedEvents = events
            .filter(e => e.id !== this.eventId)
            .slice(0, 3);
        },
        error: (error) => {
          console.error('Related events loading error:', error);
        }
      });
  }

  /**
   * Navigation methods
   */
  goBack(): void {
    this.router.navigate(['/events']);
  }

  navigateToRelatedEvent(eventId: number): void {
    this.router.navigate(['/events', eventId]);
  }

  /**
   * Action methods
   */
  registerForEvent(): void {
    if (!this.event || this.getAvailableSpots() === 0) return;

    this.isRegistering = true;

    // Telegram link ile kayıt için yönlendirme
    const telegramMessage = encodeURIComponent(
      `Merhaba! "${this.event.title}" etkinliğine katılmak istiyorum. Detaylar:\n\n` +
      `📅 Tarih: ${this.formatDate(this.event.date)}\n` +
      `⏰ Saat: ${this.event.time}\n` +
      `📍 Konum: ${this.event.location}\n` +
      `💰 Ücret: ${this.getEventPriceDisplay()}\n\n` +
      `Kayıt işlemlerimi tamamlayabilir miyiz?`
    );

    const telegramLink = `https://t.me/your_bot_username?text=${telegramMessage}`;
    window.open(telegramLink, '_blank');

    // Reset loading state after a delay
    setTimeout(() => {
      this.isRegistering = false;
    }, 2000);
  }

  shareEvent(): void {
    if (navigator.share && this.event) {
      navigator.share({
        title: this.event.title,
        text: this.event.shortDescription,
        url: window.location.href
      });
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // Show notification (implement notification service)
    }
  }

  toggleBookmark(): void {
    this.isBookmarked = !this.isBookmarked;
    // Implement bookmark logic with service
  }

  toggleDescription(): void {
    this.showFullDescription = !this.showFullDescription;
  }

  /**
   * Display helper methods
   */
  formatDate(date: string): string {
    const eventDate = new Date(date);
    return eventDate.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long'
    });
  }

  formatTime(time: string): string {
    return time.substring(0, 5); // HH:MM format
  }

  getEventPriceDisplay(): string {
    if (!this.event) return '';
    return this.event.price === 0 ? 'Ücretsiz' : `₺${this.event.price}`;
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
    today.setHours(0, 0, 0, 0);
    return eventDate >= today;
  }

  getDaysUntilEvent(): number {
    if (!this.event) return 0;
    const eventDate = new Date(this.event.date);
    const today = new Date();
    const diffTime = eventDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Enhanced display methods
   */
  getCategoryText(): string {
    if (!this.event) return '';
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
    return categoryMap[this.event.category] || this.event.category;
  }

  getLevelText(): string {
    if (!this.event) return '';
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
    return levelMap[this.event.level] || this.event.level;
  }

  getTargetAudienceText(): string {
    if (!this.event) return '';
    const audienceMap = {
      [TargetAudience.WOMEN_ONLY]: 'Sadece Kadınlar',
      [TargetAudience.MEN_ONLY]: 'Sadece Erkekler',
      [TargetAudience.MIXED_GENDER]: 'Karma Grup',
      [TargetAudience.COUPLES]: 'Çiftler',
      [TargetAudience.FAMILIES]: 'Aileler',
      [TargetAudience.PROFESSIONALS]: 'Profesyoneller',
      [TargetAudience.STUDENTS]: 'Öğrenciler',
      [TargetAudience.SENIORS]: 'Yaşlılar'
    };
    return audienceMap[this.event.targetAudience] || this.event.targetAudience;
  }

  getTherapeuticMethodsText(): string[] {
    if (!this.event?.therapeuticMethods) return [];
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
    return this.event.therapeuticMethods.map(method => methodMap[method] || method);
  }

  getTargetProblemsText(): string[] {
    if (!this.event?.targetProblems) return [];
    const problemMap = {
      [TargetProblem.BURNOUT]: 'Tükenmişlik',
      [TargetProblem.ANXIETY]: 'Anksiyete',
      [TargetProblem.DEPRESSION]: 'Depresyon',
      [TargetProblem.RELATIONSHIP_ISSUES]: 'İlişki Sorunları',
      [TargetProblem.IDENTITY_CRISIS]: 'Kimlik Krizi',
      [TargetProblem.WORK_LIFE_BALANCE]: 'İş-Yaşam Dengesi',
      [TargetProblem.SELF_ESTEEM]: 'Özgüven',
      [TargetProblem.GRIEF_LOSS]: 'Yas ve Kayıp',
      [TargetProblem.TRAUMA]: 'Travma',
      [TargetProblem.ADDICTION]: 'Bağımlılık',
      [TargetProblem.FAMILY_DYNAMICS]: 'Aile Dinamikleri',
      [TargetProblem.LIFE_TRANSITIONS]: 'Yaşam Geçişleri',
      [TargetProblem.INNER_VOICE_LOSS]: 'İç Ses Kaybı',
      [TargetProblem.SYSTEM_FATIGUE]: 'Sistem Yorgunluğu'
    };
    return this.event.targetProblems.map(problem => problemMap[problem] || problem);
  }

  getExpectedOutcomesText(): string[] {
    if (!this.event?.expectedOutcomes) return [];
    const outcomeMap = {
      [ExpectedOutcome.SELF_AWARENESS]: 'Öz Farkındalık',
      [ExpectedOutcome.EMOTIONAL_REGULATION]: 'Duygusal Düzenleme',
      [ExpectedOutcome.STRESS_REDUCTION]: 'Stres Azaltma',
      [ExpectedOutcome.INNER_PEACE]: 'İç Huzur',
      [ExpectedOutcome.CLARITY]: 'Netlik',
      [ExpectedOutcome.PERSONAL_GROWTH]: 'Kişisel Gelişim',
      [ExpectedOutcome.HEALING]: 'İyileşme',
      [ExpectedOutcome.CONNECTION]: 'Bağlantı',
      [ExpectedOutcome.EMPOWERMENT]: 'Güçlenme',
      [ExpectedOutcome.RENEWED_ENERGY]: 'Yenilenmiş Enerji',
      [ExpectedOutcome.LIFE_DIRECTION]: 'Yaşam Yönü',
      [ExpectedOutcome.AUTHENTICITY]: 'Özgünlük'
    };
    return this.event.expectedOutcomes.map(outcome => outcomeMap[outcome] || outcome);
  }

  getAccommodationOptionsText(): string[] {
    if (!this.event?.accommodationOptions) return [];
    const accommodationMap = {
      [AccommodationType.SINGLE_ROOM]: 'Tek Kişilik Oda',
      [AccommodationType.DOUBLE_ROOM]: 'İki Kişilik Oda',
      [AccommodationType.TRIPLE_ROOM]: 'Üç Kişilik Oda',
      [AccommodationType.SHARED_DORMITORY]: 'Ortak Yatak Odası',
      [AccommodationType.LUXURY_SUITE]: 'Lüks Suit'
    };
    return this.event.accommodationOptions.map(acc => accommodationMap[acc] || acc);
  }

  getAgeRangeText(): string {
    if (!this.event) return 'Tüm yaşlar';
    if (this.event.minAge && this.event.maxAge) {
      return `${this.event.minAge}-${this.event.maxAge} yaş`;
    } else if (this.event.minAge) {
      return `${this.event.minAge}+ yaş`;
    } else if (this.event.maxAge) {
      return `${this.event.maxAge} yaş altı`;
    }
    return 'Tüm yaşlar';
  }

  getParticipationStyleText(): string {
    if (!this.event) return '';
    const styleMap = {
      [ParticipationStyle.ACTIVE_REQUIRED]: 'Aktif Katılım Gerekli',
      [ParticipationStyle.FLEXIBLE_PARTICIPATION]: 'Esnek Katılım',
      [ParticipationStyle.OBSERVER_FRIENDLY]: 'Gözlemci Dostu',
      [ParticipationStyle.SELF_PACED]: 'Kendi Temponuzda',
      [ParticipationStyle.GROUP_INTERACTIVE]: 'Grup Etkileşimli'
    };
    return styleMap[this.event.participationStyle] || this.event.participationStyle;
  }

  /**
   * Track by function for ngFor optimization
   */
  trackByEventId(index: number, event: EventModel): number {
    return event.id;
  }





}
