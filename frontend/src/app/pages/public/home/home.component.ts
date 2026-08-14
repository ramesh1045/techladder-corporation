import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { VideoService } from '../../../core/services/video.service';
import { Video } from '../../../shared/models/video.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  featured = signal<Video[]>([]);
  loading = signal(true);

  constructor(private videoService: VideoService) {}

  ngOnInit(): void {
    this.videoService.list({ featured: true, limit: 6 }).subscribe({
      next: (res) => {
        this.featured.set(res.videos);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  mediaUrl(path: string | null): string {
    return this.videoService.mediaUrl(path);
  }
}
