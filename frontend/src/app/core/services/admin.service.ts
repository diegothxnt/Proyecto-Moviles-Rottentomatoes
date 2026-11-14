import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);

  getUsers() {
    return this.http.get<{ data: User[] }>(`${environment.apiUrl}/admin/users`);
  }

  updateRole(userId: string, role: string) {
    return this.http.patch<{ data: User }>(`${environment.apiUrl}/admin/users/${userId}/role`, { role });
  }

  toggleStatus(userId: string) {
    return this.http.patch<{ data: User; message: string }>(`${environment.apiUrl}/admin/users/${userId}/status`, {});
  }

  deleteUser(userId: string) {
    return this.http.delete<{ success: boolean; message: string }>(`${environment.apiUrl}/admin/users/${userId}`);
  }
}