import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-cookie-policy',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './cookie-policy.component.html',
  styleUrls: ['./cookie-policy.component.css']
})
export class CookiePolicyComponent {

  constructor(private router: Router, private translateService: TranslateService) {}

  goBack(): void {
    // Kullanıcıyı bir önceki sayfaya veya ana sayfaya yönlendir
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/home']);
    }
  }
}
