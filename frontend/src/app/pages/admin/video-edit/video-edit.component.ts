import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { VideoService } from '../../../core/services/video.service';
import { CategoryService } from '../../../core/services/category.service';
import { Category } from '../../../shared/models/video.model';

@Component({
  selector: 'app-video-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './video-edit.component.html',
  styleUrl: './video-edit.component.scss'
})
export class VideoEditComponent implements OnInit {
  categories = signal<Category[]>([]);
  loading = signal(true);
  submitting = signal(false);
  errorMsg = signal('');
  videoFileName = signal('');
  thumbFileName = signal('');
  currentThumbUrl = signal('');
  videoId!: string;

  private videoFile: File | null = null;
  private thumbFile: File | null = null;

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private videoService: VideoService,
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      title: ['', [Validators.required]],
      clientName: ['', [Validators.required]],
      description: [''],
      categoryId: [''],
      campaignType: [''],
      status: ['draft'],
      featured: [false]
    });
  }

  ngOnInit(): void {
    this.categoryService.list().subscribe({ next: (res) => this.categories.set(res.categories) });

    this.videoId = this.route.snapshot.paramMap.get('id')!;
    this.videoService.adminGet(this.videoId).subscribe({
      next: (res) => {
        const v = res.video;
        this.form.patchValue({
          title: v.title,
          clientName: v.clientName,
          description: v.description || '',
          categoryId: v.category ? String(v.category.id) : '',
          campaignType: v.campaignType || '',
          status: v.status,
          featured: v.featured
        });
        this.currentThumbUrl.set(this.videoService.mediaUrl(v.thumbnailUrl));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.errorMsg.set('Video not found.');
      }
    });
  }

  onVideoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.videoFile = file;
    this.videoFileName.set(file.name);
  }

  onThumbSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.thumbFile = file;
    this.thumbFileName.set(file.name);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMsg.set('');

    const v = this.form.value;
    const formData = new FormData();
    formData.append('title', v.title!);
    formData.append('clientName', v.clientName!);
    formData.append('description', v.description || '');
    formData.append('categoryId', v.categoryId || '');
    formData.append('campaignType', v.campaignType || '');
    formData.append('status', v.status || 'draft');
    formData.append('featured', String(!!v.featured));
    if (this.videoFile) formData.append('video', this.videoFile);
    if (this.thumbFile) formData.append('thumbnail', this.thumbFile);

    this.videoService.update(this.videoId, formData).subscribe({
      next: () => this.router.navigate(['/admin/videos']),
      error: (err) => {
        this.submitting.set(false);
        this.errorMsg.set(err?.error?.message || 'Update failed. Please try again.');
      }
    });
  }
}
