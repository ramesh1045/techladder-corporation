import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/public-layout/public-layout.component').then(m => m.PublicLayoutComponent),
    children: [
      { path: '', loadComponent: () => import('./pages/public/home/home.component').then(m => m.HomeComponent) },
      { path: 'work', loadComponent: () => import('./pages/public/work/work.component').then(m => m.WorkComponent) },
      { path: 'work/:id', loadComponent: () => import('./pages/public/video-details/video-details.component').then(m => m.VideoDetailsComponent) },
      { path: 'about', loadComponent: () => import('./pages/public/about/about.component').then(m => m.AboutComponent) },
      { path: 'contact', loadComponent: () => import('./pages/public/contact/contact.component').then(m => m.ContactComponent) }
    ]
  },
  {
    path: 'admin',
    children: [
      { path: 'login', loadComponent: () => import('./pages/admin/login/login.component').then(m => m.LoginComponent) },
      {
        path: '',
        loadComponent: () => import('./layout/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
        canActivate: [authGuard],
        children: [
          { path: 'dashboard', loadComponent: () => import('./pages/admin/dashboard/dashboard.component').then(m => m.DashboardComponent) },
          { path: 'videos', loadComponent: () => import('./pages/admin/videos/videos.component').then(m => m.VideosComponent) },
          { path: 'videos/upload', loadComponent: () => import('./pages/admin/video-upload/video-upload.component').then(m => m.VideoUploadComponent) },
          { path: 'videos/edit/:id', loadComponent: () => import('./pages/admin/video-edit/video-edit.component').then(m => m.VideoEditComponent) },
          { path: 'categories', loadComponent: () => import('./pages/admin/categories/categories.component').then(m => m.CategoriesComponent) },
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
        ]
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
