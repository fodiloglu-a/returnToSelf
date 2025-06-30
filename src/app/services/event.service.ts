// src/app/services/event.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { EventModel, EventCategory, EventLevel } from '../models/event.model';

export interface EventFilters {
  category?: EventCategory;
  level?: EventLevel;
  minPrice?: number;
  maxPrice?: number;
  startDate?: string;
  endDate?: string;
  location?: string;
  instructor?: string;
  page?: number;
  size?: number;
}

export interface EventStats {
  totalActiveEvents: number;
  upcomingEvents: number;
  pastEvents: number;
  freeEvents: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class EventService {
   private readonly API_URL = 'https://returntoyourself.onrender.com/api/events';
  // private readonly API_URL = 'http://localhost:8080/api/events';

  // State management for events
  private eventsSubject = new BehaviorSubject<EventModel[]>([]);
  public events$ = this.eventsSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  // =====================================
  // PUBLIC ENDPOINTS (No auth required)
  // =====================================

  /**
   * Get all active events
   */
  getAllEvents(): Observable<EventModel[]> {
    this.setLoading(true);
    return this.http.get<EventModel[]>(`${this.API_URL}/public/all`)
      .pipe(
        tap(events => {
          this.eventsSubject.next(events);
          this.setLoading(false);
        }),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Get events with pagination
   */
  getEventsPaginated(page: number = 0, size: number = 10, sortBy: string = 'date', sortDir: string = 'asc'): Observable<PageResponse<EventModel>> {
    this.setLoading(true);
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);

    return this.http.get<PageResponse<EventModel>>(`${this.API_URL}/public/paginated`, { params })
      .pipe(
        tap(() => this.setLoading(false)),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Get event by ID
   */
  getEventById(id: number): Observable<EventModel> {
    this.setLoading(true);
    return this.http.get<EventModel>(`${this.API_URL}/public/${id}`)
      .pipe(
        tap(() => this.setLoading(false)),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Get upcoming events
   */
  getUpcomingEvents(): Observable<EventModel[]> {
    this.setLoading(true);
    return this.http.get<EventModel[]>(`${this.API_URL}/public/upcoming`)
      .pipe(
        tap(() => this.setLoading(false)),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Get past events
   */
  getPastEvents(): Observable<EventModel[]> {
    this.setLoading(true);
    return this.http.get<EventModel[]>(`${this.API_URL}/public/past`)
      .pipe(
        tap(() => this.setLoading(false)),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Get events by category
   */
  getEventsByCategory(category: EventCategory): Observable<EventModel[]> {
    this.setLoading(true);
    return this.http.get<EventModel[]>(`${this.API_URL}/public/category/${category}`)
      .pipe(
        tap(() => this.setLoading(false)),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Get events by level
   */
  getEventsByLevel(level: EventLevel): Observable<EventModel[]> {
    this.setLoading(true);
    return this.http.get<EventModel[]>(`${this.API_URL}/public/level/${level}`)
      .pipe(
        tap(() => this.setLoading(false)),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Get free events
   */
  getFreeEvents(): Observable<EventModel[]> {
    this.setLoading(true);
    return this.http.get<EventModel[]>(`${this.API_URL}/public/free`)
      .pipe(
        tap(() => this.setLoading(false)),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Get popular events
   */
  getPopularEvents(limit: number = 10): Observable<EventModel[]> {
    this.setLoading(true);
    let params = new HttpParams().set('limit', limit.toString());

    return this.http.get<EventModel[]>(`${this.API_URL}/public/popular`, { params })
      .pipe(
        tap(() => this.setLoading(false)),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Get recent events
   */
  getRecentEvents(limit: number = 10): Observable<EventModel[]> {
    this.setLoading(true);
    let params = new HttpParams().set('limit', limit.toString());

    return this.http.get<EventModel[]>(`${this.API_URL}/public/recent`, { params })
      .pipe(
        tap(() => this.setLoading(false)),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Search events by keyword
   */
  searchEvents(keyword: string): Observable<EventModel[]> {
    if (!keyword || keyword.trim().length === 0) {
      return throwError(() => new Error('Search keyword is required'));
    }

    this.setLoading(true);
    let params = new HttpParams().set('keyword', keyword.trim());

    return this.http.get<EventModel[]>(`${this.API_URL}/public/search`, { params })
      .pipe(
        tap(events => {
          this.eventsSubject.next(events);
          this.setLoading(false);
        }),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Filter events with advanced criteria
   */
  filterEvents(filters: EventFilters): Observable<PageResponse<EventModel>> {
    this.setLoading(true);
    let params = new HttpParams();

    // Add filter parameters
    if (filters.category) params = params.set('category', filters.category);
    if (filters.level) params = params.set('level', filters.level);
    if (filters.minPrice !== undefined) params = params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice !== undefined) params = params.set('maxPrice', filters.maxPrice.toString());
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.location) params = params.set('location', filters.location);
    if (filters.instructor) params = params.set('instructor', filters.instructor);

    // Pagination parameters
    params = params.set('page', (filters.page || 0).toString());
    params = params.set('size', (filters.size || 10).toString());

    return this.http.get<PageResponse<EventModel>>(`${this.API_URL}/public/filter`, { params })
      .pipe(
        tap(() => this.setLoading(false)),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Get available categories
   */
  getCategories(): Observable<EventCategory[]> {
    return this.http.get<EventCategory[]>(`${this.API_URL}/public/categories`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Get available levels
   */
  getLevels(): Observable<EventLevel[]> {
    return this.http.get<EventLevel[]>(`${this.API_URL}/public/levels`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Get event statistics
   */
  getEventStats(): Observable<EventStats> {
    return this.http.get<EventStats>(`${this.API_URL}/public/stats`)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  // =====================================
  // PROTECTED ENDPOINTS (Auth required)
  // =====================================

  /**
   * Create new event
   */
  createEvent(event: Partial<EventModel>): Observable<EventModel> {
    this.setLoading(true);
    return this.http.post<EventModel>(`${this.API_URL}`, event)
      .pipe(
        tap(() => {
          this.setLoading(false);
          this.refreshEvents(); // Refresh event list
        }),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Get current user's events
   */
  getUserEvents(): Observable<EventModel[]> {
    this.setLoading(true);
    return this.http.get<EventModel[]>(`${this.API_URL}/my`)
      .pipe(
        tap(() => this.setLoading(false)),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Update event
   */
  updateEvent(id: number, event: Partial<EventModel>): Observable<EventModel> {
    this.setLoading(true);
    return this.http.put<EventModel>(`${this.API_URL}/${id}`, event)
      .pipe(
        tap(() => {
          this.setLoading(false);
          this.refreshEvents(); // Refresh event list
        }),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Toggle event status (active/inactive)
   */
  toggleEventStatus(id: number): Observable<EventModel> {
    this.setLoading(true);
    return this.http.put<EventModel>(`${this.API_URL}/${id}/toggle-status`, {})
      .pipe(
        tap(() => {
          this.setLoading(false);
          this.refreshEvents(); // Refresh event list
        }),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Delete event
   */
  deleteEvent(id: number): Observable<any> {
    this.setLoading(true);
    return this.http.delete(`${this.API_URL}/${id}`)
      .pipe(
        tap(() => {
          this.setLoading(false);
          this.refreshEvents(); // Refresh event list
        }),
        catchError(this.handleError.bind(this))
      );
  }

  // =====================================
  // UTILITY METHODS
  // =====================================

  /**
   * Refresh events list
   */
  refreshEvents(): void {
    this.getAllEvents().subscribe();
  }

  /**
   * Clear events cache
   */
  clearEventsCache(): void {
    this.eventsSubject.next([]);
  }

  /**
   * Set loading state
   */
  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  /**
   * Check if event is upcoming
   */
  isUpcoming(event: EventModel): boolean {
    const eventDate = new Date(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate >= today;
  }

  /**
   * Check if event is past
   */
  isPast(event: EventModel): boolean {
    return !this.isUpcoming(event);
  }

  /**
   * Check if event is free
   */
  isFree(event: EventModel): boolean {
    return event.price === 0;
  }

  /**
   * Check if event is full
   */
  isFull(event: EventModel): boolean {
    return event.registeredCount >= event.capacity;
  }

  /**
   * Get available spots
   */
  getAvailableSpots(event: EventModel): number {
    return Math.max(0, event.capacity - event.registeredCount);
  }

  /**
   * Format event date
   */
  formatEventDate(event: EventModel): string {
    return new Date(event.date).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Format event time
   */
  formatEventTime(event: EventModel): string {
    // time string'i "HH:MM" formatında geldiğini varsayıyoruz
    return event.time;
  }

  /**
   * Get event price display
   */
  getEventPriceDisplay(event: EventModel): string {
    return event.price === 0 ? 'Ücretsiz' : `${event.price} ₺`;
  }

  /**
   * Error handling
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    this.setLoading(false);

    let errorMessage = 'Bir hata oluştu';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Hata: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 400:
          errorMessage = error.error?.message || 'Geçersiz istek';
          break;
        case 401:
          errorMessage = 'Bu işlem için giriş yapmanız gerekiyor';
          break;
        case 403:
          errorMessage = 'Bu işlem için yetkiniz bulunmuyor';
          break;
        case 404:
          errorMessage = 'İstenen event bulunamadı';
          break;
        case 500:
          errorMessage = 'Sunucu hatası oluştu';
          break;
        default:
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else {
            errorMessage = `HTTP ${error.status}: ${error.statusText}`;
          }
      }
    }

    console.error('EventService Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
