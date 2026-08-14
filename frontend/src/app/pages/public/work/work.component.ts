import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VideoService } from '../../../core/services/video.service';
import { CategoryService } from '../../../core/services/category.service';
import { Video, Category, Pagination } from '../../../shared/models/video.model';

@Component({
  selector: 'app-work',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './work.component.html',
  styleUrl: './work.component.scss'
})
export class WorkComponent implements OnInit {
  videos = signal<Video[]>([]);
  categories = signal<Category[]>([]);
  loading = signal(true);
  pagination = signal<Pagination | null>(null);

  selectedCategory = '';
  searchTerm = '';
  page = 1;

  constructor(private videoService: VideoService, private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.categoryService.list().subscribe({
      next: (res) => this.categories.set(res.categories)
    });
    this.fetch();
  }

  fetch(): void {
    this.loading.set(true);
    this.videoService
      .list({ page: this.page, limit: 9, category: this.selectedCategory || undefined, search: this.searchTerm || undefined })
      .subscribe({
        next: (res) => {
          this.videos.set(res.videos);
          this.pagination.set(res.pagination);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
  }

  onFilterChange(): void {
    this.page = 1;
    this.fetch();
  }

  goToPage(p: number): void {
    if (p < 1 || (this.pagination() && p > this.pagination()!.totalPages)) return;
    this.page = p;
    this.fetch();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  mediaUrl(path: string | null): string {
    return this.videoService.mediaUrl(path);
  }
}
