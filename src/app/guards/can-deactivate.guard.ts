// src/app/guards/can-deactivate.guard.ts
import { CanDeactivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';

// Component'lerin implement edebileceği interface
export interface CanComponentDeactivate {
  canDeactivate(): Observable<boolean> | Promise<boolean> | boolean;
}

export const canDeactivateGuard: CanDeactivateFn<CanComponentDeactivate> = (component) => {
  return component.canDeactivate ? component.canDeactivate() : true;
};

// Confirmation Dialog Component
import { Component } from '@angular/core';
import { MaterialModule } from '../shared/material.module';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [MaterialModule],
  template: `
    <h2 mat-dialog-title>Sayfadan Ayrılıyor musunuz?</h2>
    <mat-dialog-content>
      <p>Kaydedilmemiş değişiklikleriniz kaybolacak. Emin misiniz?</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close="false">Kalın</button>
      <button mat-raised-button color="warn" mat-dialog-close="true">Ayrıl</button>
    </mat-dialog-actions>
  `
})
export class ConfirmationDialogComponent {}
