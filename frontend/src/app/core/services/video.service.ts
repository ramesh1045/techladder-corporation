import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  VideoListResponse,
  VideoDetailResponse,
  AdminVideoListResponse,
  Video
} from '../../shared/models/video.model';

export interface PublicVideoQuery {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  featured?: boolean;
}

@Injectable({ providedIn: 'root' })
export class VideoService {
  private readonly publicUrl = `${environment.apiBaseUrl}/public/videos`;
  private readonly adminUrl = `${environment.apiBaseUrl}/admin/videos`;

  constructor(private http: HttpClient) {}

  // ---------------- Public ----------------

  list(query: PublicVideoQuery = {}): Observable<VideoListResponse> {
    let params = new HttpParams();
    if (query.page) params = params.set('page', query.page);
    if (query.limit) params = params.set('limit', query.limit);
    if (query.category) params = params.set('category', query.category);
    if (query.search) params = params.set('search', query.search);
    if (query.featured) params = params.set('featured', 'true');

    return this.http.get<VideoListResponse>(this.publicUrl, { params });
  }

  getById(id: number | string): Observable<VideoDetailResponse> {
    return this.http.get<VideoDetailResponse>(`${this.publicUrl}/${id}`);
  }

  // ---------------- Admin ----------------

  adminList(params: { status?: string; category?: number; search?: string } = {}): Observable<AdminVideoListResponse> {
    let httpParams = new HttpParams();
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.category) httpParams = httpParams.set('category', params.category);
    if (params.search) httpParams = httpParams.set('search', params.search);
    return this.http.get<AdminVideoListResponse>(this.adminUrl, { params: httpParams });
  }

  adminGet(id: number | string): Observable<{ success: boolean; video: Video }> {
    return this.http.get<{ success: boolean; video: Video }>(`${this.adminUrl}/${id}`);
  }

  create(formData: FormData): Observable<{ success: boolean; video: Video }> {
    return this.http.post<{ success: boolean; video: Video }>(this.adminUrl, formData);
  }

  update(id: number | string, formData: FormData): Observable<{ success: boolean; video: Video }> {
    return this.http.put<{ success: boolean; video: Video }>(`${this.adminUrl}/${id}`, formData);
  }

  delete(id: number | string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.adminUrl}/${id}`);
  }

  setStatus(id: number | string, status: 'draft' | 'published'): Observable<{ success: boolean }> {
    return this.http.patch<{ success: boolean }>(`${this.adminUrl}/${id}/status`, { status });
  }

  setFeatured(id: number | string, featured: boolean): Observable<{ success: boolean }> {
    return this.http.patch<{ success: boolean }>(`${this.adminUrl}/${id}/featured`, { featured });
  }

  /** Resolves a relative media path returned by the API into an absolute URL. */
  mediaUrl(relativePath: string | null): string {
    if (!relativePath) return '';
    if (relativePath.startsWith('http')) return relativePath;
    return `${environment.mediaBaseUrl}${relativePath}`;
  }
}
