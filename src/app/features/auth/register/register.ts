import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
} from '@angular/forms';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class RegisterComponent {
  registerForm: FormGroup;
  error = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
  ) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  // Controls
  get name(): AbstractControl | null {
    return this.registerForm.get('name');
  }

  get email(): AbstractControl | null {
    return this.registerForm.get('email');
  }

  get password(): AbstractControl | null {
    return this.registerForm.get('password');
  }

  // Password Strength
  get strengthPercent(): string {
    const value = this.password?.value || '';
    const len = value.length;

    if (len === 0) return '0%';
    if (len < 6) return '25%';
    if (len < 9) return '50%';
    if (len < 12) return '75%';
    return '100%';
  }

  get strengthClass(): string {
    const value = this.password?.value || '';
    const len = value.length;

    if (len === 0) return '';
    if (len < 6) return 'weak';
    if (len < 9) return 'fair';
    if (len < 12) return 'good';
    return 'strong';
  }

  get strengthLabel(): string {
    const value = this.password?.value || '';
    const len = value.length;

    if (len === 0) return '';
    if (len < 6) return 'Weak';
    if (len < 9) return 'Fair';
    if (len < 12) return 'Good';
    return 'Strong';
  }

  onRegister(): void {
    this.error = '';

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const { name, email, password } = this.registerForm.value;

    const result = this.auth.register(name, email, password);

    if (!result.success) {
      this.error = result.message ?? 'Registration failed';

      if (result.message === 'Email already registered') {
        this.email?.setErrors({ alreadyExists: true });
        this.email?.markAsTouched();
      }

      return;
    }

    this.registerForm.reset();
    this.router.navigate(['/']);
  }

  onCancel(): void {
    this.registerForm.reset();
    this.error = '';
  }
}
