import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Observable, Subject, takeUntil } from 'rxjs';
import { User } from '../../models/user.model';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit, OnDestroy {
  currentUser$: Observable<User | null>;
  currentUser: User | null = null;

  profileForm: FormGroup;
  passwordForm: FormGroup;

  // UI States
  isEditingProfile = false;
  isChangingPassword = false;
  profileSubmitting = false;
  passwordSubmitting = false;
  isDeletingAccount = false;

  // Password visibility
  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;

  // Statistics
  userStats = {
    blogCount: 0,
    commentCount: 0,
    likesReceived: 0,
    joinDaysAgo: 0
  };

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.currentUser$;
    console.log(this.currentUser$);
    // Profile Form
    this.profileForm = this.formBuilder.group({
      username: [{ value: '', disabled: true }],
      email: [{ value: '', disabled: true }],
      firstName: ['', [Validators.maxLength(50)]],
      lastName: ['', [Validators.maxLength(50)]],
      bio: ['', [Validators.maxLength(500)]]
    });

    // Password Form
    this.passwordForm = this.formBuilder.group({
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.loadUserData();
    this.loadUserStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUserData(): void {
    this.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user) {
          this.currentUser = user;
          this.populateProfileForm(user);
          this.calculateJoinDays(user.createdAt);
        } else {
          this.router.navigate(['/login']);
        }
      });
  }

  private loadUserStats(): void {
    // Bu normalde backend'den gelecek
    // Şimdilik mock data
    this.userStats = {
      blogCount: 12,
      commentCount: 45,
      likesReceived: 78,
      joinDaysAgo: 0
    };
  }

  private calculateJoinDays(joinDate: Date | string | undefined): void {
    if (joinDate) {
      const join = new Date(joinDate);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - join.getTime());
      this.userStats.joinDaysAgo = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
  }

  populateProfileForm(user: User): void {
    this.profileForm.patchValue({
      username: user.username,
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      bio: (user as any).bio || ''
    });
  }

  // Profile Management
  startEditingProfile(): void {
    this.isEditingProfile = true;
    this.profileForm.get('firstName')?.enable();
    this.profileForm.get('lastName')?.enable();
    this.profileForm.get('bio')?.enable();
  }

  cancelEditingProfile(): void {
    this.isEditingProfile = false;
    this.profileForm.get('firstName')?.disable();
    this.profileForm.get('lastName')?.disable();
    this.profileForm.get('bio')?.disable();

    if (this.currentUser) {
      this.populateProfileForm(this.currentUser);
    }
  }

  updateProfile(): void {
    if (this.profileForm.valid) {
      this.profileSubmitting = true;

      // Simulate API call
      setTimeout(() => {
        const updatedUser = {
          ...this.currentUser!,
          firstName: this.profileForm.value.firstName,
          lastName: this.profileForm.value.lastName,
          bio: this.profileForm.value.bio
        };

        localStorage.setItem('current_user', JSON.stringify(updatedUser));
        this.authService['currentUserSubject'].next(updatedUser);

        this.currentUser = updatedUser;
        this.profileSubmitting = false;
        this.isEditingProfile = false;

        this.profileForm.get('firstName')?.disable();
        this.profileForm.get('lastName')?.disable();
        this.profileForm.get('bio')?.disable();

        this.showNotification('Profil bilgileriniz güncellendi!', 'success');
      }, 1000);
    } else {
      this.markFormGroupTouched(this.profileForm);
    }
  }

  // Password Management
  startChangingPassword(): void {
    this.isChangingPassword = true;
    this.passwordForm.reset();
  }

  cancelChangingPassword(): void {
    this.isChangingPassword = false;
    this.passwordForm.reset();
  }

  changePassword(): void {
    if (this.passwordForm.valid) {
      this.passwordSubmitting = true;

      // Simulate API call
      setTimeout(() => {
        this.passwordSubmitting = false;
        this.isChangingPassword = false;
        this.passwordForm.reset();

        this.showNotification('Şifreniz başarıyla değiştirildi!', 'success');
      }, 1500);
    } else {
      this.markFormGroupTouched(this.passwordForm);
    }
  }

  // Account Management
  deleteAccount(): void {
    const confirmation = confirm(
      '⚠️ DİKKAT: Hesabınızı silmek istediğinizden emin misiniz?\n\n' +
      'Bu işlem:\n' +
      '• Tüm blog yazılarınızı silecek\n' +
      '• Tüm yorumlarınızı silecek\n' +
      '• Profil bilgilerinizi kalıcı olarak silecek\n' +
      '• GERİ ALINAMAZ!\n\n' +
      'Devam etmek için "Tamam"a basın.'
    );

    if (confirmation) {
      const finalConfirmation = prompt(
        'Hesabınızı silmek için "HESABI SIL" yazın:'
      );

      if (finalConfirmation === 'HESABI SIL') {
        this.isDeletingAccount = true;

        // Simulate API call
        setTimeout(() => {
          this.authService.logout();
          this.showNotification('Hesabınız silindi.', 'success');
        }, 2000);
      } else if (finalConfirmation !== null) {
        this.showNotification('Yanlış metin girdiniz. İşlem iptal edildi.', 'error');
      }
    }
  }

  logout(): void {
    const confirmation = confirm('Çıkış yapmak istediğinizden emin misiniz?');
    if (confirmation) {
      this.authService.logout();
    }
  }

  // Utility Methods
  togglePasswordVisibility(field: 'current' | 'new' | 'confirm'): void {
    switch (field) {
      case 'current':
        this.hideCurrentPassword = !this.hideCurrentPassword;
        break;
      case 'new':
        this.hideNewPassword = !this.hideNewPassword;
        break;
      case 'confirm':
        this.hideConfirmPassword = !this.hideConfirmPassword;
        break;
    }
  }

  // Validators
  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');

    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    return null;
  }

  // Form Helpers
  private markFormGroupTouched(form: FormGroup): void {
    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  getFieldError(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName);

    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldDisplayName(fieldName)} zorunludur`;
      }
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return `En az ${requiredLength} karakter olmalıdır`;
      }
      if (field.errors['maxlength']) {
        const requiredLength = field.errors['maxlength'].requiredLength;
        return `En fazla ${requiredLength} karakter olabilir`;
      }
      if (field.errors['mismatch']) {
        return 'Şifreler eşleşmiyor';
      }
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const fieldNames: { [key: string]: string } = {
      'firstName': 'Ad',
      'lastName': 'Soyad',
      'bio': 'Biyografi',
      'currentPassword': 'Mevcut şifre',
      'newPassword': 'Yeni şifre',
      'confirmPassword': 'Şifre tekrarı'
    };
    return fieldNames[fieldName] || fieldName;
  }

  hasFieldError(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return !!(field?.errors && field.touched);
  }

  // Display Helpers
  formatRole(role: string | undefined): string {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'Yönetici';
      case 'user':
        return 'Kullanıcı';
      case 'moderator':
        return 'Moderatör';
      default:
        return 'Kullanıcı';
    }
  }

  formatJoinDate(date: Date | string | undefined): string {
    if (!date) return 'Bilinmiyor';

    const joinDate = new Date(date);
    return joinDate.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getFullName(): string {
    const firstName = this.currentUser?.firstName || '';
    const lastName = this.currentUser?.lastName || '';
    return `${firstName} ${lastName}`.trim() || this.currentUser?.username || 'Kullanıcı';
  }

  getUserInitials(): string {
    const firstName = this.currentUser?.firstName || '';
    const lastName = this.currentUser?.lastName || '';
    const username = this.currentUser?.username || '';

    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    } else if (username) {
      return username.substring(0, 2).toUpperCase();
    }
    return 'U';
  }

  getRoleColor(): string {
    switch (this.currentUser?.role?.toLowerCase()) {
      case 'admin':
        return '#dc3545';
      case 'moderator':
        return '#fd7e14';
      case 'user':
      default:
        return '#0d6efd';
    }
  }

  // Notifications
  private showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    // Simple notification implementation
    // You can replace this with a more sophisticated notification system
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 20px',
      borderRadius: '8px',
      color: 'white',
      fontWeight: '500',
      zIndex: '9999',
      maxWidth: '300px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      background: type === 'success' ? '#10b981' :
        type === 'error' ? '#ef4444' : '#3b82f6'
    });

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 4000);
  }

  // Navigation
  navigateToBlogs(): void {
    this.router.navigate(['/blogs']);
  }

  navigateToHome(): void {
    this.router.navigate(['/home']);
  }

  navigateToMyBlogs(): void {
    this.router.navigate(['/my-blogs']);
  }
}
