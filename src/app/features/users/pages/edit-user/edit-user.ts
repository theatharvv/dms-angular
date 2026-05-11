import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../../../core/services/user.service';
import { UserRole, UserStatus } from '../../../../core/models/enums';
import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../core/models/user.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-edit-user',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './edit-user.html',
  styleUrl: './edit-user.css',
})
export class EditUserComponent implements OnInit {
  UserRole = UserRole;
  UserStatus = UserStatus;

  editUserForm!: FormGroup;

  currentUser: User | null = null;
  isSuperAdmin = false;
  isAdmin = false;

  private userId = '';
  private existingPassword = '';
  private existingCreatedAt = '';

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();

    if (this.currentUser?.role === UserRole.SUPER_ADMIN) {
      this.isSuperAdmin = true;
    } else if (this.currentUser?.role === UserRole.ADMIN) {
      this.isAdmin = true;
    }

    // Build form — email and role disabled state set after user is loaded
    this.editUserForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: [{ value: '', disabled: true }],  // always disabled
      role: ['', Validators.required],
      status: ['', Validators.required],
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.goBack();
      return;
    }

    const user = this.userService.getUsers().find((u) => u.id === id);
    if (!user) {
      this.goBack();
      return;
    }

    if (this.isAdmin && user.role !== UserRole.SUPPLIER) {
      this.goBack();
      return;
    }

    this.userId = user.id;
    this.existingPassword = user.password;
    this.existingCreatedAt = user.createdAt;

    // Patch values into form
    this.editUserForm.patchValue({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    });

    // Lock role for admins after patching
    if (this.isAdmin) {
      this.editUserForm.get('role')?.disable();
    }
  }


  isFieldInvalid(field: string): boolean {
    const control = this.editUserForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  goBack(): void {
    this.router.navigate(['/users']);
  }

  updateUser(): void {

    this.editUserForm.markAllAsTouched();

    if (this.editUserForm.invalid) return;

    const { name, email, role, status } = this.editUserForm.getRawValue();

    // Admins cannot change the role 
    const resolvedRole: UserRole = this.isAdmin ? UserRole.SUPPLIER : role;

    this.userService.updateUser({
      id: this.userId,
      name,
      email,
      password: this.existingPassword,
      role: resolvedRole,
      status: status as UserStatus,
      createdAt: this.existingCreatedAt,
    });

    this.router.navigate(['/users']);
    alert('User updated successfully.');
  }
}