import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './privacy-policy.component.html',
  styleUrls: ['./privacy-policy.component.css']
})
export class PrivacyPolicyComponent {

  constructor(private router: Router, private translateService: TranslateService) {}

  goBack(): void {
    // Kullanıcıyı bir önceki sayfaya veya ana sayfaya yönlendir
    // Eğer tarayıcı geçmişinde bir önceki sayfa varsa oraya git
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Yoksa ana sayfaya git
      this.router.navigate(['/home']);
    }
  }
}
