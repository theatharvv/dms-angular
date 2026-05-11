import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../../core/services/auth.service';
import { FileData } from '../../../../core/models/file.model';
import { UserRole, FileStatus } from '../../../../core/models/enums';
import { FileService } from '../../../../core/services/file.service';
import { User } from '../../../../core/models/user.model';

import { FilterBarComponent } from '../../../../shared/components/filter-bar/filter-bar';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination';
import { FilterValues } from '../../../../shared/models/filter.model';

interface PendingStatusChange {
  file: FileData;
  newStatus: FileStatus;
  originalStatus: FileStatus;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, FilterBarComponent, PaginationComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // Core data
  files: FileData[] = [];
  filteredFiles: FileData[] = [];
  currentUser: User | any;
  UserRole = UserRole;
  FileStatus = FileStatus;

  // Role helpers
  isSupplier = false;
  currentUserId = '';

  // Supplier name map
  supplierNameMap: Record<string, string> = {};

  // Sort
  sortField: 'date' | 'time' | '' = '';
  sortAsc = true;

  // Pagination state
  readonly PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100];
  pageSize = 10;
  currentPage = 1;

  // Delete confirm modal
  fileToDelete: FileData | null = null;

  // Pending status changes
  pendingChanges: Map<string, PendingStatusChange> = new Map();

  // Current filters — parent owns this
  currentFilters: FilterValues = {
    search1: '',
    search2: '',
    date: '',
    time: '',
    status: '',
  };

  readonly ALLOWED_FILE_TYPES = [
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];

  constructor(
    private auth: AuthService,
    private fileService: FileService,
  ) {}

  ngOnInit(): void {
    this.currentUser = this.auth.getCurrentUser();
    this.isSupplier = this.currentUser?.role === UserRole.SUPPLIER;
    this.currentUserId = this.currentUser?.id ?? '';
    this.loadFiles();
  }

  // ── Load ──
  loadFiles(): void {
    const all = this.fileService.getFiles();
    this.files = this.isSupplier ? all.filter((f) => f.uploadedBy === this.currentUserId) : all;

    if (!this.isSupplier) {
      this._buildSupplierNameMap(this.files);
    }

    this.pendingChanges.clear();
    this._applyFilters();
  }

  private _buildSupplierNameMap(files: FileData[]): void {
    const users: any[] = JSON.parse(localStorage.getItem('users') || '[]');
    const userMap = new Map<string, string>(users.map((u: User) => [u.id, u.name]));

    this.supplierNameMap = {};

    for (const file of files) {
      if (this.supplierNameMap[file.uploadedBy] !== undefined) continue;
      const liveUserName = userMap.get(file.uploadedBy);
      this.supplierNameMap[file.uploadedBy] = liveUserName
        ? liveUserName
        : `${file.owner} (Deleted User)`;
    }
  }

  getSupplierName(userId: string): string {
    return this.supplierNameMap[userId] ?? 'Unknown';
  }

  // ── Filter events from FilterBarComponent ──
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

  private _applyFilters(): void {
    let result = [...this.files];

    // search1 → supplier name
    if (!this.isSupplier && this.currentFilters.search1) {
      result = result.filter((f) =>
        this.getSupplierName(f.uploadedBy)
          .toLowerCase()
          .includes(this.currentFilters.search1.toLowerCase()),
      );
    }

    // search2 → file name
    if (this.currentFilters.search2) {
      result = result.filter((f) =>
        f.fileName.toLowerCase().includes(this.currentFilters.search2.toLowerCase()),
      );
    }

    if (this.currentFilters.date) {
      result = result.filter((f) => f.createdAt.startsWith(this.currentFilters.date));
    }

    if (this.currentFilters.time) {
      const [fh, fm] = this.currentFilters.time.split(':').map(Number);
      result = result.filter((f) => {
        const d = new Date(f.createdAt);
        return d.getHours() === fh && d.getMinutes() === fm;
      });
    }

    if (this.currentFilters.status) {
      result = result.filter((f) => f.status === this.currentFilters.status);
    }

    if (this.sortField) {
      result.sort((a, b) => {
        const dir = this.sortAsc ? 1 : -1;
        if (this.sortField === 'time') {
          const timeOf = (iso: string) => {
            const d = new Date(iso);
            return d.getHours() * 60 + d.getMinutes();
          };
          return (timeOf(a.createdAt) - timeOf(b.createdAt)) * dir;
        }
        return a.createdAt.localeCompare(b.createdAt) * dir;
      });
    }

    this.filteredFiles = result;

    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
  }

  // Sort
  sortBy(field: 'date' | 'time'): void {
    this.sortAsc = this.sortField === field ? !this.sortAsc : true; // Toggle Asc or Dsc if field is already selected
    this.sortField = field;
    this._applyFilters();
  }

  // ── Pagination ──
  get totalPages(): number {
    return Math.ceil(this.filteredFiles.length / this.pageSize) || 1;
  }

  get pagedFiles(): FileData[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredFiles.slice(start, start + this.pageSize);
  }

  onPageChanged(page: number): void {
    this.currentPage = page;
  }

  onPageSizeChanged(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this._applyFilters();
  }

  // ── Upload ──
  triggerUpload(): void {
    this.fileInput?.nativeElement.click();
  }

  async onFileSelected(event: any): Promise<void> {
    const file: File = event.target.files?.[0];
    if (!file) return;

    if (!this.ALLOWED_FILE_TYPES.includes(file.type)) {
      alert('Only PDF and Excel files are allowed.');
      this.fileInput.nativeElement.value = '';
      return;
    }

    await this.fileService.uploadFile(file, this.currentUser.id, this.currentUser.name);
    this.fileInput.nativeElement.value = '';
    this.loadFiles();
  }

  // Status change (admin) — staged
  onStatusChange(file: FileData, newStatus: FileStatus): void {
    if (newStatus === file.status) {
      this.pendingChanges.delete(file.id);
      return;
    }

    const existing = this.pendingChanges.get(file.id);
    this.pendingChanges.set(file.id, {
      file,
      newStatus,
      originalStatus: existing?.originalStatus ?? file.status,
    });
  }

  getStagedStatus(file: FileData): FileStatus {
    return this.pendingChanges.get(file.id)?.newStatus ?? file.status;
  }

  getAvailableStatuses(file: FileData): FileStatus[] {
    const committed = file.status;
    if (committed === FileStatus.PENDING) {
      return [FileStatus.PENDING, FileStatus.VERIFIED, FileStatus.REJECTED];
    }
    return [FileStatus.VERIFIED, FileStatus.REJECTED];
  }

  get pendingCount(): number {
    return this.pendingChanges.size;
  }

  confirmPendingChanges(): void {
    this.pendingChanges.forEach(({ file, newStatus }) => {
      this.fileService.updateStatus(file.id, newStatus);
    });
    this.loadFiles();
  }

  discardPendingChanges(): void {
    this.pendingChanges.clear();
    this._applyFilters();
  }

  // ── Delete ──
  onDelete(file: FileData): void {
    this.fileToDelete = file;
  }

  confirmDelete(): void {
    if (!this.fileToDelete) return;
    this.fileService.deleteFile(this.fileToDelete.id);
    this.fileToDelete = null;
    this.loadFiles();
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
  }

  cancelDelete(): void {
    this.fileToDelete = null;
  }

  // ── Download ──
  onDownload(file: FileData): void {
    if (!file.fileUrl) return;
    const a = document.createElement('a');
    a.href = file.fileUrl;
    a.download = file.fileName;
    a.click();
  }

  // ── Badge / select helpers ──
  badgeClass(status: string): string {
    if (status === FileStatus.VERIFIED) return 'badge badge-verified';
    if (status === FileStatus.REJECTED) return 'badge badge-rejected';
    return 'badge badge-pending';
  }

  statusSelectClass(status: string): string {
    if (status === FileStatus.VERIFIED) return 'status-verified';
    if (status === FileStatus.REJECTED) return 'status-rejected';
    return 'status-pending';
  }
}
