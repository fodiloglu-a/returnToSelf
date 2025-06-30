// src/app/components/not-found/not-found.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule],
  template: `
    <div class="not-found-container">
      <div class="not-found-content">
        <mat-icon class="not-found-icon">error_outline</mat-icon>
        <h1>404</h1>
        <h2>Sayfa Bulunamadı</h2>
        <p>Aradığınız sayfa mevcut değil veya taşınmış olabilir.</p>
        <button mat-raised-button color="primary" routerLink="/home">
          <mat-icon>home</mat-icon>
          Ana Sayfaya Dön
        </button>
      </div>
    </div>
  `,
  styles: [`
    .not-found-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 60vh;
      padding: 2rem;
    }

    .not-found-content {
      text-align: center;
      max-width: 400px;
    }

    .not-found-icon {
      font-size: 4rem;
      height: 4rem;
      width: 4rem;
      color: #ff6b6b;
      margin-bottom: 1rem;
    }

    h1 {
      font-size: 6rem;
      font-weight: bold;
      color: #333;
      margin: 0;
      line-height: 1;
    }

    h2 {
      font-size: 1.5rem;
      color: #666;
      margin: 1rem 0;
    }

    p {
      color: #888;
      margin-bottom: 2rem;
      line-height: 1.5;
    }

    button {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
  `]
})
export class NotFoundComponent { }
