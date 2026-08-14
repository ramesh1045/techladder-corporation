import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { VideoService } from '../../../core/services/video.service';
import { CategoryService } from '../../../core/services/category.service';
import { Category } from '../../../shared/models/video.model';

@Component({
  selector: 'app-video-upload',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './video-upload.component.html',
  styleUrl: './video-upload.component.scss'
})
export class VideoUploadComponent implements OnInit {
  categories = signal<Category[]>([]);
  submitting = signal(false);
  errorMsg = signal('');
  videoFileName = signal('');
  thumbFileName = signal('');

  private videoFile: File | null = null;
  private thumbFile: File | null = null;

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private videoService: VideoService,
    private categoryService: CategoryService,
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
    if (!this.videoFile) {
      this.errorMsg.set('Please select a video file to upload.');
      return;
    }

    this.submitting.set(true);
    this.errorMsg.set('');

    const v = this.form.value;
    const formData = new FormData();
    formData.append('title', v.title!);
    formData.append('clientName', v.clientName!);
    formData.append('description', v.description || '');
    if (v.categoryId) formData.append('categoryId', v.categoryId);
    formData.append('campaignType', v.campaignType || '');
    formData.append('status', v.status || 'draft');
    formData.append('featured', String(!!v.featured));
    formData.append('video', this.videoFile);
    if (this.thumbFile) formData.append('thumbnail', this.thumbFile);

    this.videoService.create(formData).subscribe({
      next: () => this.router.navigate(['/admin/videos']),
      error: (err) => {
        this.submitting.set(false);
        this.errorMsg.set(err?.error?.message || 'Upload failed. Please try again.');
      }
    });
  }
}
