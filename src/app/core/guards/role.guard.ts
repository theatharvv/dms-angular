import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/enums';

export const RoleGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.getCurrentUser();

  if (user && (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN)) {
    return true;
  }

  return router.createUrlTree(['']);
};
