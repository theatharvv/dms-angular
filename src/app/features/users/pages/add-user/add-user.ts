import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../../../core/services/user.service';
import { Router } from '@angular/router';
import { UserRole, UserStatus } from '../../../../core/models/enums';
import { User } from '../../../../core/models/user.model';
import { AuthService } from '../../../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-user',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './add-user.html',
  styleUrl: './add-user.css',
})
export class AddUserComponent implements OnInit {
  UserRole = UserRole;
  UserStatus = UserStatus;
  isSuperAdmin = false;
  currentUser: User | null = null;
  userForm!: FormGroup;
  private prefilledRole: UserRole | '' = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private userService: UserService,
    private router: Router,
  ) {
    const navigation = this.router.getCurrentNavigation();
    this.prefilledRole = navigation?.extras?.state?.['active'] ?? '';
  }

  ngOnInit() {
    this.currentUser = this.auth.getCurrentUser();
    this.isSuperAdmin = !!this.currentUser && this.currentUser.role === UserRole.SUPER_ADMIN;

    this.userForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      role: [{ value: this.prefilledRole, disabled: !this.isSuperAdmin }, [Validators.required]],
      status: [UserStatus.ACTIVE, [Validators.required]],
    });
  }

  /** Shorthand to access form controls */
  get f() {
    return this.userForm.controls;
  }

  isInvalid(field: string): boolean {
    const ctrl = this.f[field];
    return !!ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  goBack() {
    this.router.navigate(['/users']);
  }

  addUser() {
    // Mark everything touched so all errors surface on submit
    this.userForm.markAllAsTouched();

    if (this.userForm.invalid) return;

    // getRawValue() includes disabled controls (role when not superAdmin)
    const { name, email, role, status } = this.userForm.getRawValue();

    try {
      this.userService.addUser({
        id: crypto.randomUUID(),
        name,
        email,
        password: 'default',
        role: role as UserRole,
        status: status as UserStatus,
        createdAt: new Date().toISOString(),
      });

      this.router.navigate(['/users']);
      alert('New user added successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add user.';
      alert(message);
    }
  }
}
