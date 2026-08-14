import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { VideoService } from '../../../core/services/video.service';
import { Video } from '../../../shared/models/video.model';

@Component({
  selector: 'app-video-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './video-details.component.html',
  styleUrl: './video-details.component.scss'
})
export class VideoDetailsComponent implements OnInit {
  video = signal<Video | null>(null);
  related = signal<Video[]>([]);
  loading = signal(true);
  notFound = signal(false);

  constructor(private route: ActivatedRoute, private videoService: VideoService) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) this.fetch(id);
    });
  }

  private fetch(id: string): void {
    this.loading.set(true);
    this.notFound.set(false);
    this.videoService.getById(id).subscribe({
      next: (res) => {
        this.video.set(res.video);
        this.related.set(res.related);
        this.loading.set(false);
      },
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      }
    });
  }

  mediaUrl(path: string | null): string {
    return this.videoService.mediaUrl(path);
  }
}
