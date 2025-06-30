import { Component } from '@angular/core';
import {Router, RouterLink, RouterLinkActive} from '@angular/router';
import {NgIf} from '@angular/common';
import {AuthService} from '../../../services/auth.service';
import {TranslatePipe} from '@ngx-translate/core';
import {LanguageSelectorComponent} from '../../language-selector/language-selector.component';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    NgIf,
    TranslatePipe,
    LanguageSelectorComponent

  ],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.css'
})
export class NavComponent {
  isMenuOpen = false;
  isLoggedIn = false;

  constructor(private authService: AuthService,private router: Router) {
    this.isLoggedIn = this.authService.isAuthenticated();
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }

  logOut() {
    this.isLoggedIn = false;
    this.authService.logout();
  }
}
