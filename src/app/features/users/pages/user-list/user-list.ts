import { Component, OnInit } from '@angular/core';
import { CommonModule, TitleCasePipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { User } from '../../../../core/models/user.model';
import { UserStatus, UserRole } from '../../../../core/models/enums';
import { UserService } from '../../../../core/services/user.service';
import { FileService } from '../../../../core/services/file.service';
import { AuthService } from '../../../../core/services/auth.service';

import { FilterBarComponent } from '../../../../shared/components/filter-bar/filter-bar';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination';
import { FilterValues, StatusOption } from '../../../../shared/models/filter.model';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TitleCasePipe,
    DatePipe,
    FilterBarComponent,
    PaginationComponent,
  ],
  templateUrl: './user-list.html',
  styleUrl: './user-list.css',
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  currentUser: User | null = null;
  isSuperAdmin = false;
  UserStatus = UserStatus;

  activeTab: 'SUPPLIER' | 'ADMIN' = 'SUPPLIER';

  // Two-step delete state
  userToDelete: User | null = null;
  deleteStep: 'confirm-user' | 'confirm-files' = 'confirm-user';
  userHasFiles = false;

  // Parent owns filter state
  currentFilters: FilterValues = {
    search1: '',
    search2: '',
    date: '',
    time: '',
    status: '',
  };

  //  For Filter Bar: search1 → name, search2 → email
  userStatusOptions: StatusOption[] = [
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Inactive', value: 'INACTIVE' },
  ];

  sortField: 'date' | '' = '';
  sortAsc = true;

  readonly PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100];
  pageSize = 5;
  currentPage = 1;

  constructor(
    private userService: UserService,
    private fileService: FileService,
    private auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.currentUser = this.auth.getCurrentUser();
    this.isSuperAdmin = this.currentUser?.role === UserRole.SUPER_ADMIN;
    this.loadUsers();
  }

  loadUsers(): void {
    this.users = this.userService.getUsers();
    this._applyFilters();
  }

  goToAddUser(): void {
    this.router.navigate(['/users/add'], {
      state: { active: this.activeTab },
    });
  }

  goToEditUser(user: User): void {
    this.router.navigate(['/users', user.id, 'edit']);
  }

  setTab(tab: 'SUPPLIER' | 'ADMIN'): void {
    this.activeTab = tab;
    this.currentPage = 1;
    this._applyFilters();
  }

  // Filter events
  onFiltersChanged(filters: FilterValues): void {
    this.currentFilters = filters;
    this.currentPage = 1;
    this._applyFilters();
  }

  onFiltersCleared(): void {
    this.currentFilters = { search1: '', search2: '', date: '', time: '', status: '' };
    this.currentPage = 1;
    this._applyFilters();
  }

  sortBy(field: 'date'): void {
    this.sortAsc = this.sortField === field ? !this.sortAsc : true;
    this.sortField = field;
    this._applyFilters();
  }

  // Delete (two-step)
  onDelete(user: User): void {
    this.userToDelete = user;
    this.userHasFiles = this.fileService.getFilesByUser(user.id).length > 0;
    this.deleteStep = 'confirm-user';
  }

  confirmDeleteUser(): void {
    if (!this.userToDelete) return;
    if (this.userHasFiles) {
      this.deleteStep = 'confirm-files';
    } else {
      this._executeDelete(false);
    }
  }

  confirmDeleteFiles(deleteFiles: boolean): void {
    this._executeDelete(deleteFiles);
  }

  cancelDelete(): void {
    this.userToDelete = null;
    this.deleteStep = 'confirm-user';
    this.userHasFiles = false;
  }

  private _executeDelete(deleteFiles: boolean): void {
    if (!this.userToDelete) return;
    if (deleteFiles) {
      this.fileService.deleteFilesByUser(this.userToDelete.id);
    }
    this.userService.deleteUser(this.userToDelete.id);
    if (this.currentPage > this.totalPages) {
      this.currentPage = Math.max(1, this.totalPages);
    }
    this.cancelDelete();
    this.loadUsers();
  }

  private _applyFilters(): void {
    // search1 → name filter
    // search2 → email filter
    // date    → createdAt date
    // status  → user status
    // time    → unused
    let result = this.users.filter((u) => u.role === this.activeTab);

    if (this.currentFilters.search1) {
      result = result.filter((u) =>
        u.name.toLowerCase().includes(this.currentFilters.search1.toLowerCase()),
      );
    }

    if (this.currentFilters.search2) {
      result = result.filter((u) =>
        u.email.toLowerCase().includes(this.currentFilters.search2.toLowerCase()),
      );
    }

    if (this.currentFilters.date) {
      result = result.filter((u) => u.createdAt?.startsWith(this.currentFilters.date));
    }

    if (this.currentFilters.status) {
      result = result.filter((u) => u.status === this.currentFilters.status);
    }

    if (this.sortField === 'date') {
      result.sort((a, b) => {
        const dir = this.sortAsc ? 1 : -1;
        return (a.createdAt ?? '').localeCompare(b.createdAt ?? '') * dir;
      });
    }

    this.filteredUsers = result;
  }

  // Pagination
  get totalPages(): number {
    return Math.ceil(this.filteredUsers.length / this.pageSize) || 1;
  }

  get pagedUsers(): User[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredUsers.slice(start, start + this.pageSize);
  }

  get pageStart(): number {
    return this.filteredUsers.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get pageEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredUsers.length);
  }

  onPageChanged(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  onPageSizeChanged(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this._applyFilters();
  }
}
