// src/app/components/home/event-info/event-info.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; // DatePipe eklendi
import {Subject, takeUntil, Observable, combineLatest, map, BehaviorSubject} from 'rxjs';
import {
  EventCategory,
  EventLevel,
  EventModel,
  TargetAudience,
  GenderType,
  TherapeuticMethod,
  ParticipationStyle,
  TargetProblem,
  ExpectedOutcome,
  AccommodationType, // Eklenen enum'lar
  SpecialPackage,
  EthicalStandard
} from '../../../models/event.model';
import { EventService } from '../../../services/event.service';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core'; // TranslateService eklendi
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // MatSnackBar ve MatSnackBarModule eklendi

@Component({
  selector: 'app-event-info',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
     // DatePipe import edildi
    MatSnackBarModule // MatSnackBarModule eklendi (eğer snackBar kullanılacaksa)
  ],
  templateUrl: './event-info.component.html',
  styleUrl: './event-info.component.css'
})
export class EventInfoComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  events$: Observable<EventModel[]>; // Filtrelenmiş events Observable'ı
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
    private router: Router,
    public translateService: TranslateService, // HTML'den erişim için public yapıldı
    private datePipe: DatePipe, // DatePipe enjekte edildi
    private snackBar: MatSnackBar // MatSnackBar enjekte edildi
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
      this.filterIndividualSessionsSubject,
      this.translateService.onLangChange // Dil değişimi olayına abone ol, filtrelemeyi tetikle
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
      }),
      takeUntil(this.destroy$) // Aboneliği sonlandırmak için eklendi
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
   * İlgili blog yazısına git
   */
  goToRelatedBlog(event: EventModel): void {
    if (event.blogId) {
      this.router.navigate(['/blogs', event.blogId]);
    } else {
      console.warn('Bu etkinlikle ilişkili blog ID bulunamadı.');
      this.snackBar.open(this.translateService.instant('COMMON.NO_RELATED_BLOG_WARNING'), this.translateService.instant('COMMON.CLOSE_BUTTON'), {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
    }
  }

  /**
   * Filtre metotları artık BehaviorSubjects'i güncelliyor
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
   * Görüntüleme yardımcı metotları (TranslateService kullanıldı)
   */
  getTargetAudienceText(audience: TargetAudience): string {
    return this.translateService.instant('TARGET_AUDIENCE.' + audience.toUpperCase());
  }

  getTherapeuticMethodText(method: TherapeuticMethod): string {
    return this.translateService.instant('THERAPEUTIC_METHOD.' + method.toUpperCase());
  }

  getParticipationStyleText(style: ParticipationStyle): string {
    return this.translateService.instant('PARTICIPATION_STYLE.' + style.toUpperCase());
  }

  getTargetProblemText(problem: TargetProblem): string {
    return this.translateService.instant('TARGET_PROBLEM.' + problem.toUpperCase());
  }

  getExpectedOutcomeText(outcome: ExpectedOutcome): string {
    return this.translateService.instant('EXPECTED_OUTCOME.' + outcome.toUpperCase());
  }

  getAgeRangeText(event: EventModel): string {
    if (event.minAge && event.maxAge) {
      return `${event.minAge}-${event.maxAge} ${this.translateService.instant('COMMON.AGE')}`;
    } else if (event.minAge) {
      return `${event.minAge}+ ${this.translateService.instant('COMMON.AGE')}`;
    } else if (event.maxAge) {
      return `${this.translateService.instant('COMMON.AGE_UNDER_PREFIX')} ${event.maxAge} ${this.translateService.instant('COMMON.AGE_UNDER_SUFFIX')}`;
    }
    return this.translateService.instant('COMMON.ALL_AGES');
  }

  getGenderSpecificText(gender?: GenderType): string {
    if (!gender || gender === GenderType.ALL_GENDERS) {
      return '';
    }
    return this.translateService.instant('GENDER_TYPE.' + gender.toUpperCase());
  }

  hasSpecialFeatures(event: EventModel): boolean {
    return event.allowsObserverMode ||
      event.includesDigitalDetox ||
      event.individualSessionIncluded ||
      (event.accommodationOptions && event.accommodationOptions.length > 0) ||
      event.participationStyle === ParticipationStyle.SELF_PACED;
  }

  getCategoryText(category: EventCategory): string {
    return this.translateService.instant('EVENT_CATEGORY.' + category.toUpperCase());
  }

  getLevelText(level: EventLevel): string {
    return this.translateService.instant('EVENT_LEVEL.' + level.toUpperCase());
  }

  formatDate(date: Date | string): string {
    const eventDate = typeof date === 'string' ? new Date(date) : date;
    // DatePipe kullanarak biçimlendir, Ukraynaca (uk) locale kullan
    return this.datePipe.transform(eventDate, 'longDate', undefined, 'uk') || '';
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
    return event.price === 0 ? this.translateService.instant('EVENT_CARDS.PRICING.FREE') : `₺${event.price}`;
  }

  getCapacityPercentage(event: EventModel): number {
    if (!event || event.capacity === 0) return 0; // Sıfır bölme hatasını önle
    return (event.registeredCount / event.capacity) * 100;
  }

  isFull(event: EventModel): boolean {
    return this.getAvailableSpots(event) === 0;
  }

  private handleError(error: any): void {
    console.error('Etkinlik yükleme hatası:', error);
    const errorMessage = error.message || this.translateService.instant('COMMON.EVENT_LOAD_ERROR');
    this.error = errorMessage; // error değişkenini de güncelle
    this.snackBar.open(errorMessage, this.translateService.instant('COMMON.CLOSE_BUTTON'), {
      duration: 3000,
      panelClass: ['error-snackbar']
    });
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

  // getKeyFeatures metodunun tanımı buraya eklendi
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
}
