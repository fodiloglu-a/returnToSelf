// about.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {TranslatePipe} from '@ngx-translate/core';
import {NgIf} from '@angular/common';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css'],
  imports: [
    TranslatePipe,
    NgIf
  ],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({opacity: 0, transform: 'translateY(30px)'}),
        animate('600ms ease-out', style({opacity: 1, transform: 'translateY(0)'}))
      ])
    ]),
    trigger('staggerAnimation', [
      transition('* => *', [
        query(':enter', [
          style({opacity: 0, transform: 'translateY(30px)'}),
          stagger(100, [
            animate('600ms ease-out', style({opacity: 1, transform: 'translateY(0)'}))
          ])
        ], {optional: true})
      ])
    ])
  ]
})
export class AboutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Image loading state
  imageLoaded: boolean = true;

  // Social Media Links
  socialLinks = {
    instagram: 'https://instagram.com/yanapekun',
    telegram: 'https://t.me/yanapekun',
    youtube: 'https://youtube.com/@yanapekun'
  };

  // Contact Information
  contactEmail = 'yana.pekun@example.com'; // Gerçek email adresi eklenecek

  // User Info
  userInfo = {
    firstName: 'Yana',
    lastName: 'Pekun',
    title: 'Psikoloji & Kişisel Gelişim Uzmanı'
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private titleService: Title,
    private metaService: Meta,

  ) { }

  ngOnInit(): void {
    // SEO Meta tags setup
    this.setupSEO();

    // Component initialization logic
    this.loadUserData();

    // Setup route data listeners
    this.setupRouteDataListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Setup SEO meta tags
   */
  private setupSEO(): void {
    const routeData = this.route.snapshot.data;

    // Set page title
    if (routeData['title']) {
      this.titleService.setTitle(routeData['title']);
    }

    // Set meta description
    if (routeData['description']) {
      this.metaService.updateTag({ name: 'description', content: routeData['description'] });
    }

    // Set meta keywords
    if (routeData['keywords']) {
      this.metaService.updateTag({ name: 'keywords', content: routeData['keywords'] });
    }

    // Set Open Graph tags
    this.metaService.updateTag({ property: 'og:title', content: routeData['title'] || 'Hakkımda - Yana Pekun' });
    this.metaService.updateTag({ property: 'og:description', content: routeData['description'] || '' });
    this.metaService.updateTag({ property: 'og:type', content: 'profile' });
    this.metaService.updateTag({ property: 'og:url', content: window.location.href });

    // Set Twitter Card tags
    this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:title', content: routeData['title'] || 'Hakkımda - Yana Pekun' });
    this.metaService.updateTag({ name: 'twitter:description', content: routeData['description'] || '' });
  }

  /**
   * Setup route data listeners
   */
  private setupRouteDataListeners(): void {
    this.route.data
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        // Handle route data changes if needed
        console.log('Route data:', data);
      });
  }

  /**
   * Navigate to home page using navigation service
   */
  navigateToHome(): void {
    this.router.navigate(['/home']);
  }

  /**
   * Navigate to blogs page using navigation service
   */
  navigateToBlogs(): void {
    this.router.navigate(['/blogs']);
  }

  /**
   * Navigate to events page using navigation service
   */
  navigateToEvents(): void {
    this.router.navigate(['/events']);
  }

  /**
   * Navigate to contact page using navigation service
   */
  navigateToContact(): void {
    this.router.navigate(['/events']);
  }

  /**
   * Get user initials for avatar
   * @returns string
   */
  getInitials(): string {
    const firstInitial = this.userInfo.firstName?.charAt(0)?.toUpperCase() || '';
    const lastInitial = this.userInfo.lastName?.charAt(0)?.toUpperCase() || '';
    return `${firstInitial}${lastInitial}`;
  }

  /**
   * Handle image loading error
   * @param event - Error event
   */
  onImageError(event: any): void {
    console.log('Image failed to load, showing fallback avatar');
    this.imageLoaded = false;
    event.target.style.display = 'none';
  }

  /**
   * Load user data - can be from service
   */
  private loadUserData(): void {
    // Bu method ile kullanıcı verilerini service'den yükleyebilirsiniz
  }

  /**
   * Handle social link clicks with analytics
   * @param platform - Social media platform name
   * @param url - URL to navigate to
   */
  onSocialLinkClick(platform: string, url: string): void {
    // Analytics tracking can be added here
    console.log(`Clicked on ${platform} link`);

    // Open in new tab
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  /**
   * Handle contact button click
   */
  onContactClick(): void {
    // Analytics tracking
    console.log('Contact button clicked');

    // Could also open a contact modal instead of direct email
    // this.openContactModal();
  }

  /**
   * Track event interaction for analytics
   * @param eventType - Type of event interaction
   * @param eventName - Name of the event
   */
  trackEventInteraction(eventType: string, eventName: string): void {
    // Analytics tracking implementation
    console.log(`Event interaction: ${eventType} - ${eventName}`);

    // Example: Google Analytics or other tracking service
    // gtag('event', eventType, {
    //   event_category: 'About Page',
    //   event_label: eventName
    // });
  }

  /**
   * Handle scroll to section (if needed for navigation)
   * @param sectionId - ID of the section to scroll to
   */
  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      });
    }
  }

  /**
   * Check if user is on mobile device
   * @returns boolean
   */
  isMobileDevice(): boolean {
    return window.innerWidth <= 768;
  }

  /**
   * Handle window resize events
   */
  onWindowResize(): void {
    // Handle responsive behavior if needed
    if (this.isMobileDevice()) {
      // Mobile specific logic
    }
  }
}
