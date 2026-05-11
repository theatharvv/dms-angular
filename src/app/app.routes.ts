import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { AUTH_ROUTES } from './features/auth/auth.routes';

export const routes: Routes = [
  {
    path: '',
    title: 'WebBox',
    children: AUTH_ROUTES,
  },
  {
    path: 'dashboard',
    title: 'Dashboard',
    loadChildren: () =>
      import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES),
    canMatch: [AuthGuard]
  },
  {
    path: 'users',
    title: 'User Management',
    loadChildren: () =>
      import('./features/users/users.routes').then(m => m.USER_ROUTES),
    canMatch: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];