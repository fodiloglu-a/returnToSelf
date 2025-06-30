import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import {
  EventCategory,
  EventLevel,
  EventModel,
  TargetAudience,
  GenderType,
  TherapeuticMethod,
  ParticipationStyle,
  TargetProblem,
  ExpectedOutcome
} from '../../../models/event.model';
import { EventService } from '../../../services/event.service';
import { Router } from '@angular/router';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  selector: 'app-event-info',
  imports: [CommonModule, TranslatePipe],
  templateUrl: './event-info.component.html',
  styleUrl: './event-info.component.css'
})
export class EventInfoComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  events: EventModel[] = [];
  isLoading = false;
  error: string | null = null;

  // Filter states - Enhanced
  selectedCategory: EventCategory | null = null;
  selectedTargetAudience: TargetAudience | null = null;
  selectedTherapeuticMethod: TherapeuticMethod | null = null;
  showOnlyUpcoming = true;
  showOnlyAvailable = true;
  showOnlyCertified = false;
  showDigitalDetoxOnly = false;
  showWithIndividualSessions = false;

  constructor(
    private eventService: EventService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadEvents();

    // Subscribe to loading state
    this.eventService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isLoading = loading;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load events based on current filters
   */
  private loadEvents(): void {
    this.error = null;

    const source$ = this.showOnlyUpcoming
      ? this.eventService.getUpcomingEvents()
      : this.eventService.getAllEvents();

    source$.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (events) => {
          this.events = this.applyClientSideFilters(events);
        },
        error: (error) => {
          this.handleError(error);
        }
      });
  }

  /**
   * Navigate to related blog post
   */
  goToRelatedBlog(event: EventModel): void {

    this.router.navigate(['/blogs', event.blogId]);
  }

  /**
   * Generate blog slug from event
   */
  private generateBlogSlug(event: EventModel): string {
    return event.title
      .toLowerCase()
      .replace(/[çğıöşü]/g, (char) => {
        const charMap: { [key: string]: string } = {
          'ç': 'c', 'ğ': 'g', 'ı': 'i',
          'ö': 'o', 'ş': 's', 'ü': 'u'
        };
        return charMap[char] || char;
      })
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Enhanced client-side filters
   */
  private applyClientSideFilters(events: EventModel[]): EventModel[] {
    let filteredEvents = [...events];

    // Existing filters
    if (this.selectedCategory) {
      filteredEvents = filteredEvents.filter(event => event.category === this.selectedCategory);
    }

    if (this.showOnlyAvailable) {
      filteredEvents = filteredEvents.filter(event => this.getAvailableSpots(event) > 0);
    }

    // NEW: Enhanced filters
    if (this.selectedTargetAudience) {
      filteredEvents = filteredEvents.filter(event => event.targetAudience === this.selectedTargetAudience);
    }

    if (this.selectedTherapeuticMethod) {
      filteredEvents = filteredEvents.filter(event =>
        event.therapeuticMethods?.includes(this.selectedTherapeuticMethod!)
      );
    }

    if (this.showOnlyCertified) {
      filteredEvents = filteredEvents.filter(event => event.certifiedMethods);
    }

    if (this.showDigitalDetoxOnly) {
      filteredEvents = filteredEvents.filter(event => event.includesDigitalDetox);
    }

    if (this.showWithIndividualSessions) {
      filteredEvents = filteredEvents.filter(event => event.individualSessionIncluded);
    }

    return filteredEvents;
  }

  // Enhanced filter methods
  filterByCategory(category: EventCategory | null): void {
    this.selectedCategory = category;
    this.loadEvents();
  }

  filterByTargetAudience(audience: TargetAudience | null): void {
    this.selectedTargetAudience = audience;
    this.loadEvents();
  }

  filterByTherapeuticMethod(method: TherapeuticMethod | null): void {
    this.selectedTherapeuticMethod = method;
    this.loadEvents();
  }

  toggleUpcomingFilter(): void {
    this.showOnlyUpcoming = !this.showOnlyUpcoming;
    this.loadEvents();
  }

  toggleAvailabilityFilter(): void {
    this.showOnlyAvailable = !this.showOnlyAvailable;
    this.loadEvents();
  }

  toggleCertifiedFilter(): void {
    this.showOnlyCertified = !this.showOnlyCertified;
    this.loadEvents();
  }

  toggleDigitalDetoxFilter(): void {
    this.showDigitalDetoxOnly = !this.showDigitalDetoxOnly;
    this.loadEvents();
  }

  toggleIndividualSessionsFilter(): void {
    this.showWithIndividualSessions = !this.showWithIndividualSessions;
    this.loadEvents();
  }

  refreshEvents(): void {
    this.loadEvents();
  }

  viewEventDetails(eventId: number): void {
    this.router.navigate(['/events', eventId]);
  }

  // NEW: Enhanced display methods

  /**
   * Get target audience display text
   */
  getTargetAudienceText(audience: TargetAudience): string {
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
    return audienceMap[audience] || audience;
  }

  /**
   * Get therapeutic method display text
   */
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
   * Get participation style display text
   */
  getParticipationStyleText(style: ParticipationStyle): string {
    const styleMap = {
      [ParticipationStyle.ACTIVE_REQUIRED]: 'Aktif Katılım Gerekli',
      [ParticipationStyle.FLEXIBLE_PARTICIPATION]: 'Esnek Katılım',
      [ParticipationStyle.OBSERVER_FRIENDLY]: 'Gözlemci Dostu',
      [ParticipationStyle.SELF_PACED]: 'Kendi Temponuzda',
      [ParticipationStyle.GROUP_INTERACTIVE]: 'Grup Etkileşimli'
    };
    return styleMap[style] || style;
  }

  /**
   * Get target problem display text
   */
  getTargetProblemText(problem: TargetProblem): string {
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
    return problemMap[problem] || problem;
  }

  /**
   * Get expected outcome display text
   */
  getExpectedOutcomeText(outcome: ExpectedOutcome): string {
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
    return outcomeMap[outcome] || outcome;
  }

  /**
   * Get age range display
   */
  getAgeRangeText(event: EventModel): string {
    if (event.minAge && event.maxAge) {
      return `${event.minAge}-${event.maxAge} yaş`;
    } else if (event.minAge) {
      return `${event.minAge}+ yaş`;
    } else if (event.maxAge) {
      return `${event.maxAge} yaş altı`;
    }
    return 'Tüm yaşlar';
  }

  /**
   * Get gender specific text
   */
  getGenderSpecificText(gender?: GenderType): string {
    if (!gender || gender === GenderType.ALL_GENDERS) {
      return '';
    }

    const genderMap = {
      [GenderType.FEMALE]: 'Kadınlara Özel',
      [GenderType.MALE]: 'Erkeklere Özel',
      [GenderType.NON_BINARY]: 'Non-Binary Dostu'
    };
    return genderMap[gender] || '';
  }

  /**
   * Check if event has special features
   */
  hasSpecialFeatures(event: EventModel): boolean {
    return event.allowsObserverMode ||
      event.includesDigitalDetox ||
      event.individualSessionIncluded ||
      (event.accommodationOptions && event.accommodationOptions.length > 0) ||
      event.participationStyle === ParticipationStyle.SELF_PACED;
  }

  // Enhanced existing methods

  /**
   * Enhanced category text with new categories
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

  /**
   * Enhanced level text with new levels
   */
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

  // Existing utility methods
  formatDate(date: Date | string): string {
    const eventDate = typeof date === 'string' ? new Date(date) : date;
    return eventDate.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  getAvailableSpots(event: EventModel): number {
    return Math.max(0, event.capacity - event.registeredCount);
  }

  isAlmostFull(event: EventModel): boolean {
    return this.getAvailableSpots(event) <= 3 && this.getAvailableSpots(event) > 0;
  }

  isUpcoming(event: EventModel): boolean {
    const eventDate = new Date(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate >= today;
  }

  isPast(event: EventModel): boolean {
    return !this.isUpcoming(event);
  }

  getEventPriceDisplay(event: EventModel): string {
    return event.price === 0 ? 'Ücretsiz' : `₺${event.price}`;
  }

  getCapacityPercentage(event: EventModel): number {
    return (event.registeredCount / event.capacity) * 100;
  }

  isFull(event: EventModel): boolean {
    return this.getAvailableSpots(event) === 0;
  }

  private handleError(error: any): void {
    console.error('Event loading error:', error);
    this.error = error.message || 'Etkinlikler yüklenirken bir hata oluştu.';
    this.events = [];
  }

  get availableCategories(): EventCategory[] {
    return Object.values(EventCategory);
  }

  get availableTargetAudiences(): TargetAudience[] {
    return Object.values(TargetAudience);
  }

  get availableTherapeuticMethods(): TherapeuticMethod[] {
    return Object.values(TherapeuticMethod);
  }

  trackByEventId(index: number, event: EventModel): number {
    return event.id;
  }

  handleCategoryChange(value: string): void {
    if (value === '') {
      this.filterByCategory(null);
      return;
    }
    this.filterByCategory(value as EventCategory);
  }

  handleTargetAudienceChange(value: string): void {
    if (value === '') {
      this.filterByTargetAudience(null);
      return;
    }
    this.filterByTargetAudience(value as TargetAudience);
  }

  handleTherapeuticMethodChange(value: string): void {
    if (value === '') {
      this.filterByTherapeuticMethod(null);
      return;
    }
    this.filterByTherapeuticMethod(value as TherapeuticMethod);
  }
  // EventInfoComponent'e eklenecek metod

  /**
   * Get key features for minimal card display (max 3)
   */
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
}
