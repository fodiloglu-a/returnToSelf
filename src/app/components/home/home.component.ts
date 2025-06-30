// src/app/components/home/home.component.ts
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

import { Observable } from 'rxjs';
import { User } from '../../models/user.model';
import { HeroComponent } from './hero/hero.component';
import { EventFilterComponent } from './event-filter/event-filter.component';
import { EventInfoComponent } from './event-info/event-info.component';
import { BlogCardsComponent } from './blog-cards/blog-cards.component';
import { WebInfoComponent } from './web-info/web-info.component';

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    HeroComponent,
    EventFilterComponent,
    EventInfoComponent,
    BlogCardsComponent,
    WebInfoComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  currentUser$: Observable<User | null>;
  isAuthenticated$: Observable<boolean>;

  constructor(private authService: AuthService) {
    this.currentUser$ = this.authService.currentUser$;
    this.isAuthenticated$ = this.authService.isAuthenticated$;
  }

  ngOnInit(): void {
    // Component yüklendiğinde gerekli işlemler
    if (typeof window !== 'undefined') {
      performance.mark('home-component-loaded');
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
