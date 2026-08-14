import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VideoService } from '../../../core/services/video.service';
import { CategoryService } from '../../../core/services/category.service';
import { Video, Category } from '../../../shared/models/video.model';

@Component({
  selector: 'app-videos',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './videos.component.html',
  styleUrl: './videos.component.scss'
})
export class VideosComponent implements OnInit {
  videos = signal<Video[]>([]);
  categories = signal<Category[]>([]);
  loading = signal(true);
  toast = signal<{ text: string; error?: boolean } | null>(null);
  confirmDeleteId = signal<number | null>(null);

  statusFilter = '';
  categoryFilter = '';
  searchTerm = '';

  constructor(private videoService: VideoService, private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.categoryService.list().subscribe({ next: (res) => this.categories.set(res.categories) });
    this.fetch();
  }

  fetch(): void {
    this.loading.set(true);
    this.videoService
      .adminList({ status: this.statusFilter || undefined, category: this.categoryFilter ? Number(this.categoryFilter) : undefined, search: this.searchTerm || undefined })
      .subscribe({
        next: (res) => {
          this.videos.set(res.videos);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
  }

  showToast(text: string, error = false): void {
    this.toast.set({ text, error });
    setTimeout(() => this.toast.set(null), 3000);
  }

  toggleStatus(v: Video): void {
    const newStatus = v.status === 'published' ? 'draft' : 'published';
    this.videoService.setStatus(v.id, newStatus).subscribe({
      next: () => {
        this.showToast(newStatus === 'published' ? 'Video published' : 'Video unpublished');
        this.fetch();
      },
      error: () => this.showToast('Failed to update status', true)
    });
  }

  toggleFeatured(v: Video): void {
    const newFeatured = !v.featured;
    this.videoService.setFeatured(v.id, newFeatured).subscribe({
      next: () => {
        this.showToast(newFeatured ? 'Video featured' : 'Video unfeatured');
        this.fetch();
      },
      error: () => this.showToast('Failed to update featured state', true)
    });
  }

  askDelete(id: number): void {
    this.confirmDeleteId.set(id);
  }

  cancelDelete(): void {
    this.confirmDeleteId.set(null);
  }

  confirmDelete(): void {
    const id = this.confirmDeleteId();
    if (!id) return;
    this.videoService.delete(id).subscribe({
      next: () => {
        this.showToast('Video deleted');
        this.confirmDeleteId.set(null);
        this.fetch();
      },
      error: () => {
        this.showToast('Failed to delete video', true);
        this.confirmDeleteId.set(null);
      }
    });
  }

  mediaUrl(path: string | null): string {
    return this.videoService.mediaUrl(path);
  }
}
