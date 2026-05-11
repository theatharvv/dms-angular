import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../core/models/enums';
import { User } from '../models/user.model';

export interface NavUser {
  name: string;
  role: string;
}

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class HeaderComponent implements OnInit, OnDestroy {
  currentUser: NavUser | null = null;
  dropdownOpen = false;
  UserRole = UserRole;
  avatarText: String = '';

  private authSub!: Subscription;

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.authSub = this.auth.currentUser$.subscribe((user: User | null) => {
      if (user) {
        this.currentUser = {
          name: user.name ?? user.email ?? 'User',
          role: user.role ?? UserRole.SUPPLIER,
        };
        this.avatarText = this.getInitials(this.currentUser.name);
      } else {
        this.currentUser = null;
        this.avatarText = '';
      }
    });
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
  }

  private getInitials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('');
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  onProfile(): void {
    this.dropdownOpen = false;
    this.router.navigate(['/users']);
  }

  onLogout(): void {
    this.dropdownOpen = false;
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
