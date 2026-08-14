import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { VideoService } from '../../../core/services/video.service';
import { Video } from '../../../shared/models/video.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  stats = signal({ total: 0, published: 0, draft: 0, featured: 0 });
  recent = signal<Video[]>([]);
  loading = signal(true);

  constructor(private videoService: VideoService) {}

  ngOnInit(): void {
    this.videoService.adminList().subscribe({
      next: (res) => {
        this.stats.set(res.stats);
        this.recent.set(res.videos.slice(0, 6));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  mediaUrl(path: string | null): string {
    return this.videoService.mediaUrl(path);
  }
}
