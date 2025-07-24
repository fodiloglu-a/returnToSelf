// src/app/components/home/event-info/event-info.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {Subject, takeUntil, Observable, combineLatest, map, BehaviorSubject} from 'rxjs'; // Observable, combineLatest, map eklendi
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
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-event-info',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './event-info.component.html',
  styleUrl: './event-info.component.css'
})
export class EventInfoComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // events: EventModel[] = []; // Bu satırı artık kullanmıyoruz.
  events$: Observable<EventModel[]>; // Filtrlenmiş events Observable'ı
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

  // Filtre durumlarını reaktif hale getirmek için BehaviorSubjectler
  private filterCategorySubject = new BehaviorSubject<EventCategory | null>(null);
  private filterTargetAudienceSubject = new BehaviorSubject<TargetAudience | null>(null);
  private filterTherapeuticMethodSubject = new BehaviorSubject<TherapeuticMethod | null>(null);
  private filterUpcomingSubject = new BehaviorSubject<boolean>(true);
  private filterAvailableSubject = new BehaviorSubject<boolean>(true);
  private filterCertifiedSubject = new BehaviorSubject<boolean>(false);
  private filterDigitalDetoxSubject = new BehaviorSubject<boolean>(false);
  private filterIndividualSessionsSubject = new BehaviorSubject<boolean>(false);


  constructor(
    private eventService: EventService,
    private router: Router
  ) {
    // combineLatest kullanarak tüm filtre Observable'larını ve servis data Observable'ını birleştiriyoruz
    this.events$ = combineLatest([
      this.eventService.events$, // Servisten gelen tüm olaylar
      this.filterCategorySubject,
      this.filterTargetAudienceSubject,
      this.filterTherapeuticMethodSubject,
      this.filterUpcomingSubject,
      this.filterAvailableSubject,
      this.filterCertifiedSubject,
      this.filterDigitalDetoxSubject,
      this.filterIndividualSessionsSubject
    ]).pipe(
      map(([events, category, audience, method, upcoming, available, certified, digitalDetox, individualSessions]) => {
        let filteredEvents = events || []; // events null olabilir

        // Filter by upcoming/past
        if (upcoming) {
          filteredEvents = filteredEvents.filter(event => this.eventService.isUpcoming(event));
        } else {
          filteredEvents = filteredEvents.filter(event => this.eventService.isPast(event));
        }

        // Apply other filters (client-side)
        if (category) {
          filteredEvents = filteredEvents.filter(event => event.category === category);
        }
        if (audience) {
          filteredEvents = filteredEvents.filter(event => event.targetAudience === audience);
        }
        if (method) {
          filteredEvents = filteredEvents.filter(event =>
            event.therapeuticMethods?.includes(method)
          );
        }
        if (available) {
          filteredEvents = filteredEvents.filter(event => this.eventService.getAvailableSpots(event) > 0);
        }
        if (certified) {
          filteredEvents = filteredEvents.filter(event => event.certifiedMethods);
        }
        if (digitalDetox) {
          filteredEvents = filteredEvents.filter(event => event.includesDigitalDetox);
        }
        if (individualSessions) {
          filteredEvents = filteredEvents.filter(event => event.individualSessionIncluded);
        }

        return filteredEvents;
      })
    );
  }

  ngOnInit(): void {
    // Sayfa yüklendiğinde tüm etkinlikleri bir kez yükle
    this.eventService.getAllEvents().pipe(takeUntil(this.destroy$)).subscribe({
      error: (error) => {
        this.handleError(error);
      }
    });

    // Servisin loading state'ine abone olun
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
   * Navigate to related blog post
   */
  goToRelatedBlog(event: EventModel): void {
    if (event.blogId) { // blogId'nin mevcut olduğundan emin olun
      this.router.navigate(['/blogs', event.blogId]);
    } else {
      console.warn('Bu etkinlikle ilişkili blog ID bulunamadı.');
      // Kullanıcıya bir bildirim gösterebilirsiniz
    }
  }

  /**
   * Filter methods now update BehaviorSubjects
   */
  filterByCategory(category: EventCategory | null): void {
    this.filterCategorySubject.next(category);
  }

  filterByTargetAudience(audience: TargetAudience | null): void {
    this.filterTargetAudienceSubject.next(audience);
  }

  filterByTherapeuticMethod(method: TherapeuticMethod | null): void {
    this.filterTherapeuticMethodSubject.next(method);
  }

  toggleUpcomingFilter(): void {
    this.showOnlyUpcoming = !this.showOnlyUpcoming;
    this.filterUpcomingSubject.next(this.showOnlyUpcoming);
  }

  toggleAvailabilityFilter(): void {
    this.showOnlyAvailable = !this.showOnlyAvailable;
    this.filterAvailableSubject.next(this.showOnlyAvailable);
  }

  toggleCertifiedFilter(): void {
    this.showOnlyCertified = !this.showOnlyCertified;
    this.filterCertifiedSubject.next(this.showOnlyCertified);
  }

  toggleDigitalDetoxFilter(): void {
    this.showDigitalDetoxOnly = !this.showDigitalDetoxOnly;
    this.filterDigitalDetoxSubject.next(this.showDigitalDetoxOnly);
  }

  toggleIndividualSessionsFilter(): void {
    this.showWithIndividualSessions = !this.showWithIndividualSessions;
    this.filterIndividualSessionsSubject.next(this.showWithIndividualSessions);
  }

  refreshEvents(): void {
    // Filtreleri sıfırlayıp tüm etkinlikleri yeniden yükleyebiliriz
    this.selectedCategory = null;
    this.selectedTargetAudience = null;
    this.selectedTherapeuticMethod = null;
    this.showOnlyUpcoming = true;
    this.showOnlyAvailable = true;
    this.showOnlyCertified = false;
    this.showDigitalDetoxOnly = false;
    this.showWithIndividualSessions = false;

    this.filterCategorySubject.next(null);
    this.filterTargetAudienceSubject.next(null);
    this.filterTherapeuticMethodSubject.next(null);
    this.filterUpcomingSubject.next(true);
    this.filterAvailableSubject.next(true);
    this.filterCertifiedSubject.next(false);
    this.filterDigitalDetoxSubject.next(false);
    this.filterIndividualSessionsSubject.next(false);

    this.eventService.getAllEvents().pipe(takeUntil(this.destroy$)).subscribe({
      error: (error) => {
        this.handleError(error);
      }
    });
  }

  viewEventDetails(eventId: number): void {
    this.router.navigate(['/events', eventId]);
  }

  /**
   * Display helper methods (already existing, ensuring they use event parameter)
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

  hasSpecialFeatures(event: EventModel): boolean {
    return event.allowsObserverMode ||
      event.includesDigitalDetox ||
      event.individualSessionIncluded ||
      (event.accommodationOptions && event.accommodationOptions.length > 0) ||
      event.participationStyle === ParticipationStyle.SELF_PACED;
  }

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
    if (!event || event.capacity === 0) return 0; // Sıfır bölme hatasını önle
    return (event.registeredCount / event.capacity) * 100;
  }

  isFull(event: EventModel): boolean {
    return this.getAvailableSpots(event) === 0;
  }

  private handleError(error: any): void {
    console.error('Event loading error:', error);
    this.error = error.message || 'Etkinlikler yüklenirken bir hata oluştu.';
    // this.events = []; // Artık events$ Observable'ı yönettiği için bu satıra gerek yok
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
    this.filterByCategory(value === '' ? null : value as EventCategory);
  }

  handleTargetAudienceChange(value: string): void {
    this.filterByTargetAudience(value === '' ? null : value as TargetAudience);
  }

  handleTherapeuticMethodChange(value: string): void {
    this.filterByTherapeuticMethod(value === '' ? null : value as TherapeuticMethod);
  }

  getKeyFeatures(event: EventModel): string[] {
    const features: string[] = [];

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

    return features.slice(0, 3);
  }
}
