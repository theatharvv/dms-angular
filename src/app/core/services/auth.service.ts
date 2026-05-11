import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { StorageService } from './storage.service';
import { User } from '../models/user.model';
import { UserRole, UserStatus } from '../models/enums';

export interface AuthResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private USERS_KEY = 'users';
  private CURRENT_USER_KEY = 'currentUser';

  private currentUserSubject: BehaviorSubject<User | null>;
  readonly currentUser$: Observable<User | null>;

  constructor(private storage: StorageService) {
    this.currentUserSubject = new BehaviorSubject<User | null>(
      this.storage.get<User>(this.CURRENT_USER_KEY) ?? null,
    );

    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  // REGISTER
  register(name: string, email: string, password: string): AuthResponse {
    const users = this.storage.get<User[]>(this.USERS_KEY) || [];

    const normalizedEmail = email.trim().toLowerCase();

    const exists = users.find((u) => u.email.trim().toLowerCase() === normalizedEmail);

    if (exists) {
      return {
        success: false,
        message: 'Email already registered',
      };
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: UserRole.SUPPLIER,
      status: UserStatus.ACTIVE,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    this.storage.set(this.USERS_KEY, users);

    return {
      success: true,
      message: 'Registration successful',
    };
  }

  // LOGIN
  login(email: string, password: string): AuthResponse {
    const users = this.storage.get<User[]>(this.USERS_KEY) || [];

    const normalizedEmail = email.trim().toLowerCase();

    const user = users.find(
      (u) => u.email.trim().toLowerCase() === normalizedEmail && u.password === password,
    );

    if (!user) {
      return {
        success: false,
        message: 'Invalid email or password',
      };
    }

    if (user.status !== UserStatus.ACTIVE) {
      return {
        success: false,
        message: 'User account is not active',
      };
    }

    this.storage.set(this.CURRENT_USER_KEY, user);
    this.currentUserSubject.next(user);

    return {
      success: true,
      message: 'Login successful',
    };
  }

  // LOGOUT
  logout(): void {
    this.storage.remove(this.CURRENT_USER_KEY);
    this.currentUserSubject.next(null);
  }

  // CURRENT USER
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }
}
