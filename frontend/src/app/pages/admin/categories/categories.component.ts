import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../../core/services/category.service';
import { Category } from '../../../shared/models/video.model';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss'
})
export class CategoriesComponent implements OnInit {
  categories = signal<Category[]>([]);
  loading = signal(true);
  toast = signal<{ text: string; error?: boolean } | null>(null);
  confirmDeleteId = signal<number | null>(null);

  newCategoryName = '';
  editingId: number | null = null;
  editingName = '';

  constructor(private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.fetch();
  }

  fetch(): void {
    this.loading.set(true);
    this.categoryService.list().subscribe({
      next: (res) => {
        this.categories.set(res.categories);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  showToast(text: string, error = false): void {
    this.toast.set({ text, error });
    setTimeout(() => this.toast.set(null), 3000);
  }

  addCategory(): void {
    if (!this.newCategoryName.trim()) return;
    this.categoryService.create(this.newCategoryName.trim()).subscribe({
      next: () => {
        this.newCategoryName = '';
        this.showToast('Category created');
        this.fetch();
      },
      error: (err) => this.showToast(err?.error?.message || 'Failed to create category', true)
    });
  }

  startEdit(c: Category): void {
    this.editingId = c.id;
    this.editingName = c.name;
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editingName = '';
  }

  saveEdit(id: number): void {
    if (!this.editingName.trim()) return;
    this.categoryService.update(id, this.editingName.trim()).subscribe({
      next: () => {
        this.cancelEdit();
        this.showToast('Category updated');
        this.fetch();
      },
      error: (err) => this.showToast(err?.error?.message || 'Failed to update category', true)
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
    this.categoryService.delete(id).subscribe({
      next: () => {
        this.showToast('Category deleted');
        this.confirmDeleteId.set(null);
        this.fetch();
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Failed to delete category', true);
        this.confirmDeleteId.set(null);
      }
    });
  }
}
