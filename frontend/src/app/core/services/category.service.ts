import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category } from '../../shared/models/video.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly publicUrl = `${environment.apiBaseUrl}/public/categories`;
  private readonly adminUrl = `${environment.apiBaseUrl}/admin/categories`;

  constructor(private http: HttpClient) {}

  list(): Observable<{ success: boolean; categories: Category[] }> {
    return this.http.get<{ success: boolean; categories: Category[] }>(this.publicUrl);
  }

  create(name: string): Observable<{ success: boolean; category: Category }> {
    return this.http.post<{ success: boolean; category: Category }>(this.adminUrl, { name });
  }

  update(id: number, name: string): Observable<{ success: boolean; category: Category }> {
    return this.http.put<{ success: boolean; category: Category }>(`${this.adminUrl}/${id}`, { name });
  }

  delete(id: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.adminUrl}/${id}`);
  }
}
