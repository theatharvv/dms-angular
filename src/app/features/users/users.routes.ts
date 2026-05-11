import { Routes } from '@angular/router';
import { UserListComponent } from './pages/user-list/user-list';
import { AddUserComponent } from './pages/add-user/add-user';
import { EditUserComponent } from './pages/edit-user/edit-user';
import { RoleGuard } from '../../core/guards/role.guard';

export const USER_ROUTES: Routes = [
  {
    path: '',
    canActivateChild: [RoleGuard],
    children: [
      { path: '', component: UserListComponent },
      { path: 'add', component: AddUserComponent },
      { path: ':id/edit', component: EditUserComponent }
    ]
  }
];