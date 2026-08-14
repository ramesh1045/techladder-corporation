import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Protects every /admin/* route except /admin/login.
 * NOTE: this is a UX convenience only. The real security boundary is the
 * backend's requireAuth middleware, which verifies the JWT on every request.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  router.navigate(['/admin/login']);
  return false;
};
