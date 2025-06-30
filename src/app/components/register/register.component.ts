// src/app/components/register/register.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MaterialModule } from '../../shared/material.module';
import { AuthService } from '../../services/auth.service';
import { RegisterRequest } from '../../models/auth.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import {MatDivider} from '@angular/material/divider';
import {MatCheckbox} from '@angular/material/checkbox';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MaterialModule, MatDivider, MatCheckbox, TranslatePipe],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  isLoading = false;
  hidePassword = true;
  hideConfirmPassword = true;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.registerForm = this.formBuilder.group({
      username: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(20),
        Validators.pattern(/^[a-zA-Z0-9_]+$/)
      ]],
      email: ['', [
        Validators.required,
        Validators.email
      ]],
      firstName: ['', [
        Validators.minLength(2),
        Validators.maxLength(50)
      ]],
      lastName: ['', [
        Validators.minLength(2),
        Validators.maxLength(50)
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(50),
        this.passwordStrengthValidator
      ]],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
    // Eğer kullanıcı zaten giriş yapmışsa ana sayfaya yönlendir
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/home']);
    }
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;

      const registerRequest: RegisterRequest = {
        username: this.registerForm.value.username,
        email: this.registerForm.value.email,
        password: this.registerForm.value.password,
        firstName: this.registerForm.value.firstName || undefined,
        lastName: this.registerForm.value.lastName || undefined
      };

      this.authService.register(registerRequest).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.showSuccessMessage('Kayıt başarılı! Hoş geldiniz.');
          this.router.navigate(['/home']);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Register error:', error);

          let errorMessage = 'Kayıt olurken bir hata oluştu.';

          if (error.error && typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.status === 400) {
            errorMessage = 'Girdiğiniz bilgileri kontrol edin.';
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

  // Şifre güçlülük validator'ı
  passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;

    if (!value) {
      return null;
    }

    const hasNumber = /[0-9]/.test(value);
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasSpecial = /[#?!@$%^&*-]/.test(value);

    const passwordValid = hasNumber && hasUpper && hasLower;

    return !passwordValid ? { weak: true } : null;
  }

  // Şifre eşleşme validator'ı
  passwordMatchValidator(form: AbstractControl): ValidationErrors | null {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
      return { mismatch: true };
    }

    return null;
  }

  // Form alanlarını dokunulmuş olarak işaretle
  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
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

  toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword = !this.hideConfirmPassword;
  }

  // Form alanı hata mesajları
  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);

    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldDisplayName(fieldName)} zorunludur.`;
      }
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return `${this.getFieldDisplayName(fieldName)} en az ${requiredLength} karakter olmalıdır.`;
      }
      if (field.errors['maxlength']) {
        const requiredLength = field.errors['maxlength'].requiredLength;
        return `${this.getFieldDisplayName(fieldName)} en fazla ${requiredLength} karakter olabilir.`;
      }
      if (field.errors['email']) {
        return 'Geçerli bir e-mail adresi girin.';
      }
      if (field.errors['pattern']) {
        return 'Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir.';
      }
      if (field.errors['weak']) {
        return 'Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir.';
      }
      if (field.errors['mismatch']) {
        return 'Şifreler eşleşmiyor.';
      }
      if (field.errors['required'] && fieldName === 'acceptTerms') {
        return 'Kullanım şartlarını kabul etmelisiniz.';
      }
    }

    return '';
  }

  // Alan adlarını Türkçe'ye çevir
  private getFieldDisplayName(fieldName: string): string {
    const fieldNames: { [key: string]: string } = {
      'username': 'Kullanıcı adı',
      'email': 'E-mail',
      'firstName': 'Ad',
      'lastName': 'Soyad',
      'password': 'Şifre',
      'confirmPassword': 'Şifre tekrarı'
    };
    return fieldNames[fieldName] || fieldName;
  }

  // Alan hatası var mı kontrolü
  hasFieldError(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field?.errors && field.touched);
  }

  // Şifre güçlülük durumu
  getPasswordStrength(): string {
    const password = this.registerForm.get('password')?.value || '';

    if (password.length === 0) return '';

    const hasNumber = /[0-9]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasSpecial = /[#?!@$%^&*-]/.test(password);

    const score = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

    if (password.length < 6) return 'weak';
    if (score < 3) return 'medium';
    return 'strong';
  }

  getPasswordStrengthText(): string {
    const strength = this.getPasswordStrength();
    const texts = {
      weak: 'Zayıf',
      medium: 'Orta',
      strong: 'Güçlü'
    };
    return texts[strength as keyof typeof texts] || '';
  }
}
