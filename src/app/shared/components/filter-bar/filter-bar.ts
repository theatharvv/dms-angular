import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FilterValues, StatusOption } from '../../models/filter.model';

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-bar.html',
  styleUrl: './filter-bar.css',
})
export class FilterBarComponent implements OnInit, OnDestroy {
  @Input() filters: FilterValues = {
    search1: '',
    search2: '',
    date: '',
    time: '',
    status: '',
  };

  @Input() showSearch1 = true;
  @Input() showSearch2 = true;
  @Input() showTime = true;

  @Input() placeholder1 = 'Search';
  @Input() placeholder2 = 'Search';

  @Input() statusOptions: StatusOption[] = [
    { label: 'Pending', value: 'PENDING' },
    { label: 'Verified', value: 'VERIFIED' },
    { label: 'Rejected', value: 'REJECTED' },
  ];

  @Output() filtersChanged = new EventEmitter<FilterValues>();
  @Output() filtersCleared = new EventEmitter<void>();

  private filterSubjects: Record<string, Subject<string>> = {};
  private subs: Subscription[] = [];

  ngOnInit(): void {
    const keys = ['search1', 'search2', 'date', 'time', 'status'] as const;
    keys.forEach((key) => {
      const subject = new Subject<string>();
      this.filterSubjects[key] = subject;
      const sub = subject.pipe(debounceTime(300), distinctUntilChanged()).subscribe((value) => {
        this.filtersChanged.emit({ ...this.filters, [key]: value });
      });
      this.subs.push(sub);
    });
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  onFilterChange(key: string, value: string): void {
    this.filterSubjects[key]?.next(value);
  }

  clearFilters(): void {
    this.filtersCleared.emit();
  }
}
