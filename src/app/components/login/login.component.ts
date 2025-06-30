// src/app/components/login/login.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../shared/material.module';
import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../../models/auth.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import {MatDivider} from '@angular/material/divider';
import {MatCheckbox} from '@angular/material/checkbox';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MaterialModule, MatDivider, MatCheckbox, TranslatePipe],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  hidePassword = true;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // Eğer kullanıcı zaten giriş yapmışsa ana sayfaya yönlendir
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/home']);
    }
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;

      const loginRequest: LoginRequest = {
        username: this.loginForm.value.username,
        password: this.loginForm.value.password
      };

      this.authService.login(loginRequest).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.showSuccessMessage('Giriş başarılı! Hoş geldiniz.');
          // AuthService redirectAfterLogin() metodunu çağıracak
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Login error:', error);

          let errorMessage = 'Giriş yapılırken bir hata oluştu.';
          if (error.status === 400 || error.status === 401) {
            errorMessage = 'Kullanıcı adı veya şifre hatalı.';
          } else if (error.status === 0) {
            errorMessage = 'Sunucuya bağlanılamıyor. Lütfen daha sonra tekrar deneyin.';
          }

          this.showErrorMessage(errorMessage);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  // Form alanlarını dokunulmuş olarak işaretle
  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  // Başarı mesajı göster
  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Kapat', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  // Hata mesajı göster
  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Kapat', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  // Şifre görünürlüğünü değiştir
  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  // Form alanı hata mesajları
  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);

    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldDisplayName(fieldName)} zorunludur.`;
      }
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return `${this.getFieldDisplayName(fieldName)} en az ${requiredLength} karakter olmalıdır.`;
      }
    }

    return '';
  }

  // Alan adlarını Türkçe'ye çevir
  private getFieldDisplayName(fieldName: string): string {
    const fieldNames: { [key: string]: string } = {
      'username': 'Kullanıcı adı',
      'password': 'Şifre'
    };
    return fieldNames[fieldName] || fieldName;
  }

  // Alan hatası var mı kontrolü
  hasFieldError(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field?.errors && field.touched);
  }
}
