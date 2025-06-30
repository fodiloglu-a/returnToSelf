// src/app/shared/loading/loading.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../material.module';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  template: `
    <div class="loading-overlay" *ngIf="loadingService.loading$ | async">
      <div class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p class="loading-text">Yükleniyor...</p>
      </div>
    </div>
  `,
  styles: [`
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: white;
      padding: 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .loading-text {
      margin-top: 16px;
      margin-bottom: 0;
      color: #666;
      font-size: 14px;
    }
  `]
})
export class LoadingComponent {
  constructor(public loadingService: LoadingService) {}
}
