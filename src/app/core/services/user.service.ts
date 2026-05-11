import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private USERS_KEY = 'users';

  constructor(private storage: StorageService) {}

  getUsers(): User[] {
    return this.storage.get<User[]>(this.USERS_KEY) || [];
  }

  addUser(user: User): void {
    const users = this.getUsers();

    if (this.isEmailTaken(users, user.email)) {
      throw new Error(`A user with email "${user.email}" already exists.`);
    }

    users.push(user);
    this.storage.set(this.USERS_KEY, users);
  }

  updateUser(updatedUser: User): void {
    const users = this.getUsers().map((u) => (u.id === updatedUser.id ? updatedUser : u));
    this.storage.set(this.USERS_KEY, users);
  }

  deleteUser(userId: string): void {
    const users = this.getUsers().filter((u) => u.id !== userId);
    this.storage.set(this.USERS_KEY, users);
  }

  private isEmailTaken(users: User[], email: string, excludeId?: string): boolean {
     const normalizedEmail = email.trim().toLowerCase();
    return users.some((u) => u.email.toLowerCase() === normalizedEmail && u.id !== excludeId);
  }
}
